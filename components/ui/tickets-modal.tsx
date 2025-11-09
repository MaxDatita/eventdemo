'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StyledDialog } from "@/components/ui/styled-dialog"
import { Ticket, Plus, Minus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { checkTicketAvailability } from '@/lib/google-sheets-registros'
import { theme } from '@/config/theme'
import { useDemoDates } from '@/contexts/DemoContext'

interface TicketType {
  id: string
  name: string
  price: number
  description?: string
}

const ticketTypes: TicketType[] = [
  {
    id: 'Regular',
    name: 'Regular',
    price: 1000,
    description: 'Acceso general al evento'
  },
  {
    id: 'VIP',
    name: 'VIP',
    price: 2000,
    description: 'Acceso VIP con beneficios exclusivos'
  }
]

export function TicketsModal({ onClose }: { onClose: () => void }) {
  const { isDarkMode } = useDemoDates()
  const [selectedTicket, setSelectedTicket] = useState<string>('Regular')
  const [quantity, setQuantity] = useState<number>(1)
  const [remainingTickets, setRemainingTickets] = useState<number | null>(null)
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true)
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedTicketType = ticketTypes.find(t => t.id === selectedTicket)
  const total = (selectedTicketType?.price || 0) * quantity

  useEffect(() => {
    const checkAvailability = async () => {
      setIsLoadingAvailability(true);
      try {
        // DEMO: Simular verificación de disponibilidad
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // DEMO: Simular disponibilidad ilimitada
        setRemainingTickets(-1); // -1 significa disponibilidad ilimitada
      } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        setRemainingTickets(-1); // En caso de error, asumir disponibilidad ilimitada
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    checkAvailability();
  }, [selectedTicket]);

  const validateQuantity = (newQuantity: number) => {
    if (remainingTickets !== null && remainingTickets !== -1) {
      return Math.min(newQuantity, remainingTickets);
    }
    return newQuantity;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyerInfo.name || !buyerInfo.email) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setIsSubmitting(true)
    try {
      // DEMO: Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay de red
      
      toast.success('Redirigiendo a MercadoPago...')
      
      // Cerrar el modal después de un breve delay
      setTimeout(() => {
        onClose()
      }, 2000)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar el pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`grid gap-4 ${isDarkMode ? 'text-white bg-gray-900 border-gray-700' : 'bg-white'}`}>
      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>Tipo de Ticket</label>
        <div className="grid grid-cols-2 gap-2">
          {ticketTypes.map((ticket) => (
            <Button
              key={ticket.id}
              type="button"
              variant={selectedTicket === ticket.id ? "primary" : "secondary"}
              onClick={() => setSelectedTicket(ticket.id)}
              className="w-full"
            >
              <div className="text-left">
                <div>{ticket.name}</div>
                <div className="text-sm opacity-70">${ticket.price}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>Cantidad</label>
        {remainingTickets !== null && remainingTickets <= 10 && remainingTickets > 0 && (
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">¡Quedan solo {remainingTickets} tickets disponibles!</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            max={remainingTickets !== null && remainingTickets !== -1 ? remainingTickets : undefined}
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 1) {
                setQuantity(validateQuantity(value));
              }
            }}
            className={`text-center ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}`}
            disabled={isLoadingAvailability}
          />
          <div className="flex">
            <Button
              type="button"
              variant="primary"
              onClick={() => setQuantity(prev => validateQuantity(Math.max(1, prev - 1)))}
              className="h-10 w-10 flex items-center justify-center rounded-r-none p-0"
              disabled={quantity <= 1 || isLoadingAvailability}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setQuantity(prev => validateQuantity(prev + 1))}
              className="h-10 w-10 flex items-center justify-center rounded-l-none border-l border-white/20 p-0"
              disabled={remainingTickets !== null && remainingTickets !== -1 && quantity >= remainingTickets || isLoadingAvailability}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>Nombre</label>
        <Input
          placeholder="Tu nombre completo"
          value={buyerInfo.name}
          onChange={(e) => setBuyerInfo(prev => ({ ...prev, name: e.target.value }))}
          required
          className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
        />
      </div>

      <div className="space-y-2">
        <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>Email</label>
        <Input
          type="email"
          placeholder="tu@email.com"
          value={buyerInfo.email}
          onChange={(e) => setBuyerInfo(prev => ({ ...prev, email: e.target.value }))}
          required
          className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
        />
      </div>

      <div>
        <p className={`text-sm text-justify ${isDarkMode ? 'text-white' : ''}`}>
          <span>
            <span className="font-bold">Nota:</span> Asegúrate de que los datos sean correctos para recibir tus tickets. Pago administrado por <span className={`font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-400'}`}>MercadoPago</span>.
          </span>
        </p>
      </div>

      <div className={`py-2 text-lg font-semibold border-t ${isDarkMode ? 'text-white border-gray-600' : ''}`}>
        Total a pagar: ${total}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Procesando...' : 'Comprar'}
      </Button>
    </form>
  )
} 