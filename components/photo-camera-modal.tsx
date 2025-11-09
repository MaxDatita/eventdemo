'use client'

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useDemoDates } from '@/contexts/DemoContext';
import { Camera, Upload, X, Type, Smile, Check } from 'lucide-react';

interface PhotoCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CameraStep = 'camera' | 'edit' | 'preview' | 'uploading' | 'success';

export function PhotoCameraModal({ isOpen, onClose }: PhotoCameraModalProps) {
  const { isDarkMode } = useDemoDates();
  const fileInputRef = useRef<HTMLInputElement>(null); // Input nativo con capture para abrir cámara
  
  const [step, setStep] = useState<CameraStep>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [textOverlay, setTextOverlay] = useState('');
  const [isUploading, setIsUploading] = useState(false);


  // Manejar selección de archivo (fallback para mobile)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Intentar convertir a JPEG para evitar HEIC/HEIF incompatibles
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedImage(jpegDataUrl);
            setStep('edit');
          } else {
            // Fallback: usar el dataUrl original
            setCapturedImage(dataUrl);
            setStep('edit');
          }
        } catch (e) {
          setCapturedImage(dataUrl);
          setStep('edit');
        }
      };
      img.onerror = () => {
        setCapturedImage(dataUrl);
        setStep('edit');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const openCameraPicker = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!capturedImage || !username.trim()) return;

    setIsUploading(true);
    setStep('uploading');

    try {
      // Convertir base64 a blob
      let blob: Blob;
      
      if (capturedImage.startsWith('data:')) {
        // Es un data URL (base64)
        const response = await fetch(capturedImage);
        blob = await response.blob();
      } else {
        // Ya es un blob o URL
        const response = await fetch(capturedImage);
        blob = await response.blob();
      }
      
      // Crear FormData
      const formData = new FormData();
      formData.append('photo', blob, 'photo.jpg');
      formData.append('username', username);

      // Subir foto
      const uploadResponse = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || `Error ${uploadResponse.status}`);
      }

      const result = await uploadResponse.json();

      if (result.success) {
        setStep('success');
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(result.error || 'Error desconocido al subir la foto');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la foto. Inténtalo de nuevo.';
      alert(`Error: ${errorMessage}`);
      setStep('preview');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setStep('camera');
    setCapturedImage(null);
    setUsername('');
    setTextOverlay('');
    setIsUploading(false);
    onClose();
  };


  const renderContent = () => {
    switch (step) {
      case 'camera':
        return (
          <div className="space-y-4">

            {/* Siempre mostrar ícono de cámara */}
            <div className={`text-center py-8 space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <Camera className="h-16 w-16 mx-auto opacity-50" />
            </div>
            
            {/* Advertencia sobre contenido */}
            <div className={`p-3 rounded-2xl text-sm ${isDarkMode ? 'bg-yellow-900/30 border border-yellow-700 text-yellow-200' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
              <p className="font-semibold mb-1">⚠️ Aviso importante:</p>
              <p>Por favor, no subas contenido indebido, ofensivo o que viole los términos de servicio. Las fotos pueden ser moderadas y removidas si no cumplen con las políticas del evento.</p>
            </div>

            {/* Input oculto para abrir SÓLO la cámara nativa */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            
            
            {/* Botón siempre visible para abrir cámara nativa */}
            <Button 
              onClick={openCameraPicker}
              className="w-full rounded-2xl flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white"
            >
              <Camera className="h-4 w-4" />
              <span>Abrir Cámara</span>
            </Button>
          </div>
        );

      case 'edit':
        return (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={capturedImage!} 
                alt="Captured" 
                className="w-full max-w-md mx-auto rounded-lg"
              />
              {textOverlay && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {textOverlay}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>
                  Tu nombre
                </label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
                />
              </div>
              
              <div>
                <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>
                  Agregar texto (opcional)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder="Escribe algo..."
                    className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
                  />
                  <Button variant="secondary" className="rounded-lg">
                    <Type className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" className="rounded-lg">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setStep('camera')}
                className="flex-1 rounded-lg flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <Button 
                onClick={() => setStep('preview')} 
                className="flex-1 rounded-lg flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white"
              >
                <Check className="h-4 w-4" />
                <span>Continuar</span>
              </Button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={capturedImage!} 
                alt="Preview" 
                className="w-full max-w-md mx-auto rounded-lg"
              />
              {textOverlay && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {textOverlay}
                </div>
              )}
            </div>
            
            <div className={`text-center ${isDarkMode ? 'text-white' : ''}`}>
              <p className="font-semibold">@{username}</p>
              <p className="text-sm opacity-70">¿Listo para compartir?</p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setStep('edit')} 
                className="flex-1 rounded-lg flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                <span>Editar</span>
              </Button>
              <Button 
                onClick={handleUpload} 
                className="flex-1 rounded-lg flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white"
              >
                <Upload className="h-4 w-4" />
                <span>Compartir</span>
              </Button>
            </div>
          </div>
        );

      case 'uploading':
        return (
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className={`${isDarkMode ? 'text-white' : ''}`}>Subiendo foto...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-white" />
            </div>
            <p className={`${isDarkMode ? 'text-white' : ''}`}>¡Foto compartida exitosamente!</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Solo cerrar si realmente se está cerrando y estaba abierto
        if (!open && isOpen) {
          handleClose();
        }
      }} 
      modal={false}
    >
      <DialogContent 
        onInteractOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }} 
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`max-w-md ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`}>
            <Camera className="h-5 w-5" />
            {step === 'camera' && 'Tomar Foto'}
            {step === 'edit' && 'Editar Foto'}
            {step === 'preview' && 'Vista Previa'}
            {step === 'uploading' && 'Subiendo...'}
            {step === 'success' && '¡Éxito!'}
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}


