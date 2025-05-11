// Script para comprobar los datos de un usuario específico y sus resultados
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  GetCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

// Configuración de AWS usando variables de entorno
const AWS_CONFIG = {
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Cliente DynamoDB
const client = new DynamoDBClient(AWS_CONFIG);

// Cliente de documento para operaciones más sencillas
const docClient = DynamoDBDocumentClient.from(client);

// Nombres de las tablas en DynamoDB
const TABLES = {
  USERS: "NeuroSpot_Users",
  EXERCISE_RESULTS: "NeuroSpot_ExerciseResults",
  SESSION_DATA: "NeuroSpot_SessionData",
};

// Email del usuario a verificar
const userEmail = "vicenterivas773@gmail.com";

async function checkUser() {
  console.log(`\n=== Comprobando datos del usuario: ${userEmail} ===`);
  
  try {
    // 1. Verificar si el usuario existe
    console.log("\n1. Buscando perfil del usuario...");
    const getUserResponse = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: {
        userId: userEmail,
        type: "profile"
      }
    }));
    
    if (!getUserResponse.Item) {
      console.error(`❌ No se encontró el usuario con email: ${userEmail}`);
      return;
    }
    
    console.log("✅ Usuario encontrado:");
    console.log(JSON.stringify(getUserResponse.Item, null, 2));
    
    // 2. Recuperar todos los ejercicios del usuario
    console.log("\n2. Recuperando resultados de ejercicios...");
    const queryExercisesResponse = await docClient.send(new QueryCommand({
      TableName: TABLES.EXERCISE_RESULTS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userEmail
      }
    }));
    
    const exercises = queryExercisesResponse.Items || [];
    console.log(`✅ Se encontraron ${exercises.length} resultados de ejercicios`);
    
    // Agrupar ejercicios por tipo
    const exercisesByType = {};
    exercises.forEach(exercise => {
      const tipo = exercise.tipo;
      if (!exercisesByType[tipo]) {
        exercisesByType[tipo] = [];
      }
      exercisesByType[tipo].push(exercise);
    });
    
    // Mostrar resumen por tipo de ejercicio
    console.log("\n3. Resumen por tipo de ejercicio:");
    for (const [tipo, ejercicios] of Object.entries(exercisesByType)) {
      console.log(`\n=== Tipo: ${tipo} (${ejercicios.length} resultados) ===`);
      
      // Ordenar por timestamp (más reciente primero)
      ejercicios.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Mostrar detalles de cada ejercicio
      ejercicios.forEach((ejercicio, index) => {
        console.log(`\nResultado #${index + 1} (${new Date(ejercicio.timestamp).toLocaleString()}):`);
        console.log(`- Puntuación: ${ejercicio.puntuacion}`);
        console.log(`- Duración: ${ejercicio.duracion} segundos`);
        console.log(`- ID: ${ejercicio.exerciseId}`);
        if (ejercicio.detalles) {
          console.log("- Detalles adicionales:");
          console.log(JSON.stringify(ejercicio.detalles, null, 2));
        }
      });
    }
    
    // 3. Recuperar todas las sesiones del usuario
    console.log("\n4. Recuperando sesiones del usuario...");
    const querySessionsResponse = await docClient.send(new QueryCommand({
      TableName: TABLES.SESSION_DATA,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userEmail
      }
    }));
    
    const sessions = querySessionsResponse.Items || [];
    console.log(`✅ Se encontraron ${sessions.length} sesiones`);
    
    if (sessions.length > 0) {
      console.log("\nDetalles de las sesiones:");
      sessions.forEach((session, index) => {
        console.log(`\nSesión #${index + 1} (${new Date(session.inicioSesion).toLocaleString()}):`);
        console.log(`- ID: ${session.sessionId}`);
        console.log(`- Ejercicios realizados: ${session.ejerciciosRealizados?.join(", ") || "Ninguno"}`);
        if (session.finSesion) {
          console.log(`- Fin de sesión: ${new Date(session.finSesion).toLocaleString()}`);
          console.log(`- Tiempo total: ${session.tiempoTotal} segundos`);
        } else {
          console.log("- Sesión no finalizada");
        }
      });
    }
    
    console.log("\n=== Comprobación finalizada ===");
    
  } catch (error) {
    console.error("❌ Error durante la comprobación:", error);
  }
}

// Ejecutar la comprobación
checkUser(); 