'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings, Play, RotateCcw, Moon, Sun, Shield, LayoutDashboard, MessageSquare, Ticket, Users, MonitorPlay, Heart } from 'lucide-react'
import { useDemoDates } from '@/contexts/DemoContext'
import { toast } from 'sonner'
import { demoFeatures } from '@/config/feature-flags'

export function DemoControlPanel() {
  const {
    isPanelOpen,
    isEventLive,
    isDarkMode,
    rsvpMode,
    startEventNow,
    goBackToPreEvent,
    togglePanel,
    toggleDarkMode,
    setRsvpMode
  } = useDemoDates()

  const handleRsvpModeChange = async (mode: 'tickets' | 'rsvp') => {
    const password = window.prompt('Ingresá la contraseña de demo para guardar este cambio:')
    if (!password?.trim()) {
      toast.error('Se necesita la contraseña para guardar el cambio')
      return
    }

    // Actualizar el estado local primero
    setRsvpMode(mode)
    
    // Actualizar el theme.ts
    try {
      const response = await fetch('/api/dashboard/update-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password.trim(),
          updates: {
            rsvpButton: {
              mode: mode
            }
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Modo cambiado a ${mode === 'tickets' ? 'Tickets' : 'RSVP'}`)
        // Recargar la página para aplicar los cambios del theme
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        toast.error('Error al actualizar el modo')
      }
    } catch (error) {
      console.error('Error updating rsvp mode:', error)
      toast.error('Error al actualizar el modo')
    }
  }

  const handleAction = () => {
    if (isEventLive) {
      goBackToPreEvent()
    } else {
      startEventNow()
    }
    togglePanel() // Cerrar el modal después de la acción
  }

  const handleNavigateToModeration = () => {
    window.open('/moderacion', '_blank')
    togglePanel()
  }

  const handleNavigateToDashboard = () => {
    window.open('/invitados', '_blank')
    togglePanel()
  }

  const handleNavigateToMessages = () => {
    const messagesPath = demoFeatures.tickets && rsvpMode === 'tickets' ? '/mensajes' : '/mensajesevent'
    window.open(messagesPath, '_blank')
    togglePanel()
  }

  const handleNavigateToProjection = () => {
    window.open('/proyeccion', '_blank')
    togglePanel()
  }

  const handleNavigateToMemories = () => {
    window.open('https://memories.eventechy.com', '_blank', 'noopener,noreferrer')
    togglePanel()
  }

  return (
    <>
      <Button
        onClick={togglePanel}
        className="fixed right-6 z-50 bg-[#FF914E] hover:bg-[#ff8132] text-white rounded-full p-3 shadow-lg top-[18px]"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Dialog open={isPanelOpen} onOpenChange={togglePanel}>
        <DialogContent className={`sm:max-w-md ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={`text-center flex items-center justify-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Settings className="h-5 w-5" />
              Panel de Control Demo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleAction}
                className={`w-full text-white font-semibold flex items-center justify-center ${
                  isEventLive 
                    ? 'bg-[#FFCF6E] hover:bg-[#ffc24f] text-[#8A4A14]' 
                    : 'bg-[#FF914E] hover:bg-[#ff8132]'
                }`}
              >
                {isEventLive ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Volver a Pre-Evento
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Evento Ahora
                  </>
                )}
              </Button>
              
              <Button
                onClick={toggleDarkMode}
                className={`w-full flex items-center justify-center ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600' 
                    : 'bg-gray-800 text-white border border-gray-300 hover:bg-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700'
                }`}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4 dark:text-white" />
                    Modo Oscuro
                  </>
                )}
              </Button>

              <div className="border-t border-gray-300 dark:border-gray-700 pt-3 mt-2">
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Navegación
                </h3>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleNavigateToModeration}
                    className="w-full flex items-center justify-center bg-[#FFCF6E] hover:bg-[#F5C55E] text-black"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Moderación de Imágenes
                  </Button>

                  <Button
                    onClick={handleNavigateToDashboard}
                    className="w-full flex items-center justify-center bg-[#FFCF6E] hover:bg-[#F5C55E] text-black"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel de Invitados
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-300 dark:border-gray-700 pt-3 mt-2">
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Vista en Pantalla
                </h3>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleNavigateToMessages}
                    className="w-full flex items-center justify-center bg-[#FFCF6E] hover:bg-[#F5C55E] text-black"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Mensajes
                  </Button>

                  <Button
                    onClick={handleNavigateToProjection}
                    className="w-full flex items-center justify-center bg-[#FFCF6E] hover:bg-[#F5C55E] text-black"
                  >
                    <MonitorPlay className="mr-2 h-4 w-4" />
                    Vista de Fotos
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-300 dark:border-gray-700 pt-3 mt-2">
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Recuerdos del Evento
                </h3>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleNavigateToMemories}
                    className="w-full flex items-center justify-center bg-[#FFCF6E] hover:bg-[#F5C55E] text-black"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Ver Recuerdos
                  </Button>
                </div>
              </div>

              {(demoFeatures.rsvp || demoFeatures.tickets) && (
              <div className="border-t border-gray-300 dark:border-gray-700 pt-3 mt-2">
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Modo de Evento
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRsvpModeChange('tickets')}
                    className={`flex-1 flex items-center justify-center ${
                      rsvpMode === 'tickets'
                        ? 'bg-[#FF914E] hover:bg-[#ff8132] text-white'
                        : 'bg-[#FFF4DC] hover:bg-[#FFEDC8] text-[#B95D1B] dark:bg-[#FFF4DC] dark:hover:bg-[#FFEDC8] dark:text-[#B95D1B]'
                    }`}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Tickets
                  </Button>
                  <Button
                    onClick={() => handleRsvpModeChange('rsvp')}
                    className={`flex-1 flex items-center justify-center ${
                      rsvpMode === 'rsvp'
                        ? 'bg-[#FF914E] hover:bg-[#ff8132] text-white'
                        : 'bg-[#FFF4DC] hover:bg-[#FFEDC8] text-[#B95D1B] dark:bg-[#FFF4DC] dark:hover:bg-[#FFEDC8] dark:text-[#B95D1B]'
                    }`}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    RSVP
                  </Button>
                </div>
              </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
