'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { theme } from '@/config/theme'
import { isBackgroundDark } from '@/config/theme'
import { Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GradientText from '@/components/GradientText'

interface Photo {
  id: string
  url: string
  thumbnailUrl?: string
  fullUrl?: string
  username: string
  timestamp: string
  approved?: boolean
  isPlaceholder?: boolean
}

// ⚙️ CONFIGURACIÓN - Edita estos valores fácilmente
const CONFIG = {
  // Duración que se muestra cada imagen (en milisegundos)
  IMAGE_DURATION: 4000, // 4 segundos por defecto
  
  // Habilitar/deshabilitar el mensaje entre imágenes
  SHOW_MESSAGE: true,
  
  // Duración del mensaje (en milisegundos)
  MESSAGE_DURATION: 5000, // 5 segundos por defecto
  
  // Mensaje a mostrar entre imágenes
  MESSAGE_TEXT: '📸 Subí tu foto desde la app del evento para compartirla con todos!',
  
  // Cantidad de imágenes a mostrar simultáneamente
  IMAGES_PER_BATCH: 3,
  
  // Texto del placeholder cuando no hay suficientes fotos
  PLACEHOLDER_TEXT: 'Aquí va tu foto, ¡anímate!',
}

export default function ProyeccionPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentBatch, setCurrentBatch] = useState<Photo[]>([])
  const [nextBatch, setNextBatch] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMessage, setShowMessage] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [batchKey, setBatchKey] = useState(0) // Key para forzar reinicio de animación
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Detección de fondo para alternar versión clara/oscura de UI (como en moderación)
  const isDark = isBackgroundDark()

  // Función para obtener fotos aprobadas
  const fetchPhotos = useCallback(async () => {
    try {
      const response = await fetch('/api/photos?useApproved=true')
      const result = await response.json()
      
      if (result.photos && Array.isArray(result.photos)) {
        setPhotos(result.photos)
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Función para precargar imágenes
  const preloadImages = useCallback((batch: Photo[]) => {
    batch.forEach((photo) => {
      if (!photo.isPlaceholder && !loadedImages.has(photo.id)) {
        const img = new window.Image()
        img.src = photo.url
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(photo.id))
        }
      }
    })
  }, [loadedImages])

  // Función para seleccionar un batch aleatorio de fotos
  const selectRandomBatch = useCallback((setAsCurrent = true) => {
    // Si no hay fotos, crear batch solo con placeholders
    if (photos.length === 0) {
      const batch: Photo[] = Array.from({ length: CONFIG.IMAGES_PER_BATCH }, (_, index) => ({
        id: `placeholder-${index}`,
        url: '',
        username: '',
        timestamp: '',
        isPlaceholder: true
      }))
      if (setAsCurrent) {
        setCurrentBatch(batch)
      }
      return batch
    }

    // Crear una copia del array y mezclarlo aleatoriamente
    const shuffled = [...photos].sort(() => Math.random() - 0.5)
    
    // Seleccionar las primeras N fotos (donde N = IMAGES_PER_BATCH)
    const selectedPhotos = shuffled.slice(0, Math.min(CONFIG.IMAGES_PER_BATCH, photos.length))
    
    // Completar con placeholders si no hay suficientes fotos
    const batch: Photo[] = Array.from({ length: CONFIG.IMAGES_PER_BATCH }, (_, index) => 
      selectedPhotos[index] || {
        id: `placeholder-${index}`,
        url: '',
        username: '',
        timestamp: '',
        isPlaceholder: true
      }
    )
    
    if (setAsCurrent) {
      setCurrentBatch(batch)
      setBatchKey((prev) => prev + 1) // Incrementar key para reiniciar animación
    }
    
    // Precargar imágenes del batch
    preloadImages(batch)
    
    return batch
  }, [photos, preloadImages])

  // Función para seleccionar el siguiente batch (ya precargado)
  const advanceToNextBatch = useCallback(() => {
    setIsTransitioning(true)
    
    // Esperar a que termine la transición de salida antes de cambiar
    setTimeout(() => {
      // Si terminamos el batch, mostrar mensaje si está habilitado
      if (CONFIG.SHOW_MESSAGE) {
        setShowMessage(true)
        setIsTransitioning(false)
        setTimeout(() => {
          setShowMessage(false)
          // Después del mensaje, usar el batch ya precargado
          setIsTransitioning(true)
          if (nextBatch.length > 0) {
            setCurrentBatch(nextBatch)
            setNextBatch([])
            setBatchKey((prev) => prev + 1) // Reiniciar animación
          } else {
            selectRandomBatch()
          }
          setTimeout(() => {
            setIsTransitioning(false)
          }, 50)
        }, CONFIG.MESSAGE_DURATION)
      } else {
        // Si no hay mensaje, usar el batch ya precargado
        if (nextBatch.length > 0) {
          setCurrentBatch(nextBatch)
          setNextBatch([])
          setBatchKey((prev) => prev + 1) // Reiniciar animación
        } else {
          selectRandomBatch()
        }
        // Pequeño delay antes de mostrar las nuevas imágenes
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50)
      }
    }, 500) // Duración de la transición de salida
  }, [nextBatch, selectRandomBatch])

  // Efecto para cargar fotos al montar
  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  // Efecto para seleccionar batch inicial
  useEffect(() => {
    if (currentBatch.length === 0 && !showMessage && !isLoading) {
      selectRandomBatch()
      setIsTransitioning(false)
    }
  }, [photos, currentBatch.length, showMessage, selectRandomBatch, isLoading])

  // Efecto para precargar el siguiente batch
  useEffect(() => {
    if (currentBatch.length === 0 || showMessage || photos.length === 0) return

    // Precargar el siguiente batch con antelación (antes de que termine el tiempo actual)
    const preloadTimer = setTimeout(() => {
      const next = selectRandomBatch(false)
      setNextBatch(next)
      preloadImages(next)
    }, CONFIG.IMAGE_DURATION - 1000) // Precargar 1 segundo antes

    return () => clearTimeout(preloadTimer)
  }, [currentBatch, showMessage, photos.length, selectRandomBatch, preloadImages])

  // Efecto para el ciclo de batches
  useEffect(() => {
    if (currentBatch.length === 0 || showMessage) return

    const timer = setTimeout(() => {
      advanceToNextBatch()
    }, CONFIG.IMAGE_DURATION)

    return () => clearTimeout(timer)
  }, [currentBatch.length, showMessage, advanceToNextBatch])

  // Efecto para refrescar fotos periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPhotos()
    }, 30000) // Refrescar cada 30 segundos

    return () => clearInterval(interval)
  }, [fetchPhotos])

  // Tipos para APIs de fullscreen de diferentes navegadores
  interface ElementWithFullscreen extends HTMLElement {
    webkitRequestFullscreen?: () => void;
    mozRequestFullScreen?: () => void;
    msRequestFullscreen?: () => void;
  }

  interface DocumentWithFullscreen extends Document {
    webkitExitFullscreen?: () => void;
    mozCancelFullScreen?: () => void;
    msExitFullscreen?: () => void;
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  }

  // Función para entrar en pantalla completa
  const enterFullscreen = useCallback(() => {
    const element = document.documentElement as ElementWithFullscreen
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }
  }, [])

  // Función para salir de pantalla completa
  const exitFullscreen = useCallback(() => {
    const doc = document as DocumentWithFullscreen
    if (doc.exitFullscreen) {
      doc.exitFullscreen()
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen()
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen()
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen()
    }
  }, [])

  // Manejar cambios en el estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as DocumentWithFullscreen
      const isCurrentlyFullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // Función para toggle de pantalla completa
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  if (isLoading) {
    return (
      <>
        <div className="bg-gradient-animation" />
        <div className="content-container flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-xl">Cargando fotos...</p>
          </div>
        </div>
      </>
    )
  }


  return (
    <>
      <div className="bg-gradient-animation" />
      <div className="content-container h-screen min-h-0 flex flex-col p-8 relative overflow-hidden">
        {/* Badge MODO DEMO - Arriba, todo el ancho */}
        <div className="flex-shrink-0 w-full">
          <div className="demo-badge-center-bottom relative w-full">
            <span className="text-xs font-bold">MODO DEMO</span>
          </div>
        </div>

        {/* Botón de pantalla completa - Esquina superior derecha */}
        <Button
          onClick={toggleFullscreen}
          className={`fixed top-4 right-4 z-50 backdrop-blur-lg rounded-full p-3 shadow-lg transition-colors font-medium ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
              : 'bg-black/10 hover:bg-black/20 border border-black/20 text-gray-900'
          }`}
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>

        {/* Título del evento - Texto en gradiente animado (como invitación digital) */}
        <div className="title-image-container mb-8 flex-shrink-0">
          <GradientText
            colors={theme.resources.heroGradientText?.colors || ['#04724d', '#34d399', '#588157']}
            animationSpeed={theme.resources.heroGradientText?.animationSpeed ?? 8}
            showBorder={false}
            className="!cursor-default select-none text-center text-2xl md:text-4xl font-secondary leading-tight px-4"
          >
            {theme.resources.heroGradientText?.afterCountdownEnds || 'Gracias por acompañarnos'}
          </GradientText>
        </div>

        {/* Contenedor principal - CONTENIDO SCROLLEABLE */}
        <div className="w-full max-w-6xl mx-auto flex-1 flex items-center justify-center">
          {showMessage ? (
            // Mensaje entre imágenes con animación
            <div className="flex items-center justify-center w-full">
              <div
                className={`backdrop-blur-lg rounded-2xl p-8 md:p-12 border-2 shadow-2xl message-animation ${
                  isDark
                    ? 'bg-white/10 border-white/20'
                    : 'bg-black/10 border-black/20'
                }`}
              >
                <p
                  className={`text-2xl md:text-4xl font-bold text-center font-secondary ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {CONFIG.MESSAGE_TEXT}
                </p>
              </div>
            </div>
          ) : currentBatch.length > 0 ? (
            // Grid de 3 imágenes con efecto flotante - Aspecto 9:16
            <div 
              key={batchKey}
              className={`grid grid-cols-1 md:grid-cols-3 gap-6 w-full transition-opacity duration-500 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {currentBatch.map((photo, index) => (
                photo.isPlaceholder ? (
                  // Placeholder para espacios vacíos
                  <div
                    key={photo.id}
                    className={`relative aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl photo-float backdrop-blur-sm border-2 flex items-center justify-center photo-appear ${
                      isDark
                        ? 'bg-white/10 border-white/30'
                        : 'bg-black/10 border-black/30'
                    }`}
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <p
                      className={`text-lg md:text-xl font-semibold text-center font-secondary px-4 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {CONFIG.PLACEHOLDER_TEXT}
                    </p>
                  </div>
                ) : (
                  <div 
                    key={photo.id}
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl photo-float photo-appear"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <Image
                      src={photo.url}
                      alt={`Foto de ${photo.username}`}
                      fill
                      className="object-cover"
                      priority={false}
                      quality={95}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized={false}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (photo.thumbnailUrl) {
                          target.src = photo.thumbnailUrl
                        } else if (photo.fullUrl) {
                          target.src = photo.fullUrl
                        }
                      }}
                      onLoad={() => {
                        setLoadedImages((prev) => new Set(prev).add(photo.id))
                      }}
                    />
                  </div>
                )
              ))}
            </div>
          ) : null}
        </div>

        {/* Logo Eventechy - anclado abajo dentro del alto fijo (suma al layout, no se superpone) */}
        <div className="flex-shrink-0 flex justify-center pt-4 pb-2">
          <a
            href="https://eventechy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src={isDark ? '/logo-fondo-oscuro.png' : '/logo-fondo-claro.png'}
              alt="Eventechy"
              width={155}
              height={55}
              className="rounded-lg"
            />
          </a>
        </div>
      </div>

    </>
  )
}

