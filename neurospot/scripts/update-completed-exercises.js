// Script para actualizar el localStorage con los ejercicios completados
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  QueryCommand
} = require("@aws-sdk/lib-dynamodb");
const fs = require('fs');
const path = require('path');

// Credenciales AWS
const AWS_CONFIG = {
  region: "eu-west-1",
  credentials: {
    accessKeyId: "AKIAXMT4TRKKHD4QUJG4",
    secretAccessKey: "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"
  }
};

// Cliente DynamoDB
const client = new DynamoDBClient(AWS_CONFIG);
const docClient = DynamoDBDocumentClient.from(client);

// Nombres de las tablas en DynamoDB
const TABLES = {
  EXERCISE_RESULTS: "NeuroSpot_ExerciseResults",
};

// Email del usuario a verificar
const userEmail = "vicenterivas773@gmail.com";

async function updateCompletedExercises() {
  console.log(`\n=== Actualizando ejercicios completados para el usuario: ${userEmail} ===\n`);
  
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
    
    console.log(`✅ Se encontraron ${exercises.length} resultados de ejercicios`);
    
    // Extraer los tipos únicos de ejercicios
    const completedExerciseTypes = new Set();
    exercises.forEach(exercise => {
      completedExerciseTypes.add(exercise.tipo);
    });
    
    const completedExercises = Array.from(completedExerciseTypes);
    console.log(`\nEjercicios completados: ${completedExercises.join(', ')}`);
    
    // Crear archivo JavaScript para actualizar localStorage
    const jsContent = `
// Script generado automáticamente para actualizar el localStorage
// Ejecutar en la consola del navegador mientras estás en la aplicación NeuroSpot

// Actualizar ejercicios completados
const completedExercises = ${JSON.stringify(completedExercises)};
localStorage.setItem("completedExercises", JSON.stringify(completedExercises));
console.log("✅ Ejercicios completados actualizados:", completedExercises);

// Calcular progreso correcto (6 ejercicios en total)
const progress = Math.round((completedExercises.length / 6) * 100);
console.log("📊 Progreso actual:", progress + "%");

// Función para verificar si ya existen resultados guardados
function checkExistingResults() {
  const testResultsData = localStorage.getItem("testResultsData");
  if (!testResultsData) {
    console.log("❌ No hay resultados guardados en localStorage");
    return;
  }
  
  try {
    const results = JSON.parse(testResultsData);
    console.log("📋 Resultados actuales:", results.map(r => r.id));
  } catch (e) {
    console.error("❌ Error al parsear resultados:", e);
  }
}

checkExistingResults();

// Mensaje de confirmación
console.log("✅ localStorage actualizado correctamente");
    `;
    
    // Escribir el archivo
    const outputPath = path.join(__dirname, 'update-localstorage.js');
    fs.writeFileSync(outputPath, jsContent);
    
    console.log(`\n✅ Archivo JavaScript generado en: ${outputPath}`);
    console.log("Por favor, copia el contenido de este archivo y ejecútalo en la consola del navegador");
    console.log("mientras estás en la aplicación NeuroSpot para actualizar el localStorage.\n");
    
    // Mostrar contenido del archivo
    console.log("Contenido del archivo:");
    console.log("======================");
    console.log(jsContent);
    console.log("======================");
    
  } catch (error) {
    console.error("❌ Error durante la consulta:", error);
  }
}

// Ejecutar la función
updateCompletedExercises(); 