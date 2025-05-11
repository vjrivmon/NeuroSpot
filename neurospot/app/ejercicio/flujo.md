# Flujo correcto de ejercicios en NeuroSpot

Este documento describe el flujo correcto y secuencial de los ejercicios en la aplicación NeuroSpot.

## Orden de los ejercicios

1. **Stroop Test** (`/ejercicio/stroop`)
   - Navegación al finalizar: → Lectura en Voz Alta
   - Tipo en BD: `"stroop"`

2. **Lectura en Voz Alta** (`/ejercicio/lectura`)
   - Navegación al finalizar: → Atención Continua
   - Tipo en BD: `"lectura"`

3. **Atención Continua** (`/ejercicio/atencion`)
   - Navegación al finalizar: → Video
   - Tipo en BD: `"atencion"`

4. **Análisis por Video** (`/ejercicio/video`)
   - Navegación al finalizar: → Memoria Visual
   - Tipo en BD: `"video"`

5. **Memoria Visual** (`/ejercicio/memoria`)
   - Navegación al finalizar: → Observación
   - Tipo en BD: `"memoria"`

6. **Observación** (`/ejercicio/observacion`)
   - Navegación al finalizar: → Resultados
   - Tipo en BD: `"observacion"`

7. **Resultados** (`/resultados`)
   - Muestra todos los resultados de todos los ejercicios

## Correcciones realizadas

1. **Atención Continua**: Se corrigió la función `handleContinue()` para asegurar que se llame a `finishGame()` y se guarden los resultados en DynamoDB antes de navegar a la siguiente página.

2. **Observación**: Se corrigió la ruta de navegación para que dirija a "atención" en lugar de "video", lo que completaría el ciclo de ejercicios correctamente.

## Verificación de resultados en DynamoDB

Para comprobar que los ejercicios se han guardado correctamente:

```bash
node neurospot/scripts/check-exercise-results.js
```

Esto mostrará:
- Los tipos de ejercicios guardados para un usuario específico
- Los tipos de ejercicios que faltan
- Todos los tipos de ejercicios que existen en la base de datos 