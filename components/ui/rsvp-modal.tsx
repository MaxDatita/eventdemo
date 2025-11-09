'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserCheck, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { useDemoDates } from '@/contexts/DemoContext'

export function RsvpModal({ onClose }: { onClose: () => void }) {
  const { isDarkMode } = useDemoDates()
  const [guestInfo, setGuestInfo] = useState({
    lastName: '',
    firstName: '',
    companions: 0,
    dietaryRequirements: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestInfo.lastName || !guestInfo.firstName) {
      toast.error('Por favor completa el nombre y apellido del invitado')
      return
    }

    if (guestInfo.companions < 0) {
      toast.error('La cantidad de acompañantes no puede ser negativa')
      return
    }

    setIsSubmitting(true)
    try {
      // DEMO: Simular envío de confirmación
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay de red
      
      toast.success('¡Asistencia confirmada exitosamente!')
      
      // Cerrar el modal después de un breve delay
      setTimeout(() => {
        onClose()
        // Resetear el formulario
        setGuestInfo({
          lastName: '',
          firstName: '',
          companions: 0,
          dietaryRequirements: ''
        })
      }, 1000)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al confirmar asistencia')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`grid gap-4 ${isDarkMode ? 'text-white bg-gray-900 border-gray-700' : 'bg-white'}`}>
      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>
          Apellido del invitado <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="Apellido"
          value={guestInfo.lastName}
          onChange={(e) => setGuestInfo(prev => ({ ...prev, lastName: e.target.value }))}
          required
          className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
        />
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>
          Nombre del invitado <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="Nombre"
          value={guestInfo.firstName}
          onChange={(e) => setGuestInfo(prev => ({ ...prev, firstName: e.target.value }))}
          required
          className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
        />
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>
          Cantidad de personas que lo acompañan
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            value={guestInfo.companions}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 0) {
                setGuestInfo(prev => ({ ...prev, companions: value }));
              } else if (e.target.value === '') {
                setGuestInfo(prev => ({ ...prev, companions: 0 }));
              }
            }}
            className={`text-center ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}`}
          />
          <div className="flex">
            <Button
              type="button"
              variant="primary"
              onClick={() => setGuestInfo(prev => ({ ...prev, companions: Math.max(0, prev.companions - 1) }))}
              className="h-10 w-10 flex items-center justify-center rounded-r-none p-0"
              disabled={guestInfo.companions <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setGuestInfo(prev => ({ ...prev, companions: prev.companions + 1 }))}
              className="h-10 w-10 flex items-center justify-center rounded-l-none border-l border-white/20 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Incluye la cantidad de personas adicionales que asistirán contigo
        </p>
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>
          Requerimientos específicos para la comida
        </label>
        <Textarea
          placeholder="Ej: Vegetariano, sin gluten, alergias, etc. (opcional)"
          value={guestInfo.dietaryRequirements}
          onChange={(e) => setGuestInfo(prev => ({ ...prev, dietaryRequirements: e.target.value }))}
          rows={3}
          className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
        />
      </div>

      <div className={`py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <p className="text-justify">
          <span className="font-bold">Nota:</span> Por favor, completa todos los campos requeridos. 
          La información proporcionada será utilizada para organizar mejor el evento.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center"
      >
        <UserCheck className="mr-2 h-4 w-4" />
        {isSubmitting ? 'Confirmando...' : 'Confirmar Asistencia'}
      </Button>
    </form>
  )
}





