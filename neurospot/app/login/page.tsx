"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { useLocalAuth } from "../providers/auth-provider"
import { useAuth } from "react-oidc-context"

// Esquema de validación para el formulario de inicio de sesión
const loginSchema = z.object({
  email: z.string().email({
    message: "Introduce un correo electrónico válido."
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres."
  })
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const localAuth = useLocalAuth()
  const cognitoAuth = useAuth() // Para cuando USE_COGNITO sea true
  const [emailFromStorage, setEmailFromStorage] = useState("")
  
  // Cargar email del localStorage si existe
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem("userEmail") || "";
      setEmailFromStorage(savedEmail);
    }
  }, []);
  
  // Inicializar formulario con React Hook Form
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailFromStorage,
      password: ""
    },
    mode: "onChange"
  })
  
  // Actualizar valor del email cuando se carga del localStorage
  useEffect(() => {
    if (emailFromStorage) {
      form.setValue("email", emailFromStorage);
    }
  }, [emailFromStorage, form]);
  
  // Redirigir si ya está autenticado
  useEffect(() => {
    if (localAuth.isAuthenticated) {
      router.push("/panel");
    }
  }, [localAuth.isAuthenticated, router]);
  
  // Función para cerrar sesión
  const handleLogout = () => {
    localAuth.logout();
    
    // Si estamos usando Cognito y el usuario está autenticado con Cognito
    if (!localAuth.isLocalAuth && cognitoAuth.isAuthenticated) {
      cognitoAuth.removeUser();
    }
  };
  
  // Función para manejar el envío del formulario
  function onSubmit(data: LoginValues) {
    setLoading(true)
    
    // Usar autenticación local
    setTimeout(() => {
      localAuth.login(data.email);
      router.push("/panel");
      setLoading(false);
    }, 1000);
  }
  
  // Función para iniciar sesión con proveedores sociales
  const loginWithProvider = (provider: string) => {
    setLoading(true)
    
    // Si no usamos autenticación local, redirigir a Cognito
    if (!localAuth.isLocalAuth) {
      cognitoAuth.signinRedirect();
      return;
    }
    
    // Simular login con provider en modo local
    setTimeout(() => {
      const email = "usuario." + provider + "@example.com";
      localAuth.login(email);
      router.push("/panel");
      setLoading(false);
    }, 1000);
  }
  
  // Si está cargando la autenticación
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Header showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <p>Cargando autenticación...</p>
        </div>
      </main>
    )
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
            
            {/* Mostrar botón de cerrar sesión si el usuario está autenticado */}
            {localAuth.isAuthenticated && (
              <div className="flex justify-center mb-4">
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  size="sm"
                >
                  Cerrar sesión actual ({localAuth.email})
                </Button>
              </div>
            )}
            
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
                  O inicia sesión con correo electrónico
                </span>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="ejemplo@ejemplo.com" {...field} />
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