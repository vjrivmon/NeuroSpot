"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Info } from "lucide-react"
import { useLocalAuth } from "../providers/auth-provider"
import { userService, sessionService } from "@/lib/dynamo-service"

// Esquema de validación con Zod
const formSchema = z.object({
  nombreNino: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres."
  }),
  nivelEducativo: z.string({
    required_error: "Por favor selecciona un nivel educativo."
  }),
  curso: z.string({
    required_error: "Por favor selecciona un curso."
  }),
  apoyoClase: z.boolean().default(false),
  nombreTutor: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres."
  }),
  email: z.string().email({
    message: "Introduce un correo electrónico válido."
  }),
  dniTutor: z.string().regex(/^[0-9]{8}[A-Za-z]$/, {
    message: "Introduce un DNI válido (8 números y 1 letra)."
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres."
  })
})

type FormValues = z.infer<typeof formSchema>

export default function RegistroPage() {
  const router = useRouter()
  const [cursos, setCursos] = useState<string[]>([])
  const [formIsValid, setFormIsValid] = useState(false)
  const localAuth = useLocalAuth()
  
  // Inicializar formulario con React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreNino: "",
      nivelEducativo: "",
      curso: "",
      apoyoClase: false,
      nombreTutor: "",
      email: "",
      dniTutor: "",
      password: ""
    },
    mode: "onChange" // Validar al cambiar los campos
  })
  
  // Actualizar las opciones de curso basadas en el nivel educativo seleccionado
  useEffect(() => {
    const nivelEducativo = form.watch("nivelEducativo")
    
    if (nivelEducativo === "primaria") {
      setCursos(["1º de Primaria", "2º de Primaria", "3º de Primaria", "4º de Primaria", "5º de Primaria", "6º de Primaria"])
    } else if (nivelEducativo === "secundaria") {
      setCursos(["1º de ESO", "2º de ESO", "3º de ESO", "4º de ESO"])
    } else if (nivelEducativo === "bachillerato") {
      setCursos(["1º de Bachillerato", "2º de Bachillerato"])
    } else {
      setCursos([])
    }
    
    // Restablecer el valor del curso cuando cambia el nivel educativo
    form.setValue("curso", "")
  }, [form.watch("nivelEducativo"), form])
  
  // Verificar validez del formulario cuando cambien los valores
  useEffect(() => {
    const subscription = form.watch(() => {
      // Verificar si todos los campos requeridos tienen valores
      const requiredFields = ['nombreNino', 'nivelEducativo', 'curso', 'nombreTutor', 'email', 'dniTutor', 'password'];
      const allFieldsHaveValues = requiredFields.every(field => {
        const fieldValue = form.getValues(field as keyof FormValues);
        // Verificar si el valor existe y es un string con longitud mayor que 0
        return typeof fieldValue === 'string' && fieldValue.length > 0;
      });
      
      if (allFieldsHaveValues) {
        // Verificar si el DNI tiene el formato correcto
        const dniValue = form.getValues('dniTutor');
        const dniIsValid = /^[0-9]{8}[A-Za-z]$/.test(dniValue);
        
        // Verificar si el correo tiene formato válido
        const emailValue = form.getValues('email');
        const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
        
        // Verificar si los nombres tienen al menos 2 caracteres
        const nombreNino = form.getValues('nombreNino');
        const nombreTutor = form.getValues('nombreTutor');
        const nombresValidos = nombreNino.length >= 2 && nombreTutor.length >= 2;
        
        // Verificar si la contraseña tiene al menos 6 caracteres
        const password = form.getValues('password');
        const passwordValida = password.length >= 6;
        
        setFormIsValid(dniIsValid && emailIsValid && nombresValidos && passwordValida);
      } else {
        setFormIsValid(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Función para manejar el envío del formulario
  async function onSubmit(data: FormValues) {
    try {
      // Guardar en localStorage para uso futuro (compatibilidad con código existente)
      localStorage.setItem("datosParticipante", JSON.stringify(data));
      
      // Guardar usuario en DynamoDB
      const result = await userService.createUser(data);
      
      if (!result.success) {
        console.error("Error al guardar usuario en DynamoDB:", result.error);
        // Continuar con la autenticación local aunque falle DynamoDB
      }
      
      // Establecer el estado de inicio de sesión usando la autenticación local
      localAuth.login(data.email);
      
      // Iniciar sesión en DynamoDB
      // No bloqueamos la navegación con await para que sea más rápida la experiencia
      sessionService.startSession(data.email);
      
      // Navegar a la página de consentimiento
      router.push("/consentimiento");
    } catch (error) {
      console.error("Error en el proceso de registro:", error);
      // Continuar con la autenticación local aunque falle DynamoDB
      localAuth.login(data.email);
      router.push("/consentimiento");
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Datos del participante</CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Todos los datos proporcionados se utilizarán únicamente para personalizar la experiencia de evaluación.
                  Esta información no será compartida con terceros y se almacenará de forma segura en su dispositivo.
                </p>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Sección datos del niño */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg border-b pb-2">Datos del niño/a</h3>
                  
                  <FormField
                    control={form.control}
                    name="nombreNino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre y apellidos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nivelEducativo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nivel educativo <span className="text-red-500">*</span></FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un nivel" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="primaria">Primaria</SelectItem>
                              <SelectItem value="secundaria">Secundaria (ESO)</SelectItem>
                              <SelectItem value="bachillerato">Bachillerato</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="curso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curso <span className="text-red-500">*</span></FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={cursos.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un curso" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cursos.map((curso) => (
                                <SelectItem key={curso} value={curso}>{curso}</SelectItem>
                              ))}
                              {form.watch("nivelEducativo") === "otro" && (
                                <SelectItem value="no_aplica">No aplica</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="apoyoClase"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Recibe apoyo educativo en clase</FormLabel>
                          <FormDescription>
                            Marque esta casilla si el niño cuenta con algún tipo de apoyo especial
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Sección datos del tutor */}
                <div className="space-y-4 pt-4">
                  <h3 className="font-medium text-lg border-b pb-2">Datos del tutor/a</h3>
                  
                  <FormField
                    control={form.control}
                    name="nombreTutor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo del tutor <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre y apellidos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="dniTutor"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>DNI <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="12345678A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Contraseña <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Mínimo 6 caracteres" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full shadow-md"
                    disabled={!formIsValid}
                  >
                    Continuar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 