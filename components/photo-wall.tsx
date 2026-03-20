'use client'

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from './ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useDemoDates } from '@/contexts/DemoContext';
import { demoPhotos, PhotoWallPost } from '@/data/demo-photos';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { theme } from '@/config/theme';

interface PhotoWallProps {
  isOpen: boolean;
  onClose: () => void;
  source?: 'guest' | 'official-preview' | 'official-live';
}

type PhotoItem = {
  id: string;
  url: string;
  username: string;
  timestamp: number | string;
  approved?: boolean;
  thumbnailUrl?: string;
  alternativeUrl?: string;
  mimeType?: string;
  isVideo?: boolean;
  webContentLink?: string;
};

export function PhotoWall({ isOpen, onClose, source = 'guest' }: PhotoWallProps) {
  const { isDarkMode, isEventLive, isDemoMode, demoDates } = useDemoDates();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [lightboxImageSrc, setLightboxImageSrc] = useState<string | null>(null);
  const [lightboxTriedSources, setLightboxTriedSources] = useState<string[]>([]);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pulledDistance = useRef<number>(0);
  const [isPulling, setIsPulling] = useState(false);
  const lightboxTitle = source === 'guest' ? 'Contenido de Invitados' : 'Contenido Oficial';

  useEffect(() => {
    if (!isOpen) return;
    setPhotos([]);
    setIsLoading(true);
    setSelectedPhoto(null);
  }, [isOpen, source]);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      let endpoint = '/api/photos';

      if (source === 'official-preview') {
        endpoint = '/api/photos?source=official&phase=preview';
      } else if (source === 'official-live') {
        endpoint = '/api/photos?source=official&phase=live';
      } else {
        // guest
        const contentActivationDate = isDemoMode
          ? new Date(demoDates.contentActivation)
          : new Date(theme.dates.contentActivation);
        const now = new Date();
        const useApproved = isDemoMode
          ? isEventLive
          : (now >= contentActivationDate);
        endpoint = `/api/photos?useApproved=${useApproved}`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      const incoming: PhotoItem[] = (data.photos || []) as PhotoItem[];
      // Normalizar datos por si faltan username/timestamp
      const normalized = incoming.map((p, idx) => ({
        ...p,
        username: p.username || `Invitado ${idx + 1}`,
        timestamp: p.timestamp || Date.now() - idx * 5 * 60 * 1000,
      }));
      setPhotos(normalized);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos(demoPhotos.filter(photo => photo.approved));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
    }
  }, [isOpen, isEventLive, isDemoMode, demoDates.contentActivation, source]);

  // Pull-to-refresh básico
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-photo-item="true"]')) return;
    if (scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      pulledDistance.current = 0;
      setIsPulling(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      pulledDistance.current = delta;
    }
  };

  const onTouchEnd = async () => {
    if (isPulling && pulledDistance.current > 60) {
      await fetchPhotos();
    }
    touchStartY.current = null;
    pulledDistance.current = 0;
    setIsPulling(false);
  };

  const handlePhotoClick = (photo: PhotoItem) => {
    setSelectedPhoto(photo);
    if (!photo.isVideo) {
      const candidates = getImageCandidates(photo);
      setLightboxImageSrc(candidates[0] ?? null);
      setLightboxTriedSources(candidates[0] ? [candidates[0]] : []);
    }
    // Resetear estado del video cuando se selecciona una nueva foto/video
    if (photo.isVideo) {
      setVideoLoading(true);
      setVideoError(null);
      // Para videos, intentar abrir directamente el video en Google Drive en nueva pestaña
      // Esto reduce los clicks a solo 1 (abrir el modal ya muestra el video listo)
    }
  };


  const handleCloseLightbox = () => {
    setSelectedPhoto(null);
    setLightboxImageSrc(null);
    setLightboxTriedSources([]);
    setVideoLoading(false);
    setVideoError(null);
  };

  // Prevenir que el Dialog cierre el modal padre
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
        <DialogPortal>
          <DialogOverlay className="z-40 bg-black/80" />
          <DialogPrimitive.Content
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              onClose();
            }}
            className={cn(
              "fixed left-[50%] top-[50dvh] z-50 grid w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto",
              isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200",
              "p-6 shadow-lg rounded-2xl",
              "duration-200",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
              "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
            )}
          >
          <DialogHeader className="relative flex flex-row items-center justify-center text-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className={`text-lg font-semibold text-center flex items-center justify-center gap-2 ${isDarkMode ? 'text-white' : 'text-[var(--color-primary)]'}`}>
              <Camera className="h-5 w-5" />
              Contenido Wall
            </DialogTitle>
            <DialogPrimitive.Close
              onClick={onClose}
              className={`absolute right-0 top-1/2 -translate-y-1/2 mr-3 rounded-full p-2 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${isDarkMode ? 'text-white hover:bg-gray-800' : 'text-[var(--color-primary)] hover:bg-gray-100'}`}
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M18 6 6 18" />
                <path d="M6 6 18 18" />
              </svg>
            </DialogPrimitive.Close>
          </DialogHeader>

          <div
            ref={scrollRef}
            className="max-h-[75vh] overflow-y-auto"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className={`text-center text-xs py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isPulling ? 'Soltá para actualizar...' : 'Desliza hacia abajo para actualizar'}
            </div>

          {isLoading ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Cargando contenido...
              </p>
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Camera className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Aún no hay contenido
              </p>
              <p className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                El contenido se actualizará pronto. ¡Vuelve más tarde!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="aspect-square relative cursor-pointer overflow-hidden rounded-lg group"
                  onClick={() => handlePhotoClick(photo)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePhotoClick(photo);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  data-photo-item="true"
                  style={{ borderRadius: '0.5rem' }}
                >
                  {(() => {
                    const cleanName = getDisplayName(photo.username);
                    const shortDate = formatDateOnly(photo.timestamp);
                    return (
                      <>
                  {photo.isVideo ? (
                    <>
                      {/* Mostrar thumbnail del video como fondo */}
                      <img
                        src={photo.thumbnailUrl || `/api/photos/thumbnail?id=${photo.id}`}
                        alt={`Video de ${photo.username}`}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '0.5rem' }}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const img = e.currentTarget;
                          console.error('Error loading video thumbnail:', img.src);
                          
                          // Si falla el thumbnail proxy, intentar con el proxy de imagen como fallback
                          if (!img.src.includes('/api/photos/image')) {
                            console.log('Trying image proxy as fallback for video thumbnail');
                            img.src = `/api/photos/image?id=${photo.id}`;
                          } 
                          // Si el proxy también falla, mostrar un placeholder simple sin ícono de play
                          else {
                            console.log('All thumbnail sources failed, showing placeholder');
                            img.style.display = 'none';
                            // Mostrar un placeholder visual simple sin ícono de play
                            if (!img.parentElement?.querySelector('.video-placeholder')) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'video-placeholder absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600';
                              placeholder.style.borderRadius = '0.5rem';
                              img.parentElement?.appendChild(placeholder);
                            }
                          }
                        }}
                      />
                      {/* Video oculto para precargar metadata */}
                      <video
                        src={photo.url}
                        className="hidden"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    </>
                  ) : (
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={`Foto de ${photo.username}`}
                      className="w-full h-full object-cover"
                      style={{ borderRadius: '0.5rem' }}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        console.error('Error loading image (thumb/grid):', photo.thumbnailUrl || photo.url);
                        // Intentar con URL alternativa
                        if (photo.alternativeUrl && e.currentTarget.src !== photo.alternativeUrl) {
                          console.log('Trying alternative URL:', photo.alternativeUrl);
                          e.currentTarget.src = photo.alternativeUrl;
                        } else if (!e.currentTarget.src.includes('/api/photos/image')) {
                          // Fallback final: proxy interno
                          e.currentTarget.src = `/api/photos/image?id=${encodeURIComponent(photo.id)}`;
                        } else {
                          e.currentTarget.style.display = 'none';
                        }
                      }}
                    />
                  )}
                  {photo.isVideo && (
                    <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 pointer-events-none">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                    <div className="absolute bottom-2 left-2 right-2">
                      {cleanName && (
                        <p className="text-white text-xs font-semibold truncate">
                          {cleanName}
                        </p>
                      )}
                      <p className="text-white text-xs opacity-80">{shortDate}</p>
                    </div>
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
          </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Lightbox */}
      {selectedPhoto && (
        <Dialog 
          open={!!selectedPhoto} 
          onOpenChange={(open) => {
            if (!open) {
              handleCloseLightbox();
            }
          }} 
          modal={false}
        >
          <DialogContent 
            portalLayerClassName="fixed inset-0 z-[120]"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              handleCloseLightbox();
            }}
            className={`max-w-2xl ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}
          >
            <DialogHeader>
              <DialogTitle className="text-[var(--color-primary)]">
                {lightboxTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                {selectedPhoto.isVideo ? (
                  <div className="relative w-full overflow-hidden rounded-xl bg-black flex items-center justify-center" style={{ minHeight: '400px' }}>
                    {videoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {videoError && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80 rounded-xl">
                        <div className="text-center text-white p-4">
                          <p className="text-lg font-semibold mb-2">Error al cargar el video</p>
                          <p className="text-sm text-gray-300">{videoError}</p>
                        </div>
                      </div>
                    )}
                    {/* Usar iframe de Google Drive con carga inmediata */}
                    <div 
                      className="w-full rounded-xl overflow-hidden bg-black flex items-center justify-center" 
                      style={{ 
                        minHeight: '400px',
                        maxHeight: '80vh',
                        position: 'relative'
                      }}
                    >
                      <iframe
                        key={selectedPhoto.id}
                        src={`https://drive.google.com/file/d/${selectedPhoto.id}/preview`}
                        className="w-full h-full border-0 rounded-xl"
                        allow="fullscreen; encrypted-media; picture-in-picture; autoplay"
                        allowFullScreen
                        style={{ 
                          width: '100%',
                          height: '100%',
                          minHeight: '400px',
                          aspectRatio: '16/9'
                        }}
                        title={`Video de ${selectedPhoto.username}`}
                        onLoad={() => {
                          console.log('Google Drive iframe loaded');
                          setVideoLoading(false);
                          setVideoError(null);
                        }}
                        onError={() => {
                          console.error('Error loading Google Drive iframe');
                          setVideoError('No se pudo cargar el video desde Google Drive');
                          setVideoLoading(false);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  lightboxImageSrc ? (
                    <img
                      src={lightboxImageSrc}
                      alt={`Foto de ${selectedPhoto.username}`}
                      className="w-full h-auto rounded-xl"
                      onError={() => {
                        const candidates = getImageCandidates(selectedPhoto);
                        const next = candidates.find((src) => !lightboxTriedSources.includes(src));
                        if (next) {
                          setLightboxImageSrc(next);
                          setLightboxTriedSources((prev) => [...prev, next]);
                        } else {
                          setLightboxImageSrc(null);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full min-h-[260px] rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-center p-4">
                      <p className="text-sm opacity-80">
                        No se pudo cargar esta imagen. Probá con otra foto o actualizá la galería.
                      </p>
                    </div>
                  )
                )}
              </div>
              <div className={`text-center ${isDarkMode ? 'text-white' : ''}`}>
                {getDisplayName(selectedPhoto.username) && (
                  <p className="font-semibold">{getDisplayName(selectedPhoto.username)}</p>
                )}
                <p className="text-sm opacity-70">{formatDateOnly(selectedPhoto.timestamp)}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function getImageCandidates(photo: PhotoItem): string[] {
  const proxyUrl = `/api/photos/image?id=${encodeURIComponent(photo.id)}`;
  const candidates = [photo.url, photo.alternativeUrl, photo.thumbnailUrl, proxyUrl].filter(
    (src): src is string => Boolean(src && src.trim())
  );
  return Array.from(new Set(candidates));
}

function getDisplayName(rawName: string): string {
  const normalized = (rawName || '').trim();
  if (!normalized) return '';
  const withoutExtension = normalized.replace(/\.[^/.]+$/, '');
  if (/^img/i.test(withoutExtension)) return '';
  return withoutExtension;
}

function formatDateOnly(value: number | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES');
}
