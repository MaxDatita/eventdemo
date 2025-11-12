'use client';

import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from 'next/image';
import { theme } from '@/config/theme';

interface ScanResult {
  success: boolean;
  message: string;
  details?: {
    Ticket?: string;
    Titular?: string;
    ID?: number;
    // Para modo RSVP
    nombre?: string;
    acompanantes?: number;
    mesa?: string;
  }
}

// Datos de ejemplo para simulación en modo RSVP
const rsvpExamples = [
  { nombre: 'María González', acompanantes: 2, mesa: 'Mesa 5' },
  { nombre: 'Juan Pérez', acompanantes: 1, mesa: 'Mesa 12' },
  { nombre: 'Ana Martínez', acompanantes: 0, mesa: 'Mesa 8' },
  { nombre: 'Carlos Rodríguez', acompanantes: 3, mesa: 'Mesa 3' },
  { nombre: 'Laura Fernández', acompanantes: 1, mesa: 'Mesa 15' },
  { nombre: 'Diego Sánchez', acompanantes: 4, mesa: 'Mesa 7' },
  { nombre: 'Sofía López', acompanantes: 0, mesa: 'Mesa 20' },
  { nombre: 'Pedro Torres', acompanantes: 2, mesa: 'Mesa 11' },
];

// Contador para alternar entre tickets aprobados y no aprobados en modo tickets
let ticketValidationCounter = 0;

