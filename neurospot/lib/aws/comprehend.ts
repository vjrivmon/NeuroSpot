import { ComprehendClient, DetectSyntaxCommand, DetectEntitiesCommand, DetectKeyPhrasesCommand, DetectSentimentCommand } from '@aws-sdk/client-comprehend';
import { awsConfig } from './config';
import https from 'https';

// Configuración común para los clientes
const region = 'eu-west-1'; // Cambiamos a Irlanda donde Comprehend está disponible
const httpOptions = {
  agent: new https.Agent({
    keepAlive: true,
    timeout: 50000,
    keepAliveMsecs: 3000
  })
};

// Cliente de AWS Comprehend
const comprehendClient = new ComprehendClient({
  ...awsConfig,
  region,
  requestHandler: { httpOptions }
});

/**
 * Analiza la sintaxis de un texto
 * @param text Texto a analizar
 * @returns Análisis de sintaxis (partes del discurso)
 */
export async function analyzeSyntax(text: string) {
  const params = {
    Text: text,
    LanguageCode: 'es'
  };
  
  const command = new DetectSyntaxCommand(params);
  const response = await comprehendClient.send(command);
  
  return response.SyntaxTokens;
}

/**
 * Detecta entidades en un texto
 * @param text Texto a analizar
 * @returns Entidades detectadas (personas, lugares, organizaciones, etc.)
 */
export async function detectEntities(text: string) {
  const params = {
    Text: text,
    LanguageCode: 'es'
  };
  
  const command = new DetectEntitiesCommand(params);
  const response = await comprehendClient.send(command);
  
  return response.Entities;
}

/**
 * Detecta frases clave en un texto
 * @param text Texto a analizar
 * @returns Frases clave detectadas
 */
export async function detectKeyPhrases(text: string) {
  const params = {
    Text: text,
    LanguageCode: 'es'
  };
  
  const command = new DetectKeyPhrasesCommand(params);
  const response = await comprehendClient.send(command);
  
  return response.KeyPhrases;
}

/**
 * Analiza el sentimiento de un texto
 * @param text Texto a analizar
 * @returns Sentimiento detectado (positivo, negativo, neutro, mixto)
 */
export async function detectSentiment(text: string) {
  const params = {
    Text: text,
    LanguageCode: 'es'
  };
  
  const command = new DetectSentimentCommand(params);
  const response = await comprehendClient.send(command);
  
  return {
    sentiment: response.Sentiment,
    scores: response.SentimentScore
  };
}

/**
 * Compara el texto original con el texto transcrito y calcula la puntuación de precisión
 * @param originalText Texto original
 * @param transcribedText Texto transcrito por el usuario
 * @returns Puntuación de precisión (0-100)
 */
export async function calculateReadingAccuracy(originalText: string, transcribedText: string): Promise<number> {
  // Analizar entidades y frases clave en ambos textos
  const [originalEntities, transcribedEntities, originalKeyPhrases, transcribedKeyPhrases] = await Promise.all([
    detectEntities(originalText),
    detectEntities(transcribedText),
    detectKeyPhrases(originalText),
    detectKeyPhrases(transcribedText)
  ]);
  
  // Calcular coincidencia de entidades
  const entityMatchCount = transcribedEntities?.filter(tEntity => 
    originalEntities?.some(oEntity => 
      oEntity.Text?.toLowerCase() === tEntity.Text?.toLowerCase() && 
      oEntity.Type === tEntity.Type
    )
  ).length || 0;
  
  const entityScore = originalEntities?.length ? 
    (entityMatchCount / originalEntities.length) * 100 : 0;
  
  // Calcular coincidencia de frases clave
  const keyPhraseMatchCount = transcribedKeyPhrases?.filter(tPhrase => 
    originalKeyPhrases?.some(oPhrase => 
      oPhrase.Text?.toLowerCase() === tPhrase.Text?.toLowerCase()
    )
  ).length || 0;
  
  const keyPhraseScore = originalKeyPhrases?.length ? 
    (keyPhraseMatchCount / originalKeyPhrases.length) * 100 : 0;
  
  // Calcular puntuación final (promedio ponderado)
  // Damos más peso a las frases clave (70%) que a las entidades (30%)
  const finalScore = (keyPhraseScore * 0.7) + (entityScore * 0.3);
  
  return Math.round(finalScore);
} 