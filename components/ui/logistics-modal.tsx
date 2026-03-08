'use client'

import { useState } from 'react'
import { Button } from "./button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog"
import { MapPin, Clock, Map, ArrowLeft, Route } from 'lucide-react'
import Image from 'next/image'
import { theme } from '@/config/theme'
import { useDemoDates } from '@/contexts/DemoContext'

interface Schedule {
  time: string
  activity: string
}

interface LogisticsData {
  googleMapsUrl: string
  venueMapUrl: string
  schedule: Schedule[]
}

const defaultLogisticsData: LogisticsData = {
  googleMapsUrl: "https://maps.app.goo.gl/6GKZKzyWFRGa2bj19", // Tu URL de Google Maps
  venueMapUrl: "/map-event.webp", // La ruta a tu imagen del mapa del venue
  schedule: [
    { time: "19:30", activity: "Apertura de puertas y recepción" },
    { time: "20:00", activity: "Cóctel de bienvenida" },
    { time: "20:30", activity: "Presentación de invitados especiales" },
    { time: "21:00", activity: "Ceremonia principal" },
    { time: "21:30", activity: "Brindis y fotos" },
    { time: "22:00", activity: "Cena de gala" },
    { time: "23:00", activity: "Postre y café" },
    { time: "23:30", activity: "Primera presentación musical" },
    { time: "00:00", activity: "DJ set - Música electrónica" },
    { time: "00:30", activity: "Barra libre de cócteles" },
    { time: "01:00", activity: "Banda en vivo" },
    { time: "01:30", activity: "Pista de baile abierta" },
    { time: "02:00", activity: "Segundo DJ set" },
    { time: "02:30", activity: "Cócteles especiales de medianoche" },
    { time: "03:00", activity: "Cierre del evento" }
  ]
}

type ContentType = 'main' | 'schedule' | 'map'

interface LogisticsModalProps {
  data?: LogisticsData
}

// Componente para el modal del mapa
const MapModal = ({ 
  isOpen, 
  onClose, 
  imageUrl,
  onReturn  // Nuevo prop para volver al modal de logística
}: { 
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onReturn: () => void
}) => {
  const { isDarkMode } = useDemoDates();
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideDefaultCloseButton className={`sm:max-w-[425px] p-0 overflow-hidden rounded-xl ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
        <div className="relative w-[calc(100%+3rem)] -mx-6 aspect-square min-h-0 overflow-hidden">
          <button
            type="button"
            aria-label="Cerrar y volver a Logística"
            className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-[#04724d] hover:bg-[#036340] flex items-center justify-center text-white shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            onClick={() => {
              onClose()
              onReturn()
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M18 6 6 18" />
              <path d="M6 6 18 18" />
            </svg>
          </button>
          <Image
            src={imageUrl}
            alt="Mapa del venue"
            fill
            className="rounded-lg object-cover object-center"
            sizes="(max-width: 425px) 100vw, 425px"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function LogisticsModal({ data = defaultLogisticsData }: LogisticsModalProps) {
  const { isDarkMode, isDemoMode, isEventLive, demoDates } = useDemoDates();
  const [contentType, setContentType] = useState<ContentType>('main')
  const [isOpen, setIsOpen] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const contentActivationDate = isDemoMode ? new Date(demoDates.contentActivation) : new Date(theme.dates.contentActivation)
  const isContentActive = isDemoMode ? isEventLive : (new Date() >= contentActivationDate)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setContentType('main')
    }
  }

  const handleShowMap = () => {
    setShowMap(true)
    setIsOpen(false)
  }

  const handleReturnToLogistics = () => {
    setShowMap(false)
    setIsOpen(true)
  }

  const getDialogHeight = () => {
    switch (contentType) {
      case 'schedule':
        return 'h-[500px]'
      default:
        return 'h-auto min-h-[300px]'
    }
  }

  const renderContent = () => {
    switch (contentType) {
      case 'schedule':
        return isContentActive ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 p-4">
                <div className="grid gap-4 max-h-[350px] pr-2 mb-6">
                  {data.schedule.map((item, index) => (
                    <div key={index} className={`grid grid-cols-4 items-center gap-4 ${isDarkMode ? 'text-white' : ''}`}>
                      <span className="font-bold">{item.time}</span>
                      <span className="col-span-3">{item.activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <Button 
                variant="invitation"
                className="w-full flex items-center justify-center"
                onClick={() => setContentType('main')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Logística
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center p-4">
              <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
                El cronograma estará disponible más cerca de la fecha del evento.
              </p>
            </div>
            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <Button 
                variant="invitation"
                className="w-full flex items-center justify-center"
                onClick={() => setContentType('main')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Logística
              </Button>
            </div>
          </div>
        )
      
      default:
        return (
          <div className={`space-y-4 p-4 ${isDarkMode ? 'text-white' : ''}`}>
            <Button 
              variant="invitation"
              className="w-full flex items-center justify-center"
              onClick={() => window.open(data.googleMapsUrl, '_blank')}
            >
              <MapPin className="mr-2 h-4 w-4" /> 
              Ver ubicación
            </Button>

            <Button 
              variant="invitation"
              className="w-full flex items-center justify-center"
              onClick={() => setContentType('schedule')}
            >
              <Clock className="mr-2 h-4 w-4" />
              Cronograma del evento
            </Button>

            <Button 
              variant="invitation"
              className="w-full flex items-center justify-center"
              onClick={handleShowMap}
            >
              <Map className="mr-2 h-4 w-4" />
              Mapa del lugar
            </Button>
          </div>
        )
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="invitation" className="w-full flex items-center justify-center">
            <Route className="mr-2 h-4 w-4" /> Logística
          </Button>
        </DialogTrigger>
        <DialogContent className={`sm:max-w-[425px] ${getDialogHeight()} flex flex-col ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
          <DialogHeader className="text-center">
            <DialogTitle className={`text-center font-semibold ${isDarkMode ? 'text-white' : 'text-[#04724d]'}`}>{contentType === 'schedule' ? "Cronograma del Evento" : "Logística del Evento"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>

      <MapModal 
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        imageUrl={data.venueMapUrl}
        onReturn={handleReturnToLogistics}
      />
    </>
  )
} 