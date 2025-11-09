'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, MailPlus, Image as ImageIcon, Ticket, Camera, Film, Users } from 'lucide-react'
import Image from 'next/image'
import { theme } from '@/config/theme';
import { StyledDialog } from "@/components/ui/styled-dialog"
import { MenuModal } from "@/components/ui/menu-modal"
import { LogisticsModal } from "@/components/ui/logistics-modal"
import { TicketsModal } from "@/components/ui/tickets-modal"
import { RsvpModal } from "@/components/ui/rsvp-modal"
import { ProvidersModal } from "@/components/ui/providers-modal"
import { Card } from "@/components/ui/card"
import { PhotoCameraModal } from "@/components/photo-camera-modal"
import { PhotoWall } from "@/components/photo-wall"
import { toast } from 'sonner'
import { demoMessages, DemoMessage } from '@/data/demo-messages'
import { useDemoDates } from '@/contexts/DemoContext'
import { UserCheck } from 'lucide-react'


const gradientColors = [
  'from-red-400 to-pink-600',
  'from-orange-400 to-red-600',
  'from-yellow-400 to-orange-600',
  'from-green-400 to-emerald-600',
  'from-teal-400 to-cyan-600',
  'from-blue-400 to-indigo-600',
  'from-indigo-400 to-purple-600',
  'from-purple-400 to-pink-600',
]

const getConsistentGradient = (name: string) => {
  if (!name) return gradientColors[0];
  
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return gradientColors[hash % gradientColors.length];
}


const InitialsCircle = ({ name }: { name: string }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : ''
  const gradient = getConsistentGradient(name)
  
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 bg-gradient-to-br ${gradient}`}>
      {initials}
    </div>
  )
}

interface MessageCardProps {
  message: {
    id: number;
    nombre: string;
    mensaje: string;
  };
  onClick: () => void;
}

// Componente para mostrar un mensaje en el carrusel
const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
  const { isDarkMode } = useDemoDates();
  
  return (
    <div 
      className={`message-card ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center mb-2">
        <div className="flex-shrink-0">
          <InitialsCircle name={message.nombre} />
        </div>
        <span className={`font-semibold truncate overflow-hidden flex-1 ${isDarkMode ? 'text-white' : ''}`}>
          {message.nombre}
        </span>
      </div>
      <p className={`message-card-content ${isDarkMode ? 'text-gray-200' : ''}`}>
        {message.mensaje}
      </p>
    </div>
  )
}

interface ApiMessage {
  nombre: string;
  mensaje: string;
}

interface CarouselMessage {
  id: number;
  nombre: string;
  mensaje: string;
}


