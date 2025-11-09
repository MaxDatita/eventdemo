'use client'

import { useState, useEffect } from 'react'
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

interface LoteModalProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  lote?: {
    currentLot: number
    maxTicketsPerLot: number
    enabled: boolean
    soldOutMessage: string
    nextLotMessage: string
  }
}

export function LoteModal({ open, onClose, onSave, lote }: LoteModalProps) {
  const { isDarkMode } = useDemoDates()
  const [formData, setFormData] = useState({
    currentLot: lote?.currentLot || 1,
    maxTicketsPerLot: lote?.maxTicketsPerLot || 0,
    enabled: lote?.enabled ?? true,
    soldOutMessage: lote?.soldOutMessage || 'Lote agotado',
    nextLotMessage: lote?.nextLotMessage || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (lote) {
      setFormData({
        currentLot: lote.currentLot,
        maxTicketsPerLot: lote.maxTicketsPerLot,
        enabled: lote.enabled,
        soldOutMessage: lote.soldOutMessage,
        nextLotMessage: lote.nextLotMessage,
      })
    }
  }, [lote])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/dashboard/update-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'admin123',
          updates: {
            lotes: {
              enabled: formData.enabled,
              maxTicketsPerLot: formData.maxTicketsPerLot,
              currentLot: formData.currentLot,
              soldOutMessage: formData.soldOutMessage,
              nextLotMessage: formData.nextLotMessage,
            },
          },
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Lote actualizado correctamente')
        onSave()
        onClose()
      } else {
        toast.error(result.error || 'Error al actualizar lote')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar lote')
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
          <DialogTitle>
            {lote ? 'Editar Lote' : 'Crear Nuevo Lote'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Habilitar sistema de lotes
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Activar lotes
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Número de lote actual
            </label>
            <Input
              type="number"
              min="1"
              value={formData.currentLot}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentLot: parseInt(e.target.value) || 1,
                })
              }
              className={
                isDarkMode
                  ? 'bg-gray-800 text-white border-gray-600'
                  : ''
              }
            />
          </div>

          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Cantidad máxima de tickets por lote (0 para ilimitado)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.maxTicketsPerLot}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxTicketsPerLot: parseInt(e.target.value) || 0,
                })
              }
              className={
                isDarkMode
                  ? 'bg-gray-800 text-white border-gray-600'
                  : ''
              }
            />
          </div>

          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Mensaje cuando se agota el lote
            </label>
            <Input
              value={formData.soldOutMessage}
              onChange={(e) =>
                setFormData({ ...formData, soldOutMessage: e.target.value })
              }
              className={
                isDarkMode
                  ? 'bg-gray-800 text-white border-gray-600'
                  : ''
              }
            />
          </div>

          <div className="space-y-2">
            <label
              className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Mensaje informativo sobre próximo lote
            </label>
            <Input
              value={formData.nextLotMessage}
              onChange={(e) =>
                setFormData({ ...formData, nextLotMessage: e.target.value })
              }
              placeholder="Ej: El 15/03 se habilitan 100 tickets"
              className={
                isDarkMode
                  ? 'bg-gray-800 text-white border-gray-600'
                  : ''
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
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



