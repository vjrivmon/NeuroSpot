// Script para comprobar los datos guardados localmente para un usuario
const fs = require('fs');
const path = require('path');

// Email del usuario a verificar
const userEmail = "vicenterivas773@gmail.com";

function checkLocalStorage() {
  console.log(`\n=== Comprobando datos locales para: ${userEmail} ===`);
  
  try {
    // En un entorno de navegador, estos datos estarían en localStorage
    // Aquí vamos a imprimir cómo acceder a ellos en el navegador
    console.log("\n1. Para verificar el usuario en el navegador:");
    console.log("   Abre las herramientas de desarrollo del navegador (F12)");
    console.log("   Ve a la pestaña 'Application' o 'Aplicación'");
    console.log("   En el panel izquierdo, expande 'Local Storage'");
    console.log("   Haz clic en la URL del sitio (localhost o dominio)");
    console.log("   Busca las siguientes claves:");
    console.log("   - userId: Debe contener el ID del usuario (normalmente el email)");
    console.log("   - userEmail: Debe contener el correo electrónico");
    console.log("   - completedExercises: Lista de ejercicios completados");
    console.log("   - testResultsData: Datos de los resultados de las pruebas");

    console.log("\n2. Para verificar todos los resultados guardados:");
    console.log("   Después de iniciar sesión con este usuario, ejecuta este código en la consola del navegador:");
    console.log(`
// Verificar email guardado
console.log("Email guardado:", localStorage.getItem("userEmail"));

// Verificar ejercicios completados
const completedExercises = JSON.parse(localStorage.getItem("completedExercises") || "[]");
console.log("Ejercicios completados:", completedExercises);

// Verificar resultados de pruebas
const testResults = JSON.parse(localStorage.getItem("testResultsData") || "[]");
console.log("Total de resultados guardados:", testResults.length);

// Agrupar por tipo
const resultsByType = {};
testResults.forEach(result => {
  if (!resultsByType[result.id]) {
    resultsByType[result.id] = [];
  }
  resultsByType[result.id].push(result);
});

// Mostrar resumen por tipo
console.log("Resumen por tipo:");
for (const [tipo, resultados] of Object.entries(resultsByType)) {
  console.log(\`\${tipo}: \${resultados.length} resultados\`);
}

// Mostrar detalles completos
console.log("Detalles completos:");
console.log(testResults);
    `);

    console.log("\n3. Para verificar los datos en DynamoDB:");
    console.log("   Asegúrate de que las credenciales AWS estén correctamente configuradas en .env.local");
    console.log("   Ejecuta el script check-user.js después de configurar las credenciales");
    
    console.log("\n=== Comprobación finalizada ===");
    
  } catch (error) {
    console.error("❌ Error durante la comprobación:", error);
  }
}

// Ejecutar la comprobación
checkLocalStorage(); 