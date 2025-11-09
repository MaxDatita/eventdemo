'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { theme } from '@/config/theme'

export interface DemoDates {
  event: string
  contentActivation: string
  rsvpDeadline: string
  liveEnd: string
}

interface DemoContextType {
  demoDates: DemoDates
  isPanelOpen: boolean
  isDemoMode: boolean
  isEventLive: boolean
  isCountdownActive: boolean
  isDarkMode: boolean
  rsvpMode: 'tickets' | 'rsvp'
  updateDate: (key: keyof DemoDates, value: string) => void
  startEventNow: () => void
  restoreOriginalDates: () => void
  goBackToPreEvent: () => void
  togglePanel: () => void
  toggleDarkMode: () => void
  setRsvpMode: (mode: 'tickets' | 'rsvp') => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoProvider({ children }: { children: React.ReactNode }) {
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
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [rsvpMode, setRsvpMode] = useState<'tickets' | 'rsvp'>(theme.rsvpButton.mode === 'tickets' ? 'tickets' : 'rsvp')
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

    // Cargar modo oscuro guardado
    const savedDarkMode = localStorage.getItem('demo-dark-mode')
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }

    // Cargar modo RSVP guardado
    const savedRsvpMode = localStorage.getItem('demo-rsvp-mode')
    if (savedRsvpMode) {
      setRsvpMode(savedRsvpMode as 'tickets' | 'rsvp')
    }
  }, [])

  // Guardar fechas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('demo-dates', JSON.stringify(demoDates))
  }, [demoDates])

  // Guardar modo oscuro en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('demo-dark-mode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  // Guardar modo RSVP en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('demo-rsvp-mode', rsvpMode)
  }, [rsvpMode])

  // Función para activar el contador de 3 segundos
  const activateCountdown = () => {
    setIsCountdownActive(true)
    // Después de 3 segundos, activar el modo live
    setTimeout(() => {
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

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  const handleSetRsvpMode = (mode: 'tickets' | 'rsvp') => {
    setRsvpMode(mode)
  }

  const value = {
    demoDates,
    isPanelOpen: isPanelOpen,
    isDemoMode,
    isEventLive,
    isCountdownActive,
    isDarkMode,
    rsvpMode,
    updateDate,
    startEventNow,
    restoreOriginalDates,
    goBackToPreEvent,
    togglePanel,
    toggleDarkMode,
    setRsvpMode: handleSetRsvpMode
  }

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoDates() {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error('useDemoDates must be used within a DemoProvider')
  }
  return context
}
