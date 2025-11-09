'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useDemoDates } from '@/contexts/DemoContext'
import { toast } from 'sonner'

interface GenerateTicketModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function GenerateTicketModal({
  open,
  onClose,
  onSuccess,
}: GenerateTicketModalProps) {
  const { isDarkMode } = useDemoDates()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ticketType: 'Regular',
    quantity: 1,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/dashboard/generate-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'admin123',
          name: formData.name,
          email: formData.email,
          ticketType: formData.ticketType,
          quantity: formData.quantity,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(result.message)
        setFormData({
          name: '',
          email: '',
          ticketType: 'Regular',
          quantity: 1,
        })
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || 'Error al generar tickets')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar tickets')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}
      >
        <DialogHeader>
          <DialogTitle>Generar Tickets Gratuitos</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Nombre completo
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className={
                isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''
              }
            />
          </div>

          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className={
                isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''
              }
            />
          </div>

          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Tipo de ticket
            </label>
            <select
              value={formData.ticketType}
              onChange={(e) =>
                setFormData({ ...formData, ticketType: e.target.value })
              }
              className={`w-full h-9 px-3 rounded-xl border ${
                isDarkMode
                  ? 'bg-gray-800 text-white border-gray-600'
                  : 'bg-white border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Cantidad
            </label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 1,
                })
              }
              className={
                isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generando...' : 'Generar Tickets'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



