
// Script generado automáticamente para actualizar el localStorage
// Ejecutar en la consola del navegador mientras estás en la aplicación NeuroSpot

// Actualizar ejercicios completados
const completedExercises = ["atencion","lectura","memoria","observacion","stroop","video"];
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
    