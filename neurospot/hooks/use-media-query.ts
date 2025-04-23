"use client"

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query)
      
      // Inicializar con el valor actual
      setMatches(media.matches)
      
      // Función para actualizar el estado
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches)
      }
      
      // Añadir listener
      media.addEventListener('change', listener)
      
      // Limpiar listener al desmontar
      return () => {
        media.removeEventListener('change', listener)
      }
    }
    
    // Fallback para SSR
    return undefined
  }, [query])
  
  return matches
} 