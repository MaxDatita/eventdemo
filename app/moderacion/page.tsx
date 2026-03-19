'use client'

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDemoDates } from '@/contexts/DemoContext';
import { isBackgroundDark } from '@/config/theme';
import { Check, X, Lock, Camera } from 'lucide-react';
import Image from 'next/image';

interface Photo {
  id: string;
  url: string;
  fullUrl?: string;
  thumbnailUrl?: string;
  username: string;
  timestamp: string;
  status?: 'pending' | 'approved' | 'rejected';
}

type TabType = 'pending' | 'approved' | 'rejected';

function ModerationContent() {
  const searchParams = useSearchParams();
  const { isDarkMode, isDemoMode } = useDemoDates();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<Photo[]>([]);
  const [rejectedPhotos, setRejectedPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      fetchPendingPhotos();
      fetchApprovedPhotos();
      fetchRejectedPhotos();
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const fetchPendingPhotos = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`/api/photos/pending?password=${encodeURIComponent(password || 'admin123')}`);
      const result = await response.json();
      
      if (response.ok && result.photos) {
        if (silent) {
          // Modo silencioso: solo agregar fotos que realmente son nuevas
          // Verificar contra las fotos actuales en el estado para evitar duplicados
          setPendingPhotos(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPhotos = result.photos.filter((photo: Photo) => !existingIds.has(photo.id));
            if (newPhotos.length > 0) {
              return [...prev, ...newPhotos];
            }
            return prev; // No hay cambios
          });
        } else {
          // Carga inicial: reemplazar todo
          setPendingPhotos(result.photos);
        }
      } else if (result.error && result.error !== 'Contraseña incorrecta') {
        console.error('Error fetching pending photos:', result.error);
      }
    } catch (error) {
      console.error('Error fetching pending photos:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [isAuthenticated, password]);

  const fetchApprovedPhotos = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`/api/photos/all?password=${encodeURIComponent(password || 'admin123')}`);
      const result = await response.json();
      
      if (response.ok && result.photos) {
        setApprovedPhotos(result.photos);
      }
    } catch (error) {
      console.error('Error fetching approved photos:', error);
    }
  }, [isAuthenticated, password]);

  const fetchRejectedPhotos = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`/api/photos/rejected?password=${encodeURIComponent(password || 'admin123')}`);
      const result = await response.json();
      
      if (response.ok && result.photos) {
        setRejectedPhotos(result.photos);
      }
    } catch (error) {
      console.error('Error fetching rejected photos:', error);
    }
  }, [isAuthenticated, password]);

  // Auto-autenticar si viene la contraseña en query params (modo demo)
  useEffect(() => {
    const demoParam = searchParams.get('demo');
    const passwordParam = searchParams.get('password');
    
    if (demoParam === 'true' && passwordParam === 'admin123' && !isAuthenticated) {
      setPassword(passwordParam);
      setIsAuthenticated(true);
      // Ejecutar las funciones fetch después de autenticar
      setTimeout(() => {
        fetchPendingPhotos();
        fetchApprovedPhotos();
        fetchRejectedPhotos();
      }, 100);
    }
  }, [searchParams, isAuthenticated, fetchPendingPhotos, fetchApprovedPhotos, fetchRejectedPhotos]);

  // Auto-refresh cada 10 segundos cuando está autenticado
  // ⚙️ CONFIGURACIÓN: Cambia el valor 10000 (milisegundos) para ajustar el intervalo de actualización
  // Ejemplos: 5000 = 5 segundos, 30000 = 30 segundos, 60000 = 1 minuto
  const REFRESH_INTERVAL_MS = 60000; // 10 segundos por defecto
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchPendingPhotos(false);
    fetchApprovedPhotos();
    fetchRejectedPhotos();
    
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchPendingPhotos(true); // Modo silencioso
      fetchApprovedPhotos();
      fetchRejectedPhotos();
      setTimeout(() => setIsRefreshing(false), 2000);
    }, REFRESH_INTERVAL_MS);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Solo depende de isAuthenticated, las funciones se recrean pero no importa

  const handleModeration = async (photoId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/photos/moderate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoId,
          action,
          password: 'admin123'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Actualizar listas según la acción
        if (action === 'approve') {
          // Remover de pendientes
          setPendingPhotos(prev => prev.filter(photo => photo.id !== photoId));
          
          // Agregar a aprobadas y refrescar para sincronizar
          fetchApprovedPhotos();
        } else if (action === 'reject') {
          // Remover de pendientes o aprobadas según el tab activo
          if (activeTab === 'pending') {
            setPendingPhotos(prev => prev.filter(photo => photo.id !== photoId));
          } else if (activeTab === 'approved') {
            setApprovedPhotos(prev => prev.filter(photo => photo.id !== photoId));
          } 
          
          // Recargar rechazadas
          fetchRejectedPhotos();
        }
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error moderating photo:', error);
      alert('Error al moderar la foto');
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const handleRestorePhoto = async (photo: Photo) => {
    // Restaurar foto rechazada: moverla de rechazadas a aprobadas
    try {
      const response = await fetch('/api/photos/moderate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoId: photo.id,
          action: 'approve',
          password: 'admin123'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Actualizar listas locales
        setRejectedPhotos(prev => prev.filter(p => p.id !== photo.id));
        // Refrescar para asegurar sincronización
        fetchApprovedPhotos();
        fetchRejectedPhotos();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error restoring photo:', error);
      alert('Error al restaurar la foto');
    }
  };

  const renderPhotoCard = (photo: Photo, isApproved: boolean = false, isRejected: boolean = false) => (
    <Card 
      key={photo.id} 
      className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-2`}
    >
      <div className="flex gap-6 items-center">
        <div 
          className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePhotoClick(photo)}
        >
          <Image
            src={photo.url}
            alt={`Foto de ${photo.username}`}
            width={96}
            height={96}
            className="rounded-xl object-cover w-24 h-24 border-2 border-gray-300"
            onError={(e) => {
              // Fallback si la imagen no carga
              const target = e.target as HTMLImageElement;
              target.src = photo.thumbnailUrl || photo.url;
            }}
          />
        </div>
        <div className="flex-1 space-y-1">
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {photo.username}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {new Date(photo.timestamp).toLocaleString('es-ES')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {isRejected ? (
              <Button
                onClick={() => handleRestorePhoto(photo)}
                className="bg-[#FF914E] hover:bg-[#ff8132] text-white flex items-center gap-2 px-5 py-2 rounded-full"
              >
                <Check className="h-4 w-4" />
                <span>Restaurar</span>
              </Button>
            ) : isApproved ? (
              <Button
                onClick={() => handleModeration(photo.id, 'reject')}
                variant="secondary"
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-5 py-2 rounded-full"
              >
                <X className="h-4 w-4" />
                <span>Rechazar</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleModeration(photo.id, 'approve')}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-5 py-2 rounded-full"
                >
                  <Check className="h-4 w-4" />
                  <span>Aprobar</span>
                </Button>
                <Button
                  onClick={() => handleModeration(photo.id, 'reject')}
                  variant="secondary"
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-5 py-2 rounded-full"
                >
                  <X className="h-4 w-4" />
                  <span>Rechazar</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (!isAuthenticated) {
    return (
      <>
        <div className="bg-gradient-animation" />
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-3">
          <div className="demo-badge-center-bottom relative rounded-full w-auto px-4">
            <span className="text-xs font-bold text-white">MODO DEMO</span>
          </div>
        </div>
        <div className="fixed bottom-3 left-0 right-0 flex justify-center z-50">
          <a 
            href="https://eventechy.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src={isBackgroundDark() ? '/logo-fondo-oscuro.png' : '/logo-fondo-claro.png'}
              alt="Eventechy"
              width={155}
              height={55}
              className="rounded-lg"
            />
          </a>
        </div>
        <div className="content-container flex items-center justify-center">
          <Card className="w-full max-w-md rounded-xl border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] shadow-lg bg-white p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#FF914E] rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 font-secondary">Panel de Moderación</h1>
              <p className="text-gray-700">Ingresa la contraseña para acceder <br/><span className="text-sm text-gray-500">(admin123)</span></p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button
                onClick={handleLogin}
                className="w-full bg-[#FFCF6E] hover:bg-[#FFCF6E]/90 text-gray-800 border-2 border-gray-700"
              >
                Acceder
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const currentPhotos = activeTab === 'pending' 
    ? pendingPhotos 
    : activeTab === 'approved' 
    ? approvedPhotos 
    : rejectedPhotos;

  return (
    <>
      <div className="bg-gradient-animation" />
      <div className="fixed left-0 right-0 top-0 z-10">
        <div className="demo-badge-center-bottom"><span className="text-xs font-bold">MODO DEMO</span></div>
      </div>
      <div className="content-container pt-10">
        {/* Sección con texto: fondo blanco y colores de la marca (#FFCF6E, #FF914E) */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-2 border-[#FF914E] border-t-4 border-t-[#FFCF6E]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-center font-secondary text-gray-900">
              Panel de Moderación
            </h1>
            <Button 
              variant="secondary" 
              onClick={() => setIsAuthenticated(false)}
              className="border-2 border-gray-700 text-gray-800 bg-[#FFCF6E] hover:bg-[#FFCF6E]/90 transition-colors"
            >
              Cerrar Sesión
            </Button>
          </div>

          {/* Tabs - activo con color de marca */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === 'pending'
                  ? 'text-[#FF914E] border-b-2 border-[#FF914E]'
                  : 'text-gray-600 hover:text-[#FF914E]/80'
              }`}
            >
              Pendientes ({pendingPhotos.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === 'approved'
                  ? 'text-[#FF914E] border-b-2 border-[#FF914E]'
                  : 'text-gray-600 hover:text-[#FF914E]/80'
              }`}
            >
              Aprobadas ({approvedPhotos.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === 'rejected'
                  ? 'text-[#FF914E] border-b-2 border-[#FF914E]'
                  : 'text-gray-600 hover:text-[#FF914E]/80'
              }`}
            >
              Rechazadas ({rejectedPhotos.length})
            </button>
          </div>
        </div>

        {/* Contenido - fondo transparente, las cards ya tienen su propio fondo */}
        {isLoading && currentPhotos.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${isDarkMode ? 'border-blue-500' : 'border-blue-600'}`}></div>
            <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Cargando fotos...</p>
          </div>
        ) : currentPhotos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`} />
            <p className={`text-lg ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`}>
              {activeTab === 'pending' 
                ? 'No hay fotos pendientes de moderación'
                : 'No hay fotos aprobadas'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6">
              {currentPhotos.map((photo) => renderPhotoCard(photo, activeTab === 'approved', activeTab === 'rejected'))}
            </div>
            
            {/* Indicador de actualización */}
            {isRefreshing && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#FFCF6E] text-black border-2 border-black px-4 py-2 rounded-full flex items-center gap-2 z-50 shadow-lg">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold">Actualizando...</span>
              </div>
            )}
          </>
        )}

      </div>

      {/* Logo según colores predominantes del fondo (no dark mode), anclado abajo */}
      <div className="fixed bottom-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <a
          href="https://eventechy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto hover:opacity-80 transition-opacity"
        >
          <Image
            src={isBackgroundDark() ? '/logo-fondo-oscuro.png' : '/logo-fondo-claro.png'}
            alt="Eventechy"
            width={155}
            height={55}
            className="rounded-lg"
          />
        </a>
      </div>

      {/* Modal para ver foto grande */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent
          className="max-w-4xl w-[95vw] max-h-[90vh] p-0 bg-transparent border-none"
          closeButtonClassName="!text-white top-2 right-4"
          closeButtonIconClassName="h-6 w-6"
        >
          {selectedPhoto && (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={selectedPhoto.fullUrl || selectedPhoto.url}
                alt={`Foto de ${selectedPhoto.username}`}
                width={1200}
                height={1200}
                className="rounded-xl max-w-full max-h-[90vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = selectedPhoto.thumbnailUrl || selectedPhoto.url;
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ModerationPage() {
  return (
    <Suspense fallback={
      <div className="content-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Cargando moderación...</p>
        </div>
      </div>
    }>
      <ModerationContent />
    </Suspense>
  );
}
