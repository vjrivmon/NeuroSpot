"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { GoogleIcon, AppleIcon, FingerprintIcon, FaceIdIcon } from "@/components/social-icons"
import { Separator } from "@/components/ui/separator"

// Esquema de validación para el formulario de inicio de sesión
const loginSchema = z.object({
  dni: z.string().regex(/^[0-9]{8}[A-Za-z]$/, {
    message: "Introduce un DNI válido (8 números y 1 letra)."
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres."
  })
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Inicializar formulario con React Hook Form
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      dni: "",
      password: ""
    },
    mode: "onChange"
  })
  
  // Función para manejar el envío del formulario
  function onSubmit(data: LoginValues) {
    setLoading(true)
    
    // Simulamos una verificación (en un caso real, llamaríamos a una API)
    setTimeout(() => {
      // En un caso real, aquí verificaríamos las credenciales
      console.log("Inicio de sesión con:", data)
      
      // Almacenamos información de sesión
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("userDNI", data.dni)
      
      // Redirigir al panel
      router.push("/panel")
      setLoading(false)
    }, 1500)
  }
  
  // Función para iniciar sesión con proveedores sociales
  const loginWithProvider = (provider: string) => {
    setLoading(true)
    
    // Simulamos el proceso de autenticación social
    setTimeout(() => {
      console.log(`Inicio de sesión con ${provider}`)
      
      // Almacenamos información de sesión
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("authProvider", provider)
      
      // Redirigir al panel
      router.push("/panel")
      setLoading(false)
    }, 1500)
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header showBackButton />

      <div className="flex-1 container max-w-md mx-auto px-4 py-8 flex flex-col justify-center">
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Iniciar sesión</CardTitle>
            <CardDescription className="text-center mb-4">
              Ingresa tus datos para acceder a la evaluación
            </CardDescription>
            
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10"
                onClick={() => loginWithProvider("google")}
                disabled={loading}
                aria-label="Iniciar sesión con Google"
              >
                <GoogleIcon />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10"
                onClick={() => loginWithProvider("apple")}
                disabled={loading}
                aria-label="Iniciar sesión con Apple"
              >
                <AppleIcon />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10"
                onClick={() => loginWithProvider("fingerprint")}
                disabled={loading}
                aria-label="Iniciar sesión con huella digital"
              >
                <FingerprintIcon />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                className="h-10 w-10"
                onClick={() => loginWithProvider("faceid")}
                disabled={loading}
                aria-label="Iniciar sesión con Face ID"
              >
                <FaceIdIcon />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O inicia sesión con DNI
                </span>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DNI</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678Z" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="******" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link href="/registro" className="text-primary hover:underline">
                  Regístrate
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 