'use client'

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useDemoDates } from '@/contexts/DemoContext';
import { Camera, Upload, X, Check, RotateCcw } from 'lucide-react';

interface PhotoCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CameraStep = 'camera' | 'preview' | 'details' | 'uploading' | 'success';

export function PhotoCameraModal({ isOpen, onClose }: PhotoCameraModalProps) {
  const { isDarkMode } = useDemoDates();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<CameraStep>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [textOverlay, setTextOverlay] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardViewport, setKeyboardViewport] = useState({
    height: 0,
    offsetTop: 0,
    isOpen: false,
  });
  const isDetailsStep = step === 'details';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
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
            setStep('preview');
          } else {
            setCapturedImage(dataUrl);
            setStep('preview');
          }
        } catch {
          setCapturedImage(dataUrl);
          setStep('preview');
        }
      };
      img.onerror = () => {
        setCapturedImage(dataUrl);
        setStep('preview');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const openCameraPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    openCameraPicker();
  };

  const handleUpload = async () => {
    if (!capturedImage || !username.trim()) return;

    setIsUploading(true);
    setStep('uploading');

    try {
      let blob: Blob;
      
      if (capturedImage.startsWith('data:')) {
        const response = await fetch(capturedImage);
        blob = await response.blob();
      } else {
        const response = await fetch(capturedImage);
        blob = await response.blob();
      }
      
      const formData = new FormData();
      formData.append('photo', blob, 'photo.jpg');
      formData.append('username', username);

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
      setStep('details');
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

  useEffect(() => {
    if (!isOpen) return;

    const container = dialogContentRef.current;
    if (!container) return;

    const onFocusIn = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isTextField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (!isTextField) return;

      setTimeout(() => {
        const findScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
          let parent = node?.parentElement ?? null;
          while (parent) {
            const styles = window.getComputedStyle(parent);
            if (/(auto|scroll)/.test(styles.overflowY)) return parent;
            parent = parent.parentElement;
          }
          return null;
        };

        const scrollParent = findScrollableParent(target);
        if (scrollParent) {
          const targetTop =
            target.getBoundingClientRect().top -
            scrollParent.getBoundingClientRect().top +
            scrollParent.scrollTop -
            20;
          scrollParent.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
          return;
        }

        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    };

    container.addEventListener('focusin', onFocusIn);
    return () => container.removeEventListener('focusin', onFocusIn);
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen || !isDetailsStep || typeof window === 'undefined' || !window.visualViewport) {
      setKeyboardViewport({ height: 0, offsetTop: 0, isOpen: false });
      return;
    }

    const viewport = window.visualViewport;

    const updateKeyboardState = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
      setKeyboardViewport({
        height: viewport.height,
        offsetTop: viewport.offsetTop,
        isOpen: keyboardHeight > 80,
      });
    };

    updateKeyboardState();
    viewport.addEventListener('resize', updateKeyboardState);
    viewport.addEventListener('scroll', updateKeyboardState);

    return () => {
      viewport.removeEventListener('resize', updateKeyboardState);
      viewport.removeEventListener('scroll', updateKeyboardState);
      setKeyboardViewport({ height: 0, offsetTop: 0, isOpen: false });
    };
  }, [isOpen, isDetailsStep]);

  const keyboardAwareStyle =
    isDetailsStep && keyboardViewport.isOpen
      ? {
          top: `${Math.max(8, keyboardViewport.offsetTop + 8)}px`,
          transform: 'translateX(-50%)',
          maxHeight: `${Math.max(280, keyboardViewport.height - 16)}px`,
          height: `${Math.max(280, keyboardViewport.height - 16)}px`,
        }
      : undefined;

  const renderContent = () => {
    switch (step) {
      case 'camera':
        return (
          <div className="space-y-4">
            <div className={`text-center py-8 space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <Camera className="h-16 w-16 mx-auto opacity-50" />
            </div>
            
            <div className={`p-3 rounded-2xl text-sm ${isDarkMode ? 'bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/50 text-green-200' : 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)]'}`}>
              <p className="font-semibold mb-1">⚠️ Aviso importante:</p>
              <p>Por favor, no subas contenido indebido, ofensivo o que viole los términos de servicio. Las fotos pueden ser moderadas y removidas si no cumplen con las políticas del evento.</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button 
              variant="invitation"
              onClick={openCameraPicker}
              className="w-full rounded-2xl flex items-center justify-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>Abrir Cámara</span>
            </Button>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={capturedImage!} 
                alt="Preview" 
                className="w-full max-w-md mx-auto rounded-2xl overflow-hidden"
              />
            </div>
            
            <p className={`text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              ¿Te gusta cómo quedó la foto?
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button 
                className={`flex-1 rounded-2xl flex items-center justify-center gap-2 ${isDarkMode ? 'bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-white border border-[var(--color-primary)]/40' : 'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/40'}`}
                onClick={handleRetake}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Volver a sacar</span>
              </Button>
              <Button 
                variant="invitation"
                onClick={() => setStep('details')} 
                className="flex-1 rounded-2xl flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Continuar</span>
              </Button>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="dialog-scroll-content space-y-4 pb-2">
            <div className="flex items-center gap-3">
              <img 
                src={capturedImage!} 
                alt="Thumbnail" 
                className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
              />
              <div className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="text-sm">Completa los datos para compartir tu foto</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>
                  Tu nombre *
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
                <Input
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Escribe algo..."
                  className={isDarkMode ? 'bg-gray-800 text-white border-gray-600' : ''}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className={`flex-1 rounded-2xl flex items-center justify-center gap-2 ${isDarkMode ? 'bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-white border border-[var(--color-primary)]/40' : 'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/40'}`}
                onClick={() => setStep('preview')}
              >
                <X className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <Button 
                variant="invitation"
                onClick={handleUpload}
                disabled={!username.trim()}
                className="flex-1 rounded-2xl flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span>Compartir</span>
              </Button>
            </div>
          </div>
        );

      case 'uploading':
        return (
          <div className="text-center space-y-4 py-8">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className={`${isDarkMode ? 'text-white' : ''}`}>Subiendo foto...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto">
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
        if (!open && isOpen) {
          handleClose();
        }
      }} 
      modal={true}
    >
      <DialogContent 
        ref={dialogContentRef}
        portalLayerClassName="z-[100]"
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
        style={keyboardAwareStyle}
        className={`max-w-md max-h-[90dvh] ${step === 'details' ? 'keyboard-aware' : ''} ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}
      >
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : ''}`}>
            <Camera className="h-5 w-5" />
            {step === 'camera' && 'Tomar Foto'}
            {step === 'preview' && 'Vista Previa'}
            {step === 'details' && 'Completar Datos'}
            {step === 'uploading' && 'Subiendo...'}
            {step === 'success' && '¡Éxito!'}
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
