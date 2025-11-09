'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings, Play, RotateCcw, Moon, Sun, Shield, LayoutDashboard, MessageSquare, Ticket, Users } from 'lucide-react'
import { useDemoDates } from '@/contexts/DemoContext'
import { toast } from 'sonner'

export function DemoControlPanel() {
  const {
    isPanelOpen,
    isEventLive,
    isDarkMode,
    isDemoMode,
    rsvpMode,
    startEventNow,
    goBackToPreEvent,
    togglePanel,
    toggleDarkMode,
    setRsvpMode
  } = useDemoDates()

  const handleRsvpModeChange = async (mode: 'tickets' | 'rsvp') => {
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
          password: 'admin123',
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
    const url = isDemoMode 
      ? '/moderacion?demo=true&password=admin123'
      : '/moderacion'
    window.open(url, '_blank')
    togglePanel()
  }

  const handleNavigateToDashboard = () => {
    const url = isDemoMode
      ? '/dashboard?demo=true&password=admin123'
      : '/dashboard'
    window.open(url, '_blank')
    togglePanel()
  }

  const handleNavigateToMessages = () => {
    const messagesPath = rsvpMode === 'tickets' ? '/mensajes' : '/mensajesevent'
    window.open(messagesPath, '_blank')
    togglePanel()
  }

  return (
    <>
      <Button
        onClick={togglePanel}
        className="fixed top-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg"
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
                    ? 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700' 
                    : 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
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
                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Moderación de Imágenes
                  </Button>

                  <Button
                    onClick={handleNavigateToDashboard}
                    className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard del Evento
                  </Button>

                  <Button
                    onClick={handleNavigateToMessages}
                    className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Mensajes
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-300 dark:border-gray-700 pt-3 mt-2">
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Modo de Evento
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRsvpModeChange('tickets')}
                    className={`flex-1 flex items-center justify-center ${
                      rsvpMode === 'tickets'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Tickets
                  </Button>
                  <Button
                    onClick={() => handleRsvpModeChange('rsvp')}
                    className={`flex-1 flex items-center justify-center ${
                      rsvpMode === 'rsvp'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    RSVP
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