const QRScanner = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el buscador de nombres (modo RSVP)
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGuests, setFilteredGuests] = useState<typeof rsvpExamples>([]);

  const requestCameraPermission = async () => {
    try {
      // Primero intentamos con la cámara trasera
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      try {
        // Solo verificamos que podemos acceder a la cámara
        await navigator.mediaDevices.getUserMedia(constraints);
        // No detenemos el stream aquí, lo dejamos activo
        setHasPermission(true);
        setIsScanning(true);
      } catch {
        await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
        setHasPermission(true);
        setIsScanning(true);
      }
    } catch (error) {
      setHasPermission(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setError('Acceso a la cámara denegado. Por favor, permite el acceso cuando el navegador lo solicite.');
        } else if (error.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara. Asegúrate de que tu dispositivo tiene una cámara disponible.');
        } else {
          setError(`Error al acceder a la cámara: ${error.message}`);
        }
      } else {
        setError('Error desconocido al acceder a la cámara');
      }
    }
  };

  useEffect(() => {
    if (!hasPermission || !isScanning) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          // Éxito en el escaneo
          html5QrCode.pause();
          await validateQRCode(decodedText);
        },
        (errorMessage) => {
          // Solo logueamos errores críticos
          if (!errorMessage.includes('NotFound')) {
            console.warn(errorMessage);
          }
        }
      ).catch((err) => {
        console.error("Error al iniciar el scanner:", err);
        setError("No se pudo iniciar el scanner de QR");
      });

    } catch (error) {
      console.error("Error al crear el scanner:", error);
      setError("Error al inicializar el scanner");
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [hasPermission, isScanning]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateQRCode = async (qrCode: string) => {
    setIsLoading(true);
    
    // Simulamos un pequeño delay para que parezca real
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // MODO TICKETS: Alternar entre tickets aprobados y no aprobados
    // (Esta función solo se usa en modo tickets, el modo RSVP usa el buscador)
    // Nota: qrCode no se usa en la simulación, pero es necesario para la firma de la función
    ticketValidationCounter++;
    const isApproved = ticketValidationCounter % 2 === 1; // Alterna entre true y false
    
    if (isApproved) {
      setScanResult({
        success: true,
        message: 'Ticket válido y aprobado',
        details: {
          ID: Math.floor(Math.random() * 10000) + 1000,
          Titular: `Invitado ${ticketValidationCounter}`,
          Ticket: `VIP-${Math.floor(Math.random() * 1000)}`,
        }
      });
    } else {
      setScanResult({
        success: false,
        message: 'Ticket no válido o no aprobado',
        details: {
          ID: Math.floor(Math.random() * 10000) + 1000,
          Titular: `Invitado ${ticketValidationCounter}`,
          Ticket: `REG-${Math.floor(Math.random() * 1000)}`,
        }
      });
    }
    
    setIsScanning(false);
    setIsLoading(false);
    
    /* 
     * FUNCIONALIDAD ORIGINAL COMENTADA:
     * 
     * La validación original hacía una llamada a un Google Apps Script
     * para verificar el código QR en tiempo real contra una base de datos.
     * 
     * try {
     *   const response = await fetch(
     *     `https://script.google.com/macros/s/AKfycbwZMaaig2z4YUimzQweMhLIKSeco-ZcaSeKYVIu8qvZcCZfdIHJPGY-9b-i8K4JyggG/exec?code=${encodeURIComponent(qrCode)}`
     *   );
     *   const data: ScanResult = await response.json();
     *   setScanResult(data);
     *   setIsScanning(false);
     * } catch {
     *   setScanResult({
     *     success: false,
     *     message: "Error al validar el código QR"
     *   });
     * } finally {
     *   setIsLoading(false);
     * }
     */
  };

  // Filtrar invitados según la búsqueda (modo RSVP)
  useEffect(() => {
    if (theme.rsvpButton.mode === 'rsvp' && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const filtered = rsvpExamples.filter(guest => 
        guest.nombre.toLowerCase().includes(query)
      );
      setFilteredGuests(filtered);
    } else {
      setFilteredGuests([]);
    }
  }, [searchQuery]);

  // Manejar selección de invitado (modo RSVP)
  const handleGuestSelect = (guest: typeof rsvpExamples[0]) => {
    setSearchQuery('');
    setFilteredGuests([]);
    setScanResult({
      success: true,
      message: 'Invitación confirmada',
      details: {
        nombre: guest.nombre,
        acompanantes: guest.acompanantes,
        mesa: guest.mesa,
      }
    });
  };

  const handleReset = () => {
    if (theme.rsvpButton.mode === 'rsvp') {
      // Reset para modo RSVP
      setScanResult(null);
      setSearchQuery('');
      setFilteredGuests([]);
    } else {
      // Reset para modo Tickets (QR)
      if (scannerRef.current) {
        try {
          // Pausar y limpiar el scanner
          scannerRef.current.pause();
          scannerRef.current.clear();
          scannerRef.current = null;
          setScanResult(null);
          setIsScanning(true);
        } catch (error) {
          console.error('Error al resetear el scanner:', error);
          // Intentar limpiar el estado aunque falle el scanner
          scannerRef.current = null;
          setScanResult(null);
          setIsScanning(true);
        }
      } else {
        setScanResult(null);
        setIsScanning(true);
      }
    }
  };

  return (
    <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 bg-gradient-animation flex flex-col items-center justify-center relative z-10 pb-32">
      {/* Título del evento - Arriba */}
      <div className="w-full max-w-md mt-24 flex-shrink-0">
        <div className="title-image-container mb-4">
          <Image
            src={theme.resources.images.title}
            alt="Título del evento"
            width={300}
            height={100}
            className="title-image"
            priority
          />
        </div>
        {/* Badge Modo Demo */}
        <div className="flex justify-center mb-4">
          <div className="bg-purple-600 text-white px-3 py-1 rounded-full backdrop-blur-sm shadow-lg">
            <span className="text-xs font-bold">MODO DEMO</span>
          </div>
        </div>
        <h1 className="heading-h1 mb-6 text-center">
          {theme.rsvpButton.mode === 'rsvp' 
            ? 'Validación de RSVP' 
            : 'Validación de Tickets'}
        </h1>
      </div>
      
      <div className="w-full max-w-md mx-auto flex-shrink-0">
        <div className="border-2 border-pink-500 shadow-lg shadow-pink-500/90 bg-gradient-to-t from-[#f9adcd] 0% to-[#ffffff] 100% rounded-xl p-4 shadow-lg">
          {theme.rsvpButton.mode === 'rsvp' ? (
            // MODO RSVP: Buscador de nombres
            <>
              {scanResult ? (
                // Mostrar resultados de la búsqueda
                <div className="rounded-xl p-6 bg-green-50 text-green-800 border border-green-200 text-center">
                  <h3 className="heading-h2-alt mb-4 text-center">
                    ✅ Invitación confirmada
                  </h3>
                  <p className="body-base-alt text-center mb-4">
                    {scanResult.message}
                  </p>
                  {scanResult.details && (
                    <div className="space-y-2">
                      {scanResult.details.nombre && (
                        <p className="body-base-alt text-center"><strong>Invitado:</strong> {scanResult.details.nombre}</p>
                      )}
                      {scanResult.details.acompanantes !== undefined && (
                        <p className="body-base-alt text-center">
                          <strong>Acompañantes:</strong> {scanResult.details.acompanantes}
                        </p>
                      )}
                      {scanResult.details.mesa && (
                        <p className="body-base-alt text-center"><strong>Mesa:</strong> {scanResult.details.mesa}</p>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={handleReset}
                    variant="primary"
                    className="w-full mt-4"
                  >
                    Buscar otro invitado
                  </Button>
                </div>
              ) : (
                // Buscador de nombres
                <div className="space-y-4">
                  <p className="body-base-alt text-center mb-4">
                    Busca el nombre del invitado
                  </p>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Buscar por nombre y apellido..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                    {filteredGuests.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredGuests.map((guest, index) => (
                          <button
                            key={index}
                            onClick={() => handleGuestSelect(guest)}
                            className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <p className="body-base-alt font-medium text-gray-900">
                              {guest.nombre}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery.trim() && filteredGuests.length === 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
                        <p className="body-base-alt text-center text-gray-500">
                          No se encontraron resultados
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            // MODO TICKETS: Scanner QR (funcionalidad original)
            <>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="body-base-alt text-center">Validando código QR...</p>
                </div>
              ) : !hasPermission ? (
                <div className="text-center p-4">
                  <p className="body-base-alt mb-4">
                    Para escanear códigos QR, necesitamos acceso a tu cámara.
                    {error && <span className="text-red-500 block mt-2">{error}</span>}
                  </p>
                  <Button
                    onClick={requestCameraPermission}
                    variant="primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Solicitando acceso...' : 'Permitir acceso'}
                  </Button>
                </div>
              ) : isScanning ? (
                <>
                  <p className="body-base-alt text-center mb-4">
                    Escanea el código QR de la invitación
                  </p>
                  <div 
                    id="reader" 
                    className="mx-auto max-w-xl min-h-[300px] rounded-lg overflow-hidden"
                    style={{ width: '100%' }}
                  />
                </>
              ) : (
                <>
                  {scanResult && (
                    <div className={`rounded-xl p-6 ${
                      scanResult.success 
                        ? 'bg-green-50 text-green-800 border border-green-200 text-center' 
                        : 'bg-red-50 text-red-800 border border-red-200 text-center'
                    }`}>
                      <h3 className="heading-h2-alt mb-4 text-center">
                        {scanResult.success ? '✅ Invitación válida' : '⛔️ Invitación no válida'}
                      </h3>
                      <p className="body-base-alt text-center mb-4">
                        {scanResult.message}
                      </p>
                      {scanResult.details && (
                        <div className="space-y-2">
                          {scanResult.details.ID && (
                            <p className="body-base-alt text-center"><strong>ID:</strong> {scanResult.details.ID}</p>
                          )}
                          {scanResult.details.Titular && (
                            <p className="body-base-alt text-center"><strong>Titular:</strong> {scanResult.details.Titular}</p>
                          )}
                          {scanResult.details.Ticket && (
                            <p className="body-base-alt text-center"><strong>Ticket:</strong> {scanResult.details.Ticket}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={handleReset}
                    variant="primary"
                    className="w-full mt-4"
                  >
                    Escanear otro código
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Logo fijo abajo */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
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
            className="rounded-lg eventechy-logo"
          />
        </a>
      </div>
    </div>
  );
};

export default QRScanner;