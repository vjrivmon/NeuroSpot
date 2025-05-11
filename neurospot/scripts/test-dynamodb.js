// Importar las dependencias necesarias
const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand
} = require("@aws-sdk/lib-dynamodb");
const dotenv = require("dotenv");

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

// Información de las credenciales cargadas
console.log("=== Configuración ===");
console.log(`Región: ${process.env.AWS_REGION}`);
console.log(`Access Key ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 5)}...`);
console.log(`Secret Access Key: ${process.env.AWS_SECRET_ACCESS_KEY ? "***" : "No encontrada"}`);

// Cliente DynamoDB
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Cliente de documento para operaciones más sencillas
const docClient = DynamoDBDocumentClient.from(client);

// Nombres de las tablas en DynamoDB
const TABLES = {
  USERS: "NeuroSpot_Users",
  EXERCISE_RESULTS: "NeuroSpot_ExerciseResults",
  SESSION_DATA: "NeuroSpot_SessionData",
};

// Función principal de prueba
async function runTests() {
  console.log("\n=== Iniciando pruebas de DynamoDB ===");
  
  try {
    // 1. Listar tablas para verificar conexión
    console.log("\n1. Verificando conexión y listando tablas...");
    const listTablesResponse = await client.send(new ListTablesCommand({}));
    console.log("Tablas disponibles:", listTablesResponse.TableNames);
    
    // Verificar que nuestras tablas existen
    const requiredTables = Object.values(TABLES);
    const missingTables = requiredTables.filter(table => !listTablesResponse.TableNames?.includes(table));
    
    if (missingTables.length > 0) {
      console.error(`Error: No se encontraron las siguientes tablas: ${missingTables.join(", ")}`);
      return;
    }
    
    console.log("✅ Todas las tablas necesarias están disponibles");
    
    // 2. Insertar un usuario de prueba
    console.log("\n2. Insertando usuario de prueba...");
    const testUserId = `test.user.${Date.now()}@example.com`;
    const userData = {
      userId: testUserId,
      type: "profile",
      email: testUserId,
      nombre: "Tutor Prueba",
      nombreNino: "Niño Prueba",
      nivelEducativo: "primaria",
      curso: "3º de Primaria",
      apoyoClase: false,
      createdAt: new Date().toISOString(),
    };
    
    await docClient.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: userData
    }));
    
    console.log(`✅ Usuario de prueba creado con ID: ${testUserId}`);
    
    // 3. Recuperar el usuario insertado
    console.log("\n3. Recuperando usuario de prueba...");
    const getUserResponse = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: {
        userId: testUserId,
        type: "profile"
      }
    }));
    
    console.log("Datos del usuario recuperado:", getUserResponse.Item);
    
    // 4. Insertar resultado de ejercicio de prueba
    console.log("\n4. Insertando resultado de ejercicio de prueba...");
    const timestamp = new Date().toISOString();
    const exerciseId = `stroop_${timestamp}`;
    const exerciseData = {
      userId: testUserId,
      exerciseId,
      timestamp,
      tipo: "stroop",
      puntuacion: 85,
      duracion: 60,
      detalles: {
        total: 100,
        porcentajeAciertos: 85,
        tiempoTotal: 60
      }
    };
    
    await docClient.send(new PutCommand({
      TableName: TABLES.EXERCISE_RESULTS,
      Item: exerciseData
    }));
    
    console.log(`✅ Resultado de ejercicio creado con ID: ${exerciseId}`);
    
    // 5. Iniciar sesión de prueba
    console.log("\n5. Iniciando sesión de prueba...");
    const sessionId = new Date().toISOString();
    const sessionData = {
      userId: testUserId,
      sessionId,
      fecha: sessionId,
      ejerciciosRealizados: ["stroop"],
      tiempoTotal: 0,
      inicioSesion: sessionId
    };
    
    await docClient.send(new PutCommand({
      TableName: TABLES.SESSION_DATA,
      Item: sessionData
    }));
    
    console.log(`✅ Sesión de prueba iniciada con ID: ${sessionId}`);
    
    // 6. Recuperar todos los ejercicios del usuario
    console.log("\n6. Recuperando ejercicios del usuario...");
    const queryExercisesResponse = await docClient.send(new QueryCommand({
      TableName: TABLES.EXERCISE_RESULTS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": testUserId
      }
    }));
    
    console.log(`Ejercicios encontrados: ${queryExercisesResponse.Items?.length || 0}`);
    console.log("Datos del primer ejercicio:", queryExercisesResponse.Items?.[0]);
    
    // 7. Recuperar todas las sesiones del usuario
    console.log("\n7. Recuperando sesiones del usuario...");
    const querySessionsResponse = await docClient.send(new QueryCommand({
      TableName: TABLES.SESSION_DATA,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": testUserId
      }
    }));
    
    console.log(`Sesiones encontradas: ${querySessionsResponse.Items?.length || 0}`);
    console.log("Datos de la primera sesión:", querySessionsResponse.Items?.[0]);
    
    console.log("\n=== Pruebas completadas con éxito ===");
    console.log("Los datos insertados son accesibles a través de la consola de AWS DynamoDB:");
    console.log(`https://${process.env.AWS_REGION}.console.aws.amazon.com/dynamodbv2/home?region=${process.env.AWS_REGION}#tables`);
    
  } catch (error) {
    console.error("❌ Error durante las pruebas:", error);
  }
}

// Ejecutar las pruebas
runTests(); 