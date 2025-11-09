'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDemoDates } from '@/contexts/DemoContext';
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

export default function ModerationPage() {
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
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-5 py-2 rounded-full"
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
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-3">
          <div className="demo-badge-center-bottom relative">
            <span className="text-xs font-bold">MODO DEMO</span>
          </div>
          <a 
            href="https://eventechy.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo-fondo-oscuro.png"
              alt="Eventechy"
              width={155}
              height={55}
              className="rounded-lg"
            />
          </a>
        </div>
        <div className="content-container flex items-center justify-center">
          <Card className="auth-card rounded-xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h1 className="heading-h1-alt">Panel de Moderación</h1>
              <p className="auth-card-text">Ingresa la contraseña para acceder <br/><span className="text-ls text-gray-500">(admin123)</span></p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button onClick={handleLogin} className="w-full">
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
      <div className="demo-badge-center-bottom"><span className="text-xs font-bold">MODO DEMO</span></div>
      <div className="content-container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="heading-h2">Panel de Moderación</h1>
          <Button 
            variant="secondary" 
            onClick={() => setIsAuthenticated(false)}
            className={`border ${isDarkMode ? 'border-gray-600 text-white' : 'border-white/60 text-white'} bg-transparent hover:bg-white/10`}
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/20">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Pendientes ({pendingPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'approved'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Aprobadas ({approvedPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'rejected'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Rechazadas ({rejectedPhotos.length})
          </button>
        </div>

        {/* Contenido */}
        {isLoading && currentPhotos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Cargando fotos...</p>
          </div>
        ) : currentPhotos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 mx-auto mb-4 text-white/70" />
            <p className="text-lg text-white/90">
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
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-full flex items-center gap-2 z-50 shadow-lg">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold">Actualizando...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para ver foto grande */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 bg-transparent border-none">
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
