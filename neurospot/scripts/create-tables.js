// Importar las dependencias necesarias
const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
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

// Nombres de las tablas en DynamoDB
const TABLES = {
  USERS: "NeuroSpot_Users",
  EXERCISE_RESULTS: "NeuroSpot_ExerciseResults",
  SESSION_DATA: "NeuroSpot_SessionData",
};

// Definiciones de las tablas
const tableDefinitions = {
  // Tabla de usuarios
  [TABLES.USERS]: {
    TableName: TABLES.USERS,
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "type", AttributeType: "S" }
    ],
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "type", KeyType: "RANGE" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  
  // Tabla de resultados de ejercicios
  [TABLES.EXERCISE_RESULTS]: {
    TableName: TABLES.EXERCISE_RESULTS,
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "exerciseId", AttributeType: "S" }
    ],
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "exerciseId", KeyType: "RANGE" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  },
  
  // Tabla de datos de sesión
  [TABLES.SESSION_DATA]: {
    TableName: TABLES.SESSION_DATA,
    AttributeDefinitions: [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "sessionId", AttributeType: "S" }
    ],
    KeySchema: [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "sessionId", KeyType: "RANGE" }
    ],
    BillingMode: "PAY_PER_REQUEST"
  }
};

// Función para crear una tabla
async function createTable(tableName) {
  try {
    console.log(`Creando tabla ${tableName}...`);
    const params = tableDefinitions[tableName];
    const command = new CreateTableCommand(params);
    const response = await client.send(command);
    console.log(`✅ Tabla ${tableName} creada con éxito:`, response.TableDescription.TableStatus);
    return true;
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`⚠️ La tabla ${tableName} ya existe.`);
      return true;
    }
    console.error(`❌ Error al crear la tabla ${tableName}:`, error);
    return false;
  }
}

// Función principal para crear todas las tablas
async function createAllTables() {
  console.log("\n=== Creando tablas en DynamoDB ===");
  
  try {
    // Crear cada tabla secuencialmente
    for (const tableName of Object.values(TABLES)) {
      const success = await createTable(tableName);
      if (!success) {
        console.error(`❌ Error al crear la tabla ${tableName}. Abortando...`);
        return;
      }
    }
    
    console.log("\n=== Todas las tablas creadas con éxito ===");
    console.log("Las tablas pueden tardar unos minutos en estar disponibles completamente.");
    console.log("Puedes verificar su estado en la consola de AWS DynamoDB:");
    console.log(`https://${process.env.AWS_REGION}.console.aws.amazon.com/dynamodbv2/home?region=${process.env.AWS_REGION}#tables`);
    
  } catch (error) {
    console.error("❌ Error durante la creación de tablas:", error);
  }
}

// Ejecutar la función principal
createAllTables(); 