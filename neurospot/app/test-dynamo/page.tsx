"use client"

import { useState, useEffect } from "react"
import { useDynamo } from "@/hooks/use-dynamo"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function TestDynamoPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configStatus, setConfigStatus] = useState<{
    region: string | null,
    keyId: string | null,
    secretAvailable: boolean
  }>({
    region: null,
    keyId: null,
    secretAvailable: false
  })
  
  const dynamo = useDynamo()
  
  // Verificar configuración al cargar
  useEffect(() => {
    setConfigStatus({
      region: process.env.NEXT_PUBLIC_AWS_REGION || null,
      keyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || null,
      secretAvailable: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
    })
  }, [])
  
  // Función para probar la conexión a DynamoDB
  const testConnection = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)

    try {
      // Mostrar que se está ejecutando la prueba
      console.log("Iniciando prueba de conexión a DynamoDB...")
      
      // Crear un usuario de prueba
      const testId = `test-${Date.now()}`
      const userData = {
        email: `${testId}@example.com`,
        nombreTutor: "Test Tutor",
        nombreNino: "Test Niño",
        nivelEducativo: "primaria",
        curso: "3º de Primaria",
        apoyoClase: false
      }
      
      console.log("Datos de prueba a guardar:", userData)
      
      // Guardar usuario en DynamoDB
      const result = await dynamo.updateUserProfile(userData)
      console.log("Resultado de la operación:", result)
      
      // Resultado de la prueba
      setTestResult({
        success: result.success,
        userData: userData,
        timestamp: new Date().toISOString(),
        rawResult: JSON.stringify(result)
      })
    } catch (err) {
      console.error("Error al probar la conexión:", err)
      setError(`Error de conexión: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <main className="container max-w-4xl mx-auto px-4 py-8">
      <Card className="shadow-lg mb-6">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Prueba de conexión a DynamoDB</CardTitle>
          <CardDescription>
            Esta página permite probar la conexión con Amazon DynamoDB y verificar las operaciones CRUD
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2 text-lg">Información de configuración:</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">Región:</div>
                <div className={configStatus.region ? "text-green-600" : "text-red-600"}>
                  {configStatus.region || "No configurada ❌"}
                </div>
                
                <div className="font-semibold">Access Key ID:</div>
                <div className={configStatus.keyId ? "text-green-600" : "text-red-600"}>
                  {configStatus.keyId ? 
                    `${configStatus.keyId.substring(0, 5)}... ✅` : 
                    "No configurada ❌"}
                </div>
                
                <div className="font-semibold">Secret Access Key:</div>
                <div className={configStatus.secretAvailable ? "text-green-600" : "text-red-600"}>
                  {configStatus.secretAvailable ? 
                    "Configurada ✅" : 
                    "No configurada ❌"}
                </div>
                
                <div className="font-semibold">Estado del hook:</div>
                <div>
                  {dynamo.isLoading ? 
                    "Cargando..." : 
                    (dynamo.userId ? `Usuario activo: ${dynamo.userId} ✅` : "No hay usuario activo ❓")}
                </div>
              </div>
            </div>
            
            {testResult && (
              <Alert 
                className={`border-l-4 ${testResult.success ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50"}`}
              >
                <AlertTitle className="text-lg font-bold">
                  {testResult.success ? "✅ Prueba completada con éxito" : "❌ Error en la prueba"}
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    <p><strong>Estado:</strong> {testResult.success ? "Conexión exitosa" : "Error de conexión"}</p>
                    <p><strong>Timestamp:</strong> {testResult.timestamp}</p>
                    <p><strong>Usuario de prueba:</strong> {testResult.userData.email}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Ver respuesta completa</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {testResult.rawResult}
                      </pre>
                    </details>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error de conexión</AlertTitle>
                <AlertDescription>
                  <p>{error}</p>
                  <p className="mt-2 text-sm">Verifica la configuración de AWS en las variables de entorno.</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <Button 
            onClick={testConnection} 
            disabled={isLoading} 
            className="w-full"
            size="lg"
          >
            {isLoading ? "Probando conexión..." : "Probar conexión a DynamoDB"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Pasos para solucionar problemas</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal ml-5 space-y-2">
            <li>Verifica que las <strong>variables de entorno</strong> estén correctamente configuradas en <code>.env.local</code></li>
            <li>Asegúrate de que las <strong>tablas de DynamoDB</strong> han sido creadas correctamente</li>
            <li>Comprueba que las <strong>credenciales de AWS</strong> tienen permisos suficientes para DynamoDB</li>
            <li>Revisa la <strong>consola del navegador</strong> para ver errores detallados</li>
            <li>Verifica que estás <strong>autenticado</strong> (algunas operaciones requieren tener un userId)</li>
          </ol>
        </CardContent>
      </Card>
    </main>
  )
} 