export function InvitacionDigitalComponent() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [eventStarted, setEventStarted] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ApiMessage | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [newMessage, setNewMessage] = useState({
    nombre: '',
    mensaje: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const pageSize = 20;
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'bebidas' | 'comidas'>('bebidas');
  const [showLive, setShowLive] = useState(false)
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showPhotoCamera, setShowPhotoCamera] = useState(false);
  const [showPhotoWall, setShowPhotoWall] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [isRsvpActive, setIsRsvpActive] = useState(true);
  const [ticketAvailability, setTicketAvailability] = useState<{[key: string]: number}>({})
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);

  // DEMO: Usar fechas del hook de demo solo cuando se active el modo demo
  const { demoDates, isDemoMode, isCountdownActive, isEventLive, isDarkMode, rsvpMode } = useDemoDates();
  
  
  const eventDate = useMemo(() => {
    return isDemoMode ? new Date(demoDates.event) : new Date(theme.dates.event);
  }, [demoDates.event, isDemoMode]);
  
  const contentActivationDate = useMemo(() => {
    return isDemoMode ? new Date(demoDates.contentActivation) : new Date(theme.dates.contentActivation);
  }, [demoDates.contentActivation, isDemoMode]);
  const liveEndDate = useMemo(() => {
    return isDemoMode ? new Date(demoDates.liveEnd) : new Date(theme.dates.liveEnd);
  }, [demoDates.liveEnd, isDemoMode]);


  // DEMO: Usar mensajes ficticios en lugar de API
  const carouselMessages = demoMessages;
  const allMessages = demoMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentDate(now)
      const difference = eventDate.getTime() - now.getTime()
      const liveEndDifference = liveEndDate.getTime() - now.getTime()

      // En modo demo, usar isEventLive del hook
      if (isDemoMode) {
        if (isEventLive) {
          setEventStarted(true)
          setShowLive(true)
        } else {
          setEventStarted(false)
          setShowLive(false)
        }
      } else {
        // Lógica normal para modo no-demo
        if (difference <= 0 && liveEndDifference > 0) {
          setEventStarted(true)
          setShowLive(true)
        } else if (liveEndDifference <= 0) {
          setShowLive(false)
        }

        if (difference <= 0) {
          setEventStarted(true)
          setShowUpdateButton(true)
          clearInterval(interval)
        }
      }

      if (difference <= 0) {
        setEventStarted(true)
        setShowUpdateButton(true)
        clearInterval(interval)
      } else {
        // Si está activo el contador de demo de 3 segundos
        if (isDemoMode && isCountdownActive) {
          const demoCountdown = Math.max(0, Math.ceil(difference / 1000))
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: demoCountdown })
        } else {
          // Contador normal
          const d = Math.floor(difference / (1000 * 60 * 60 * 24))
          const h = Math.floor((difference / (1000 * 60 * 60)) % 24)
          const m = Math.floor((difference / 1000 / 60) % 60)
          const s = Math.floor((difference / 1000) % 60)
          setCountdown({ days: d, hours: h, minutes: m, seconds: s })
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [eventDate, liveEndDate, isDemoMode, isCountdownActive, isEventLive]) // Usar las fechas calculadas directamente

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (eventStarted && carouselRef.current) {
      const scrollWidth = carouselMessages.length * 272
      let scrollPosition = 0

      const scroll = () => {
        if (!carouselRef.current) return;
        scrollPosition += 1
        if (scrollPosition >= scrollWidth) {
          scrollPosition = 0
        }
        carouselRef.current.scrollLeft = scrollPosition
      }

      const intervalId = setInterval(scroll, 50)
      return () => clearInterval(intervalId)
    }
  }, [eventStarted, carouselMessages.length])

  const isContentActive = isDemoMode ? isEventLive : (currentDate >= contentActivationDate)

  const handleMessageClick = useCallback((message: { id: number; nombre: string; mensaje: string }) => {
    setSelectedMessage({
      nombre: message.nombre,
      mensaje: message.mensaje
    })
  }, [])

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.nombre || !newMessage.mensaje) return;

    setIsSubmitting(true);
    try {
      // DEMO: Simular envío de mensaje
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay de red
      
      toast.success('¡Mensaje enviado!');
      setNewMessage({ nombre: '', mensaje: '' });
      setIsMessageDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  // DEMO: Simular disponibilidad de tickets
  const checkAllTicketsAvailability = useCallback(async () => {
    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // DEMO: Simular disponibilidad ilimitada
      const availability: {[key: string]: number} = {};
      theme.tickets.types.forEach(ticket => {
        availability[ticket.id] = -1; // -1 significa disponibilidad ilimitada
      });
      
      setTicketAvailability(availability);
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      // En caso de error, asumimos disponibilidad ilimitada
      const errorAvailability: {[key: string]: number} = {};
      theme.tickets.types.forEach(ticket => {
        errorAvailability[ticket.id] = -1;
      });
      setTicketAvailability(errorAvailability);
    }
  }, []);

  // useEffect para verificar RSVP y disponibilidad
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const now = new Date();
        const rsvpDeadline = isDemoMode ? new Date(demoDates.rsvpDeadline) : new Date(theme.dates.rsvpDeadline);
        const isActive = now <= rsvpDeadline;
        
        
        setIsRsvpActive(isActive);
        
        if (isActive && theme.tickets.lotes.enabled) {
          await checkAllTicketsAvailability();
        }
        setIsCheckingAvailability(false);
      } catch (error) {
        console.error('Error en checkStatus:', error);
        setIsCheckingAvailability(false);
      }
    };

    // Verificar inmediatamente
    checkStatus();
    const intervalId = setInterval(checkStatus, 30 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [demoDates.rsvpDeadline, isDemoMode, isEventLive]); // Dependencia de fechas de demo y modo demo

  // Función para verificar si la fecha está vencida (en tiempo real)
  const isDeadlinePassed = () => {
    const now = new Date();
    const rsvpDeadline = isDemoMode ? new Date(demoDates.rsvpDeadline) : new Date(theme.dates.rsvpDeadline);
    return now > rsvpDeadline;
  };

  // Función para manejar el click en el botón de tickets
  const handleTicketButtonClick = useCallback(async () => {
    try {
      if (theme.tickets.lotes.enabled) {
        await checkAllTicketsAvailability();
        
        const hasAvailableTickets = Object.values(ticketAvailability).some(
          remaining => remaining === -1 || remaining > 0
        );

        if (!hasAvailableTickets) {
          toast.error(theme.tickets.lotes.soldOutMessage);
          if (theme.tickets.lotes.nextLotMessage) {
            toast.info(theme.tickets.lotes.nextLotMessage);
          }
          return;
        }
      }

      setShowTicketsModal(true);
    } catch (error) {
      console.error('Error al verificar tickets:', error);
      toast.error('Error al verificar disponibilidad de tickets');
    }
  }, [ticketAvailability]);

  //Comienzo la invitacion digital
  return (
    <>
      <div className="bg-gradient-animation" />
      <div className="content-container">
        {eventStarted && showLive && (
          <div className="live-indicator mr-16 mt-1">
            <div className="live-dot"></div>
            <span className="text-sm font-bold">LIVE</span>
          </div>
        )}
        
        {/* DEMO: Badge de modo demo */}
        <div className="demo-badge">
          <span className="text-xs font-bold">MODO DEMO</span>
        </div>
        
        <div className="w-full max-w-md mx-auto rounded-xl">
          <video
            className="w-full h-64 object-cover rounded-lg shadow-lg mb-4 rounded-xl"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={theme.resources.images.video} type="video/mp4" />
            Tu navegador no soporta el tag de video.
          </video>

          <div className="title-image-container">
            <Image
              src={theme.resources.images.title}
              alt="Eventest"
              width={300}
              height={100}
              className="title-image"
              priority
            />
          </div>

          {/* <h1 className="heading-h1">
            Celebremos Juntos
          </h1> */}

          <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden">
            {theme.resources.images.carousel.map((src, index) => (
              <Image
                key={index}
                src={src}
                alt={`Imagen de celebración ${index + 1}`}
                fill
                className={`object-cover rounded-lg shadow-lg transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
          </div>

          <p className="heading-h2 mt-4 mb-4">
            {eventStarted ? 'El evento ya comenzó, disfrutá la fiesta!' : <span>Te invitamos a vivir una noche inolvidable! 🎉 <br /> No te lo puedes perder 🔊🎶🥂</span>}
          </p>

          {eventStarted ? (
            <div className="mb-6">
              {carouselMessages.length === 0 ? (
                <p className={`text-center mt-12 mb-12 ${isDarkMode ? 'text-white' : ''}`}>Sé el primero en dejar un mensaje</p>
              ) : (
                <>
                  <div ref={carouselRef} className="overflow-x-hidden whitespace-nowrap">
                    <div className="inline-flex gap-4" style={{ width: `${carouselMessages.length * 272 * 2}px` }}>
                      {carouselMessages.map((message: DemoMessage) => (
                        <MessageCard key={message.id} message={message} onClick={() => handleMessageClick(message)} />
                      ))}
                      {carouselMessages.map((message: DemoMessage) => (
                        <MessageCard key={`duplicate-${message.id}`} message={message} onClick={() => handleMessageClick(message)} />
                      ))}
                    </div>
                  </div>
                  <Button 
                    variant="primary" 
                    className="flex mt-4 w-full items-center justify-center" 
                    onClick={() => setSelectedMessage({ 
                      nombre: 'Todos los mensajes', 
                      mensaje: '' 
                    })}
                  >
                    <MailPlus className="mr-2 h-4 w-4"/> Ver todos los mensajes
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div>
              <div className='countdown-message'>
                Te esperamos este {eventDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}  
                , {eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}hs para pasar una noche inolvidable.
              </div>
              <div className='body-base text-center mb-2'> 
                {isDemoMode && isCountdownActive ? 'Iniciando evento en:' : 'Faltan:'} 
              </div>
              <div className="countdown-container">
                <div className="countdown-item">
                  <span className="countdown-number">{isDemoMode && isCountdownActive ? 0 : countdown.days}</span>
                  <p className="countdown-label">Días</p>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{isDemoMode && isCountdownActive ? 0 : countdown.hours}</span>
                  <p className="countdown-label">Horas</p>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{isDemoMode && isCountdownActive ? 0 : countdown.minutes}</span>
                  <p className="countdown-label">Minutos</p>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.seconds}</span>
                  <p className="countdown-label">Segundos</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <LogisticsModal />
            <MenuModal />
            <StyledDialog 
              title="Contenido del Evento"
              open={showContentModal}
              onOpenChange={(newOpen) => {
                // Si hay modales hijos abiertos, no cerrar el modal de contenido
                if (!newOpen && (showPhotoCamera || showPhotoWall)) {
                  // No cerrar si hay modales hijos abiertos
                  return;
                }
                setShowContentModal(newOpen);
              }}
              preventCloseWhenChildrenOpen={showPhotoCamera || showPhotoWall}
              trigger={
                <Button 
                  variant="primary" 
                  className="flex items-center justify-center"
                  onClick={() => setShowContentModal(true)}
                >
                  <ImageIcon className="mr-2 h-4 w-4" /> Contenido
                </Button>
              }
            >
              <div className="grid gap-4">
                {isContentActive ? (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-sm opacity-80">
                      Explora y comparte contenido del evento
                    </p>
                    
                    {/* Botón Principal: Contenido Oficial */}
                    <div className="w-full space-y-2">
                      <Button
                        variant="primary"
                        className="w-full flex items-center justify-center gap-2 py-6"
                        onClick={() => window.open(theme.resources.contentLink, "_blank")}
                      >
                        <Film className="h-5 w-5" />
                        <span className="font-semibold">Contenido Oficial</span>
                      </Button>
                      <p className="text-xs text-center opacity-70 px-2">
                        Fotos profesionales, videos y reels del evento
                      </p>
                    </div>

                    {/* Botones Secundarios */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {/* Galería de Invitados */}
                      <div className="space-y-1">
                        <Button
                          variant="secondary"
                          className="w-full flex flex-col items-center justify-center gap-2 py-4 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPhotoWall(true);
                          }}
                        >
                          <Users className="h-5 w-5" />
                          <span className="text-sm font-medium">Galería de Invitados</span>
                        </Button>
                        <p className="text-xs text-center opacity-70">
                          Fotos compartidas por participantes
                        </p>
                      </div>

                      {/* Compartir mi Foto */}
                      <div className="space-y-1">
                        <Button
                          variant="secondary"
                          className="w-full flex flex-col items-center justify-center gap-2 py-4 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPhotoCamera(true);
                          }}
                        >
                          <Camera className="h-5 w-5" />
                          <span className="text-sm font-medium">Compartir mi Foto</span>
                        </Button>
                        <p className="text-xs text-center opacity-70">
                          Sube tu foto del evento
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-center">
                      Mirá el contenido previo del evento. El contenido completo estará disponible más cerca de la fecha del evento ⏳.
                    </p>
                    <Button
                      variant="secondary"
                      className="w-full flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPhotoWall(true);
                      }}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span>Ver Fotos Previas</span>
                    </Button>
                  </div>
                )}
              </div>
            </StyledDialog>
            <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="primary" className="flex items-center justify-center">
                  <MessageSquare className="mr-2 h-4 w-4" /> Mensajes
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Deja un mensaje</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitMessage} className="grid gap-4 py-4">
                  {isContentActive ? (
                    <>
                      <Input 
                        id="name" 
                        placeholder="Tu nombre" 
                        value={newMessage.nombre}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          nombre: e.target.value
                        }))}
                        required
                      />
                      <Textarea 
                        placeholder="Tu mensaje" 
                        value={newMessage.mensaje}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          mensaje: e.target.value
                        }))}
                        required
                      />
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                      </Button>
                    </>
                  ) : (
                    // DINAMICO:  Frase antes de fecha de activación.
                    <p>Podrás dejar mensajes que se mostrarán en el evento más cerca de la fecha de inicio del mismo.</p>
                  )}
                </form>
              </DialogContent>
            </Dialog>
            {isRsvpActive && (
              <>
                <Dialog open={showExpirationModal} onOpenChange={setShowExpirationModal}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Venta de Tickets Finalizada</DialogTitle>
                    </DialogHeader>
                    <Card className="border-none bg-transparent border-0">
                      <div className="auth-card-content">
                        <p className="auth-card-text">
                          Lo sentimos, el tiempo para comprar tickets ha finalizado.
                        </p>
                        <Button 
                          variant="primary" 
                          className="w-full"
                          onClick={() => setShowExpirationModal(false)}
                        >
                          Entendido
                        </Button>
                      </div>
                    </Card>
                  </DialogContent>
                </Dialog>

                {/* Determinar qué botones mostrar según la configuración */}
                {(() => {
                  // En modo demo, usar el modo del contexto; si no, usar el del theme
                  const buttonMode = isDemoMode ? rsvpMode : theme.rsvpButton.mode;
                  const shouldShowBoth = buttonMode === 'both' && isDemoMode;
                  const shouldShowTickets = buttonMode === 'tickets' || shouldShowBoth;
                  const shouldShowRsvp = buttonMode === 'rsvp' || shouldShowBoth;

                  return (
                    <div className={`col-span-2 space-y-2`}>
                      {/* Botón de Comprar Tickets */}
                      {shouldShowTickets && (
                        <>
                          {theme.tickets.lotes.enabled && isCheckingAvailability ? (
                            <Button
                              variant="primary"
                              className="w-full flex items-center justify-center"
                              disabled
                            >
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Verificando disponibilidad...
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              className="w-full flex items-center justify-center"
                              onClick={handleTicketButtonClick}
                              disabled={theme.tickets.lotes.enabled && Object.values(ticketAvailability).every(
                                remaining => remaining !== -1 && remaining <= 0
                              )}
                            >
                              <Ticket className="mr-2 h-4 w-4" />
                              {theme.tickets.lotes.enabled && Object.values(ticketAvailability).every(
                                remaining => remaining !== -1 && remaining <= 0
                              )
                                ? theme.tickets.lotes.soldOutMessage
                                : 'Comprar Tickets'
                              }
                            </Button>
                          )}
                          
                          {!isCheckingAvailability && 
                           theme.tickets.lotes.enabled && 
                           Object.values(ticketAvailability).every(remaining => remaining !== -1 && remaining <= 0) && 
                           theme.tickets.lotes.nextLotMessage && (
                            <p className="body-small-alt text-center text-opacity-90">
                              {theme.tickets.lotes.nextLotMessage}
                            </p>
                          )}
                        </>
                      )}

                      {/* Botón de Confirmar Asistencia */}
                      {shouldShowRsvp && (
                        <Button
                          variant="primary"
                          className="w-full flex items-center justify-center"
                          onClick={() => setShowRsvpModal(true)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Confirmar Asistencia
                        </Button>
                      )}
                    </div>
                  );
                })()}

                {/* Modal de Tickets */}
                <Dialog 
                  open={showTicketsModal} 
                  onOpenChange={setShowTicketsModal}
                >
                  <DialogContent className={`sm:max-w-[425px] ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
                    <DialogHeader>
                      <DialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Comprar Tickets</DialogTitle>
                    </DialogHeader>
                    <TicketsModal onClose={() => setShowTicketsModal(false)} />
                  </DialogContent>
                </Dialog>

                {/* Modal de Confirmar Asistencia */}
                <Dialog 
                  open={showRsvpModal} 
                  onOpenChange={setShowRsvpModal}
                >
                  <DialogContent className={`sm:max-w-[425px] ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
                    <DialogHeader>
                      <DialogTitle className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Confirmar Asistencia</DialogTitle>
                    </DialogHeader>
                    <RsvpModal onClose={() => setShowRsvpModal(false)} />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedMessage?.nombre && selectedMessage.nombre !== 'Todos los mensajes' && (
                  <InitialsCircle name={selectedMessage.nombre} />
                )}
                {selectedMessage?.nombre || 'Mensaje'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {selectedMessage?.nombre === 'Todos los mensajes' ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {allMessages.map((message) => (
                    <div key={message.id} className={`flex items-start p-2 rounded-lg shadow border rounded-xl mr-2 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex-shrink-0">
                        <InitialsCircle name={message.nombre} />
                      </div>
                      <div className="ml-3 flex-grow">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : ''}`}>{message.nombre}</h3>
                        <p className={`text-sm whitespace-normal break-words ${isDarkMode ? 'text-gray-200' : ''}`}>{message.mensaje}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={isDarkMode ? 'text-white' : ''}>{selectedMessage?.mensaje}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 flex flex-col items-center">
          <a 
            href="https://eventechy.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo-fondo-oscuro.png"  // Asegúrate de tener este archivo en la carpeta public
              alt="Eventechy"
              width={155}
              height={55}
              className="rounded-lg"
            />
          </a>
          <ProvidersModal />
        </div>

        <PhotoCameraModal 
          isOpen={showPhotoCamera} 
          onClose={() => {
            // Primero asegurar que el modal de contenido esté abierto
            setShowContentModal(true);
            // Luego cerrar el modal de cámara
            setShowPhotoCamera(false);
          }} 
        />
        
        <PhotoWall 
          isOpen={showPhotoWall} 
          onClose={() => {
            // Primero asegurar que el modal de contenido esté abierto
            setShowContentModal(true);
            // Luego cerrar el modal de galería
            setShowPhotoWall(false);
          }} 
        />
      </div>
    </>
  )
}