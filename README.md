<p align="center">
  <img src="neurospot/public/logo.svg" alt="NeuroSpot Logo" width="100"/>
</p>

# 🧠 NeuroSpot – Plataforma interactiva para la detección temprana de TDAH infantil
<br>

## 📝 Descripción del proyecto

**NeuroSpot** es una solución digital basada en inteligencia artificial y servicios de AWS que ayuda a detectar posibles indicadores de TDAH en niños mediante juegos cognitivos breves. A través de una interfaz web atractiva e interactiva, el sistema recopila datos de voz, imagen y rendimiento cognitivo para analizarlos con herramientas de machine learning en la nube.

> ⚠️ Este sistema no sustituye el diagnóstico clínico, pero actúa como herramienta preventiva y de apoyo a familias y profesionales.

---

<br>

## 🎯 Objetivo académico

Este proyecto se enmarca en la práctica de la asignatura **Inteligencia Artificial – Seminario de Machine Learning con AWS**. La finalidad es diseñar e implementar un sistema funcional que utilice al menos un servicio de Machine Learning de AWS como componente central, integrando a su vez otros servicios del ecosistema AWS.

<br>

---

<br>

## 🧩 Funcionalidades principales

- Registro seguro de tutores y consentimiento informado
- Ejecución secuencial de juegos cognitivos:
  - Test de Stroop
  - Lectura en voz alta
  - Atención continua
  - Memoria visual
  - Observación visual
  - Análisis de emociones faciales
- Generación de un informe con resultados individuales
- Integración completa con servicios de AWS para procesar datos en la nube

<br>

---

<br>

## 🧠 Arquitectura técnica (resumen)

| Componente                  | Servicio AWS                      | Descripción                                                                 |
|----------------------------|-----------------------------------|-----------------------------------------------------------------------------|
| Frontend                   | S3 + CloudFront                   | Hosting del frontend Next.js estático con entrega global segura            |
| Autenticación              | Amazon Cognito                    | Gestión de usuarios y sesiones                                  |
| Almacenamiento             | Amazon S3                         | Guarda audios, imágenes, fotogramas, resultados                            |
| Lógica de negocio          | AWS Lambda                        | Orquestación sin servidor entre servicios                                  |
| Base de datos              | Amazon DynamoDB                   | Almacenamiento estructurado de sesiones y métricas de juego                |
| Análisis de voz            | Amazon Transcribe + Comprehend    | Transcripción y análisis semántico del discurso leído                      |
| Análisis de emociones      | Amazon Rekognition                | Identificación de emociones faciales a partir de imágenes capturadas       |
| Visualización (futuro)     | Amazon QuickSight                 | Generación automática de dashboards de resultados (previsto)               |
| Monitorización             | Amazon CloudWatch                 | Logs y trazabilidad del sistema                                            |

<br>

---

<br>

## 🚀 Despliegue local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/vjrivmon/NeuroSpot.git
   cd NeuroSpot
   ```

2. Instala las dependencias:
   ```bash
   npm install ```

3. Inicia la aplicación en local:
   ```bash
   npm run dev ```

4. Inicia la web con el archivo automático:
   ```bash
   ./start_neurospot.sh ```

> Nota: para ejecutar funciones AWS debes tener configuradas las credenciales y permisos adecuados en tu entorno local. Las llamadas a Lambda están gestionadas desde el frontend.

---

<br>

## 💻 Prompts utilizados
### Diseño de la interfaz web
```
Quiero que diseñes una interfaz mobile-first altamente profesional y accesible para una aplicación web llamada NeuroSpot, desarrollada en Next.js con React y Tailwind CSS, usando componentes modernos como los de shadcn/ui. Esta aplicación está dirigida a niños y tutores legales para la detección temprana de posibles signos de TDAH mediante juegos interactivos y pruebas clínicas. La solución será utilizada en entornos educativos, clínicos o domésticos, y debe estar optimizada para móviles pero adaptarse perfectamente a escritorio.
La interfaz debe ser limpia, minimalista, emocionalmente neutral, con una estética moderna, intuitiva y sin sobrecarga visual, manteniendo un equilibrio entre lo lúdico (para los niños) y lo profesional (para los adultos).

🔷 Características clave: Mobile-first, 100% responsive
Tipografía legible y moderna
Compatibilidad modo oscuro/claro
Diseño accesible (uso de etiquetas ARIA, contraste alto, navegación intuitiva)
Estilo visual inspirado en webs como:
awwwards.com
godly.website
mobbin.com
curated.design
dark.design
Transiciones suaves, animaciones sutiles, microinteracciones

