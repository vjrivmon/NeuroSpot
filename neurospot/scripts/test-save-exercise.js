// Script para probar guardar ejercicios en DynamoDB
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  PutCommand
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

// Nombre de la tabla en DynamoDB
const EXERCISE_RESULTS_TABLE = "NeuroSpot_ExerciseResults";

// Email del usuario
const userEmail = "vicenterivas773@gmail.com";

// Función para guardar un resultado de ejercicio
async function saveExerciseResult(exerciseData) {
  const timestamp = new Date().toISOString();
  const exerciseId = `${exerciseData.tipo}_${timestamp}`;
  
  const params = {
    TableName: EXERCISE_RESULTS_TABLE,
    Item: {
      userId: userEmail,
      exerciseId,
      timestamp,
      tipo: exerciseData.tipo,
      puntuacion: exerciseData.puntuacion,
      duracion: exerciseData.duracion,
      detalles: exerciseData.detalles || {},
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    console.log(`✅ Ejercicio de ${exerciseData.tipo} guardado correctamente con ID: ${exerciseId}`);
    return { success: true, exerciseId };
  } catch (error) {
    console.error(`❌ Error al guardar ejercicio de ${exerciseData.tipo}:`, error);
    return { success: false, error };
  }
}

// Datos de ejemplo para cada tipo de ejercicio
const testExercises = [
  {
    tipo: "stroop",
    puntuacion: 85,
    duracion: 60,
    detalles: {
      total: 25,
      porcentajeAciertos: 85,
      tiempoTotal: 60
    }
  },
  {
    tipo: "lectura",
    puntuacion: 80,
    duracion: 45,
    detalles: {
      tiempoLectura: 30,
      emocionDetectada: "neutro",
      longitudTexto: 500,
      tiempoTotal: 45
    }
  },
  {
    tipo: "atencion",
    puntuacion: 75,
    duracion: 65,
    detalles: {
      correctas: 15,
      errorComision: 3,
      errorOmision: 2,
      tiempoReaccionMedio: 450,
      tiempoReaccionMediana: 430,
      nivelAlcanzado: 3,
      tiempoTotal: 65
    }
  },
  {
    tipo: "memoria",
    puntuacion: 6,
    duracion: 120,
    detalles: {
      nivelMaximo: 6,
      secuenciaMaxima: 6,
      tiempoTotal: 120
    }
  },
  {
    tipo: "observacion",
    puntuacion: 90,
    duracion: 180,
    detalles: {
      totalPreguntas: 5,
      aciertos: 4,
      porcentajeAciertos: 80,
      tiempoTotal: 180
    }
  }
];

// Función principal para ejecutar el script
async function testSaveExercises() {
  console.log(`\n=== Probando guardar ejercicios para el usuario: ${userEmail} ===\n`);
  
  for (const exercise of testExercises) {
    console.log(`Guardando ejercicio de tipo: ${exercise.tipo}...`);
    const result = await saveExerciseResult(exercise);
    
    if (result.success) {
      console.log(`✅ Ejercicio guardado con éxito: ${exercise.tipo}\n`);
    } else {
      console.error(`❌ Error al guardar ejercicio: ${exercise.tipo}\n`);
    }
  }
  
  console.log("=== Prueba finalizada ===");
}

// Ejecutar el script
testSaveExercises(); 