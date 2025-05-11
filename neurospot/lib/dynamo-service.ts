import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "./dynamo-config";

// Servicio para gestionar usuarios
export const userService = {
  // Crear un nuevo usuario
  async createUser(user: any) {
    const params = {
      TableName: TABLES.USERS,
      Item: {
        userId: user.email,
        type: "profile",
        email: user.email,
        nombre: user.nombreTutor || "",
        nombreNino: user.nombreNino || "",
        nivelEducativo: user.nivelEducativo || "",
        curso: user.curso || "",
        apoyoClase: user.apoyoClase || false,
        createdAt: new Date().toISOString(),
      },
    };

    try {
      await docClient.send(new PutCommand(params));
      return { success: true };
    } catch (error) {
      console.error("Error al crear usuario:", error);
      return { success: false, error };
    }
  },

  // Obtener un usuario por su ID (email)
  async getUserById(userId: string) {
    const params = {
      TableName: TABLES.USERS,
      Key: {
        userId,
        type: "profile",
      },
    };

    try {
      const { Item } = await docClient.send(new GetCommand(params));
      return Item;
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      return null;
    }
  },

  // Actualizar datos del usuario
  async updateUser(userId: string, userData: any) {
    const updateExpressions = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Construir la expresión de actualización dinámica
    Object.entries(userData).forEach(([key, value]) => {
      if (key !== "userId" && key !== "type") {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Si no hay nada que actualizar, salir
    if (updateExpressions.length === 0) {
      return { success: true, message: "No hay cambios para actualizar" };
    }

    const params = {
      TableName: TABLES.USERS,
      Key: {
        userId,
        type: "profile",
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    try {
      await docClient.send(new UpdateCommand(params));
      return { success: true };
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      return { success: false, error };
    }
  },
};

// Servicio para gestionar resultados de ejercicios
export const exerciseResultService = {
  // Guardar resultado de un ejercicio
  async saveExerciseResult(userId: string, exerciseData: any) {
    const timestamp = new Date().toISOString();
    const exerciseId = `${exerciseData.tipo}_${timestamp}`;
    
    const params = {
      TableName: TABLES.EXERCISE_RESULTS,
      Item: {
        userId,
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
      // Actualizar también los datos de sesión
      await sessionService.updateSessionData(userId, exerciseData.tipo);
      return { success: true, exerciseId };
    } catch (error) {
      console.error("Error al guardar resultado de ejercicio:", error);
      return { success: false, error };
    }
  },

  // Obtener todos los resultados de ejercicios para un usuario
  async getExerciseResultsByUser(userId: string) {
    const params = {
      TableName: TABLES.EXERCISE_RESULTS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    try {
      const { Items } = await docClient.send(new QueryCommand(params));
      return Items || [];
    } catch (error) {
      console.error("Error al obtener resultados de ejercicios:", error);
      return [];
    }
  },

  // Obtener resultados de un tipo específico de ejercicio para un usuario
  async getExerciseResultsByType(userId: string, tipo: string) {
    const params = {
      TableName: TABLES.EXERCISE_RESULTS,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "tipo = :tipo",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":tipo": tipo,
      },
    };

    try {
      const { Items } = await docClient.send(new QueryCommand(params));
      return Items || [];
    } catch (error) {
      console.error(`Error al obtener resultados de ejercicios de tipo ${tipo}:`, error);
      return [];
    }
  },
};

// Servicio para gestionar datos de sesión
export const sessionService = {
  // Iniciar una nueva sesión
  async startSession(userId: string) {
    const sessionId = new Date().toISOString();
    
    const params = {
      TableName: TABLES.SESSION_DATA,
      Item: {
        userId,
        sessionId,
        fecha: sessionId,
        ejerciciosRealizados: [],
        tiempoTotal: 0,
        inicioSesion: sessionId,
      },
    };

    try {
      await docClient.send(new PutCommand(params));
      // Guardar el ID de sesión actual en localStorage para referencia
      if (typeof window !== 'undefined') {
        localStorage.setItem("currentSessionId", sessionId);
      }
      return { success: true, sessionId };
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      return { success: false, error };
    }
  },

  // Actualizar datos de sesión al completar un ejercicio
  async updateSessionData(userId: string, tipoEjercicio: string) {
    // Obtener el ID de sesión actual
    let sessionId = typeof window !== 'undefined' ? localStorage.getItem("currentSessionId") : null;
    
    // Si no hay sesión activa, crear una nueva
    if (!sessionId) {
      const result = await this.startSession(userId);
      if (!result.success) return result;
      sessionId = result.sessionId;
    }

    const params = {
      TableName: TABLES.SESSION_DATA,
      Key: {
        userId,
        sessionId,
      },
      UpdateExpression: "SET ejerciciosRealizados = list_append(if_not_exists(ejerciciosRealizados, :empty_list), :ejercicio)",
      ExpressionAttributeValues: {
        ":ejercicio": [tipoEjercicio],
        ":empty_list": [],
      },
    };

    try {
      await docClient.send(new UpdateCommand(params));
      return { success: true };
    } catch (error) {
      console.error("Error al actualizar datos de sesión:", error);
      return { success: false, error };
    }
  },

  // Finalizar una sesión
  async endSession(userId: string) {
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem("currentSessionId") : null;
    
    if (!sessionId) {
      return { success: false, error: "No hay sesión activa" };
    }

    const params = {
      TableName: TABLES.SESSION_DATA,
      Key: {
        userId,
        sessionId,
      },
      UpdateExpression: "SET finSesion = :finSesion, tiempoTotal = :tiempoTotal",
      ExpressionAttributeValues: {
        ":finSesion": new Date().toISOString(),
        ":tiempoTotal": new Date().getTime() - new Date(sessionId).getTime(),
      },
    };

    try {
      await docClient.send(new UpdateCommand(params));
      // Limpiar el ID de sesión actual
      if (typeof window !== 'undefined') {
        localStorage.removeItem("currentSessionId");
      }
      return { success: true };
    } catch (error) {
      console.error("Error al finalizar sesión:", error);
      return { success: false, error };
    }
  },

  // Obtener historial de sesiones para un usuario
  async getSessionHistory(userId: string) {
    const params = {
      TableName: TABLES.SESSION_DATA,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    try {
      const { Items } = await docClient.send(new QueryCommand(params));
      return Items || [];
    } catch (error) {
      console.error("Error al obtener historial de sesiones:", error);
      return [];
    }
  },
};

// Servicio para generar informes y exportar resultados
export const reportService = {
  // Obtener todos los datos del usuario para generar un informe completo
  async generateUserReport(userId: string) {
    try {
      // Obtener datos del perfil
      const userProfile = await userService.getUserById(userId);
      
      // Obtener todos los resultados de ejercicios
      const exerciseResults = await exerciseResultService.getExerciseResultsByUser(userId);
      
      // Obtener historial de sesiones
      const sessionHistory = await sessionService.getSessionHistory(userId);
      
      // Organizar resultados por tipo de ejercicio
      const resultsByType: Record<string, any[]> = {};
      exerciseResults.forEach((result: any) => {
        if (!resultsByType[result.tipo]) {
          resultsByType[result.tipo] = [];
        }
        resultsByType[result.tipo].push(result);
      });
      
      // Ordenar resultados por fecha
      Object.keys(resultsByType).forEach(tipo => {
        resultsByType[tipo].sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
      
      return {
        profile: userProfile,
        exerciseResults: resultsByType,
        sessionHistory,
      };
    } catch (error) {
      console.error("Error al generar informe de usuario:", error);
      return null;
    }
  },
}; 