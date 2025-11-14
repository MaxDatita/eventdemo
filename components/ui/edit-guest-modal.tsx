'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Textarea } from './textarea'
import { useDemoDates } from '@/contexts/DemoContext'

interface Guest {
  id: string
  firstName: string
  lastName: string
  companions: number
  dietaryRequirements: string
  confirmedAt: string
  tableNumber?: number | null
  deleted?: boolean
  deletedAt?: string | null
}

interface EditGuestModalProps {
  open: boolean
  onClose: () => void
  guest: Guest | null
  onSave: (updatedGuest: Guest) => void
}

export function EditGuestModal({ open, onClose, guest, onSave }: EditGuestModalProps) {
  const { isDarkMode } = useDemoDates()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companions: 0,
    dietaryRequirements: '',
    tableNumber: null as number | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (guest) {
      setFormData({
        firstName: guest.firstName,
        lastName: guest.lastName,
        companions: guest.companions,
        dietaryRequirements: guest.dietaryRequirements || '',
        tableNumber: guest.tableNumber || null
      })
    }
  }, [guest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guest) return

    setIsSubmitting(true)
    try {
      // Crear el invitado actualizado
      const updatedGuest: Guest = {
        ...guest,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companions: formData.companions,
        dietaryRequirements: formData.dietaryRequirements,
        tableNumber: formData.tableNumber
      }

      // Pasar el invitado actualizado al callback
      onSave(updatedGuest)
      onClose()
    } catch (error) {
      console.error('Error updating guest:', error)
      alert('Error al actualizar invitado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[500px] ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
            Editar Invitado
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nombre
              </label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Apellido
              </label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Acompañantes
              </label>
              <Input
                type="number"
                min="0"
                value={formData.companions}
                onChange={(e) => setFormData({ ...formData, companions: parseInt(e.target.value) || 0 })}
                required
                className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Número de Mesa
              </label>
              <Input
                type="number"
                min="1"
                value={formData.tableNumber || ''}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Sin asignar"
                className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Requerimientos Alimentarios
            </label>
            <Textarea
              value={formData.dietaryRequirements}
              onChange={(e) => setFormData({ ...formData, dietaryRequirements: e.target.value })}
              placeholder="Ej: Vegetariano, sin gluten..."
              rows={3}
              className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

