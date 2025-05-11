// Script para comprobar los detalles de los ejercicios guardados en DynamoDB
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  QueryCommand
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

async function checkResultDetails() {
  console.log(`\n=== Comprobando detalles de ejercicios para el usuario: ${userEmail} ===\n`);
  
  try {
    // Consultar los ejercicios del usuario
    const queryExercisesResponse = await docClient.send(new QueryCommand({
      TableName: TABLES.EXERCISE_RESULTS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userEmail
      }
    }));
    
    const exercises = queryExercisesResponse.Items || [];
    
    if (exercises.length === 0) {
      console.log("❌ No se encontraron ejercicios para este usuario");
      return;
    }
    
    console.log(`✅ Se encontraron ${exercises.length} resultados de ejercicios\n`);
    
    // Mostrar detalles de cada ejercicio
    exercises.forEach((exercise, index) => {
      console.log(`Ejercicio #${index + 1}:`);
      console.log(`- ID: ${exercise.exerciseId}`);
      console.log(`- Tipo: ${exercise.tipo}`);
      console.log(`- Timestamp: ${exercise.timestamp}`);
      console.log(`- Puntuación: ${exercise.puntuacion}`);
      
      // Mostrar detalles específicos según el tipo de ejercicio
      if (exercise.detalles) {
        console.log("- Detalles:");
        Object.entries(exercise.detalles).forEach(([key, value]) => {
          console.log(`  * ${key}: ${value}`);
        });
      } else {
        console.log("- No hay detalles adicionales");
      }
      
      console.log(""); // Línea en blanco para separar
    });
    
  } catch (error) {
    console.error("❌ Error durante la consulta:", error);
  }
}

// Ejecutar la comprobación
checkResultDetails(); 