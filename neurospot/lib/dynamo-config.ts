import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Configuración para DynamoDB
export const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "eu-west-1"; // Región de AWS

// Cliente DynamoDB
const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
  },
});

// Cliente de documento para operaciones más sencillas
export const docClient = DynamoDBDocumentClient.from(client);

// Nombres de las tablas en DynamoDB
export const TABLES = {
  USERS: "NeuroSpot_Users",
  EXERCISE_RESULTS: "NeuroSpot_ExerciseResults",
  SESSION_DATA: "NeuroSpot_SessionData",
};

// Definición de las estructuras de las tablas para referencia
export const TABLE_STRUCTURES = {
  USERS: {
    partitionKey: "userId", // Email del usuario como clave principal
    sortKey: "type", // Tipo de registro (perfil, configuración, etc.)
    attributes: ["email", "nombre", "nombreNino", "nivelEducativo", "curso", "apoyoClase"],
  },
  EXERCISE_RESULTS: {
    partitionKey: "userId", // Email del usuario
    sortKey: "exerciseId", // ID del ejercicio (tipo + timestamp)
    attributes: ["timestamp", "tipo", "puntuacion", "duracion", "detalles"],
  },
  SESSION_DATA: {
    partitionKey: "userId", // Email del usuario
    sortKey: "sessionId", // ID de la sesión (timestamp)
    attributes: ["fecha", "ejerciciosRealizados", "tiempoTotal"],
  },
}; 