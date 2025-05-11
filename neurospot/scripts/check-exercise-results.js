// Script para comprobar qué tipos de ejercicios están guardados en la base de datos
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  QueryCommand,
  ScanCommand
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

async function checkExerciseTypes() {
  console.log(`\n=== Comprobando tipos de ejercicios guardados en la base de datos ===`);
  
  try {
    // 1. Obtener todos los ejercicios del usuario
    console.log("\n1. Consultando ejercicios guardados para el usuario:", userEmail);
    
    const queryExercisesResponse = await docClient.send(new QueryCommand({
      TableName: TABLES.EXERCISE_RESULTS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userEmail
      }
    }));
    
    const exercises = queryExercisesResponse.Items || [];
    console.log(`✅ Se encontraron ${exercises.length} resultados de ejercicios`);
    
    // 2. Contar por tipo de ejercicio
    const exerciseTypeCount = {};
    exercises.forEach(exercise => {
      const tipo = exercise.tipo;
      exerciseTypeCount[tipo] = (exerciseTypeCount[tipo] || 0) + 1;
    });
    
    console.log("\n2. Resumen por tipo de ejercicio:");
    for (const [tipo, count] of Object.entries(exerciseTypeCount)) {
      console.log(`- ${tipo}: ${count} resultados`);
    }
    
    // 3. Revisar si hay ejercicios faltantes (los esperados son: stroop, lectura, atencion, memoria, observacion, video)
    const expectedTypes = ['stroop', 'lectura', 'atencion', 'memoria', 'observacion', 'video'];
    const missingTypes = expectedTypes.filter(tipo => !exerciseTypeCount[tipo]);
    
    if (missingTypes.length > 0) {
      console.log("\n3. Tipos de ejercicios faltantes:");
      missingTypes.forEach(tipo => console.log(`- ${tipo}: No hay resultados guardados`));
    } else {
      console.log("\n3. ✅ Todos los tipos de ejercicios esperados están guardados en la base de datos");
    }
    
    // 4. Escanear toda la tabla para buscar todos los tipos de ejercicios guardados
    console.log("\n4. Escaneando todos los tipos de ejercicios en la base de datos:");
    
    const scanResponse = await docClient.send(new ScanCommand({
      TableName: TABLES.EXERCISE_RESULTS,
      ProjectionExpression: "tipo"
    }));
    
    const allExercises = scanResponse.Items || [];
    const allTypesSet = new Set();
    allExercises.forEach(exercise => {
      if (exercise.tipo) {
        allTypesSet.add(exercise.tipo);
      }
    });
    
    console.log("Todos los tipos de ejercicios en la base de datos:");
    Array.from(allTypesSet).sort().forEach(tipo => {
      console.log(`- ${tipo}`);
    });
    
    console.log("\n=== Comprobación finalizada ===");
    
  } catch (error) {
    console.error("❌ Error durante la comprobación:", error);
  }
}

// Ejecutar la comprobación
checkExerciseTypes(); 