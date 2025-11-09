'use client'

import { useState, useEffect } from 'react'
import { theme } from '@/config/theme'

export interface DemoDates {
  event: string
  contentActivation: string
  rsvpDeadline: string
  liveEnd: string
}

export function useDemoDates() {
  const [demoDates, setDemoDates] = useState<DemoDates>({
    event: theme.dates.event,
    contentActivation: theme.dates.contentActivation,
    rsvpDeadline: theme.dates.rsvpDeadline,
    liveEnd: theme.dates.liveEnd
  })

  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isEventLive, setIsEventLive] = useState(false)
  const [isCountdownActive, setIsCountdownActive] = useState(false)
  const [originalDates, setOriginalDates] = useState<DemoDates | null>(null)

  // Cargar fechas guardadas del localStorage al inicializar
  useEffect(() => {
    const savedDates = localStorage.getItem('demo-dates')
    if (savedDates) {
      try {
        const parsed = JSON.parse(savedDates)
        setDemoDates(parsed)
      } catch (error) {
        console.error('Error al cargar fechas guardadas:', error)
      }
    }
  }, [])

  // Guardar fechas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('demo-dates', JSON.stringify(demoDates))
  }, [demoDates])

  // Función para activar el contador de 3 segundos
  const activateCountdown = () => {
    console.log('activateCountdown llamado')
    setIsCountdownActive(true)
    console.log('isCountdownActive establecido a true')
    // Después de 3 segundos, activar el modo live
    setTimeout(() => {
      console.log('Timeout de 3 segundos completado')
      setIsEventLive(true)
      setIsCountdownActive(false)
    }, 3000)
  }

  const updateDate = (key: keyof DemoDates, value: string) => {
    setDemoDates(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const startEventNow = () => {
    console.log('startEventNow llamado')
    
    // Guardar las fechas originales si no están guardadas
    if (!originalDates) {
      setOriginalDates(demoDates)
    }
    
    // Activar modo demo
    setIsDemoMode(true)
    
    // Obtener la hora actual
    const now = new Date()
    
    // Calcular las nuevas fechas
    const eventStartTime = new Date(now.getTime() + 3 * 1000) // 3 segundos después
    const liveEndTime = new Date(now.getTime() + 6 * 60 * 60 * 1000) // 6 horas después
    
    console.log('Nuevas fechas:', {
      event: eventStartTime.toISOString(),
      liveEnd: liveEndTime.toISOString()
    })
    
    // Actualizar las fechas temporalmente
    setDemoDates(prev => ({
      ...prev,
      event: eventStartTime.toISOString(),
      contentActivation: eventStartTime.toISOString(), // igual que event
      rsvpDeadline: eventStartTime.toISOString(), // igual que event
      liveEnd: liveEndTime.toISOString()
    }))
    
    // Activar el contador de 3 segundos
    activateCountdown()
  }

  const restoreOriginalDates = () => {
    // Desactivar modo demo
    setIsDemoMode(false)
    setIsEventLive(false)
    setIsCountdownActive(false)
    
    setDemoDates({
      event: theme.dates.event,
      contentActivation: theme.dates.contentActivation,
      rsvpDeadline: theme.dates.rsvpDeadline,
      liveEnd: theme.dates.liveEnd
    })
  }

  const goBackToPreEvent = () => {
    // Volver al estado de pre-evento
    setIsEventLive(false)
    setIsCountdownActive(false)
    
    // Restaurar fechas originales si están guardadas
    if (originalDates) {
      setDemoDates(originalDates)
    } else {
      // Fallback a las fechas del theme
      setDemoDates({
        event: theme.dates.event,
        contentActivation: theme.dates.contentActivation,
        rsvpDeadline: theme.dates.rsvpDeadline,
        liveEnd: theme.dates.liveEnd
      })
    }
  }

  const togglePanel = () => {
    setIsPanelOpen(prev => !prev)
  }

  return {
    demoDates,
    isPanelOpen,
    isDemoMode,
    isEventLive,
    isCountdownActive,
    updateDate,
    startEventNow,
    restoreOriginalDates,
    goBackToPreEvent,
    togglePanel
  }
}
