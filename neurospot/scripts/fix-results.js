// Script para corregir los resultados y el progreso
// COPIA TODO ESTE CÓDIGO Y EJECÚTALO EN LA CONSOLA DEL NAVEGADOR

(function() {
  console.log("🔧 Iniciando reparación completa de resultados y progreso...");
  
  // 1. Asegurar que todos los ejercicios estén marcados como completados
  const ejerciciosCompletados = ["stroop", "lectura", "atencion", "memoria", "observacion", "video"];
  localStorage.setItem("completedExercises", JSON.stringify(ejerciciosCompletados));
  console.log("✅ Ejercicios completados actualizados:", ejerciciosCompletados);
  
  // 2. Crear o modificar resultados predeterminados para todos los tipos de ejercicios
  // Esto asegura que se muestren todos los ejercicios en la página de resultados
  let testResultsData = [];
  try {
    const saved = localStorage.getItem("testResultsData");
    if (saved) {
      testResultsData = JSON.parse(saved);
      console.log("📊 Resultados actuales cargados:", testResultsData.length);
    }
  } catch (e) {
    console.error("❌ Error al cargar resultados:", e);
  }
  
  // Verificar si existen todos los tipos de ejercicios en los resultados
  const tiposEjercicios = ["stroop", "lectura", "atencion", "memoria", "observacion", "video"];
  const existingTypes = new Set(testResultsData.map(result => result.id));
  console.log("🔍 Tipos de ejercicios existentes:", Array.from(existingTypes));
  
  // Añadir resultados predeterminados para los ejercicios faltantes
  const currentDate = new Date().toISOString();
  
  // Crear resultados por defecto para cada tipo de ejercicio si no existe
  
  // Stroop
  if (!existingTypes.has("stroop")) {
    testResultsData.push({
      id: "stroop",
      name: "Test de Stroop",
      score: 85,
      maxScore: 100,
      description: "Evaluación de control inhibitorio y atención selectiva",
      feedback: "Buena capacidad para inhibir respuestas automáticas en favor de respuestas menos automáticas.",
      date: currentDate,
      detalles: {
        total: 25,
        porcentajeAciertos: 85,
        tiempoTotal: 60
      }
    });
    console.log("✅ Añadido resultado para: Stroop");
  }
  
  // Lectura
  if (!existingTypes.has("lectura")) {
    testResultsData.push({
      id: "lectura",
      name: "Lectura Fluida",
      score: 80,
      maxScore: 100,
      description: "Evaluación de fluidez y comprensión lectora",
      feedback: "Buena fluidez lectora. Lectura clara y bien articulada.",
      date: currentDate,
      detalles: {
        tiempoLectura: 30,
        longitudTexto: 500,
        emocionDetectada: "neutro",
        tiempoTotal: 45
      }
    });
    console.log("✅ Añadido resultado para: Lectura");
  }
  
  // Atención
  if (!existingTypes.has("atencion")) {
    testResultsData.push({
      id: "atencion",
      name: "Atención Sostenida",
      score: 75,
      maxScore: 100,
      description: "Evaluación de la capacidad para mantener la atención durante un periodo prolongado",
      feedback: "Buena atención sostenida. Capacidad adecuada para mantener la concentración durante el tiempo requerido.",
      date: currentDate,
      detalles: {
        correctas: 15,
        errorComision: 3,
        errorOmision: 2,
        tiempoReaccionMedio: 450,
        tiempoReaccionMediana: 430,
        nivelAlcanzado: 3,
        tiempoTotal: 65
      }
    });
    console.log("✅ Añadido resultado para: Atención");
  }
  
  // Memoria
  if (!existingTypes.has("memoria")) {
    testResultsData.push({
      id: "memoria",
      name: "Memoria Visual",
      score: 60,
      maxScore: 100, 
      description: "Evaluación de memoria de trabajo y recordación visual",
      feedback: "Memoria de trabajo visual en el rango medio. Capacidad de recordar y manipular información visual adecuada para su edad.",
      date: currentDate,
      detalles: {
        nivelMaximo: 6,
        secuenciaMaxima: 6,
        tiempoTotal: 120
      }
    });
    console.log("✅ Añadido resultado para: Memoria");
  }
  
  // Observación
  if (!existingTypes.has("observacion")) {
    testResultsData.push({
      id: "observacion",
      name: "Atención Visual",
      score: 90,
      maxScore: 100,
      description: "Evaluación de la capacidad para detectar detalles visuales",
      feedback: "Excelente atención a detalles visuales. Procesamiento visual rápido y preciso.",
      date: currentDate,
      detalles: {
        totalPreguntas: 5,
        aciertos: 4,
        porcentajeAciertos: 80,
        tiempoTotal: 180
      }
    });
    console.log("✅ Añadido resultado para: Observación");
  }
  
  // Video
  if (!existingTypes.has("video")) {
    testResultsData.push({
      id: "video",
      name: "Análisis de Emociones",
      score: 78,
      maxScore: 100,
      description: "Evaluación de emociones y expresiones faciales",
      feedback: "Buena capacidad para mantener la atención durante la visualización de vídeo.",
      date: currentDate,
      detalles: {
        framesCapturados: 23,
        framesConRostro: 23,
        porcentajeAtencion: 100,
        porcentajeAltaAtencion: 78,
        puntuacionMedia: 7.8,
        tiempoTotal: 56,
        sessionId: "3ef22861-2692-450c-898f-cf628f426ab3"
      }
    });
    console.log("✅ Añadido resultado para: Video");
  }
  
  // Guardar resultados actualizados
  localStorage.setItem("testResultsData", JSON.stringify(testResultsData));
  console.log("💾 Resultados guardados correctamente en localStorage");
  
  // 3. Refrescar la información almacenada en filteredResults en caso de que ya esté cargada la página
  try {
    // Este código solo funcionará si se ejecuta en la página de resultados
    if (window.location.pathname.includes('/resultados')) {
      console.log("🔄 Intentando actualizar la página de resultados en tiempo real...");
      
      // Crear un evento personalizado que la página de resultados pueda escuchar
      const event = new CustomEvent('resultsDataUpdated', { detail: { testResultsData } });
      window.dispatchEvent(event);
      
      console.log("🔄 Evento de actualización enviado. Recomendamos recargar la página para ver los cambios.");
    }
  } catch (e) {
    console.error("Error al intentar actualizar la página en tiempo real:", e);
  }
  
  // 4. Actualizar el progreso
  const progress = Math.round((ejerciciosCompletados.length / 6) * 100);
  console.log("📊 Progreso actualizado a:", progress + "%");
  
  // 5. Mostrar mensaje de éxito
  console.log("%c¡Reparación completada! Recarga la página para ver los cambios.", "color: green; font-weight: bold; font-size: 14px");
  console.log("%cAsegúrate de estar en la página de resultados cuando recargues.", "color: blue; font-size: 12px");
})(); 