🧩 Estructura de pantallas a generar:
Pantalla de Inicio
Logo de NeuroSpot en el header
Título: “Bienvenid@ a NeuroSpot”
Descripción breve del propósito de la app (“Evaluación interactiva para detectar posibles indicadores de TDAH en niños, mediante juegos cognitivos breves”)
Botón principal “Comenzar Evaluación”
Opción inferior para tutor: “Ver resultados anteriores”
Pantalla de Consentimiento Legal
Explicación clara y en lenguaje accesible sobre consentimiento para uso de datos por parte del tutor
Checkbox de aceptación obligatorio
Botón “Acepto y continuar”

Panel Principal del Niño
Nombre del niño (por ejemplo: “Hola, Leo 👋”)
Lista visual con tarjetas de ejercicios disponibles:

Test de Stroop
Juego de Atención Sostenida
Lectura en voz alta
Prueba de Memoria Visual
Cámara activada para ejercicio de observación

Cada tarjeta debe incluir:
Icono representativo del ejercicio
Tiempo estimado
Botón “Jugar”
Vista de un Ejercicio Interactivo (p. ej. Stroop Test)
Encabezado con nombre del ejercicio
Instrucciones claras y visuales (con ejemplos si aplica)
Área de interacción principal (mostrar palabra de color, botones con colores)
Barra de progreso o tiempo restante
Botón para pausar/abandonar ejercicio
Pantalla de Resultados para Tutores
Mensaje de cierre amigable (“¡Has completado la evaluación!”)
Resumen visual de resultados (ej. tarjetas o gráfica tipo semáforo por cada ejercicio: Verde = normal, Amarillo = a observar, Rojo = posible indicador)
Botón para descargar informe PDF (placeholder)
Advertencia clara de que esto no sustituye diagnóstico clínico.

🎨 Branding Visual: Paleta de colores principal:
Azul suave (#3A8DFF o similar): transmite calma y concentración
Verde menta (#62DDBD): para llamadas a la acción o aciertos
Gris neutro (#F4F4F5 y #1F2937): para fondo y textos
Toques de naranja/amarillo para alertas o feedback llamativo

Tipografía recomendada:
Sans serif moderna, como Inter, Manrope o Rubik
Iconografía: minimalista, flat, amigable (inspirada en Material Symbols)

⚙️ Tecnología a respetar: Framework: Next.js (13 o superior, con App Router)
Estilos: Tailwind CSS
Librerías de UI: shadcn/ui, lucide-react
Código semántico y limpio (no usar elementos genéricos tipo div innecesarios)

🎁 Extras: Agrega placeholders para grabación de audio y captura de cámara
Usa componentes reutilizables: Botón, Card, Modal, Alert, etc.
Agrega estados de carga, errores y confirmaciones interactivas
Quiero una solución visualmente atractiva, emocionalmente empática y técnicamente escalable, lista para iterar y conectar con backend AWS vía API REST. El diseño debe transmitir seguridad, innovación y empatía. No es un juguete, pero tampoco debe parecer frío o clínico.
No me des una primera versión sin que todo lo anterior se cumpla
```


<br>

---

<br>

## 📹 Vídeo demostración
🎥 Ver demostración del sistema (5 min)
En el vídeo se explica el funcionamiento general, los flujos cognitivos, decisiones técnicas, y qué herramientas se han utilizado como Cursor y ChatGPT para inspiración, lógica y documentación técnica y los servicios de AWS.

<br>

---

<br>

## 📄 Informe entregado
El informe está disponible en el repositorio como NeuroSpot.pdf e incluye:
- Caso de uso y contexto social
- Diagrama arquitectónico profesional
- Descripción técnica de cada componente
- Uso de servicios de AWS detallado

  <br>
  
---

<br>

## 🤖 Tecnologías utilizadas
- Next.js + Tailwind CSS + Shadcn/ui (gráficas)
- Node.js + AWS SDK v3
- Amazon S3, CloudFront, Lambda, DynamoDB, Amazon Rekognition, Transcribe, Comprehend
- Cursor, V0, ChatGPT

<br>

 ---
 
 <br>

## 👩‍🏫 Autores
Irene Medina García - Vicente Rivas Monferrer 

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/irenemg8) - [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/irene-medina-garcia/) - [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/vjrivmon) - [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/vicente-rivas-monferrer/)
