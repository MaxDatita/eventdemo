'use client'

import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CheckCircle2, RotateCcw, ScanLine, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { isBackgroundDark, theme } from '@/config/theme'

type ScanResult = {
  success: boolean
  title: string
  message: string
  invitado?: {
    id: string
    nombre: string
    fechaHoraIngreso: string | null
    freePass?: boolean
  }
}

type QRScannerProps = {
  onAuthExpired?: () => void
}

function extractTicketId(decodedText: string) {
  const value = decodedText.trim()
  const idPrefix = value.match(/^id\s*:\s*(.+)$/i)

  if (idPrefix?.[1]) {
    return idPrefix[1].trim()
  }

  return value
}

const QRScanner = ({ onAuthExpired }: QRScannerProps) => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const backgroundIsDark = isBackgroundDark()

  const requestCameraPermission = async () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError('Para usar la camara, abrí el scanner desde una URL HTTPS. La URL local por IP sirve para ver la pagina, pero el navegador bloquea la camara.')
      return
    }

    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      stream.getTracks().forEach((track) => track.stop())
      setHasPermission(true)
      setIsScanning(true)
    } catch (err) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((track) => track.stop())
        setHasPermission(true)
        setIsScanning(true)
      } catch (fallbackErr) {
        const cameraError = fallbackErr instanceof Error ? fallbackErr : err
        setHasPermission(false)

        if (cameraError instanceof Error) {
          if (cameraError.name === 'NotAllowedError' || cameraError.name === 'PermissionDeniedError') {
            setError('Acceso a la camara denegado. Permitilo desde el navegador para escanear.')
            return
          }

          if (cameraError.name === 'NotFoundError') {
            setError('No se encontro una camara disponible en este dispositivo.')
            return
          }
        }

        setError('No se pudo acceder a la camara.')
      }
    }
  }

  const validateQRCode = useCallback(async (decodedText: string) => {
    const id = extractTicketId(decodedText)

    if (!id) {
      setScanResult({
        success: false,
        title: 'QR invalido',
        message: 'El codigo escaneado no contiene un ID valido.',
      })
      setIsScanning(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/invitados/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ingreso: true }),
      })
      const data = await response.json()

      if (response.status === 401) {
        onAuthExpired?.()
        return
      }

      if (!response.ok) {
        setScanResult({
          success: false,
          title: response.status === 409 ? 'Entrada ya utilizada' : 'QR no valido',
          message: data?.error || 'No se pudo validar el codigo.',
          invitado: data?.invitado,
        })
        return
      }

      setScanResult({
        success: true,
        title: data.invitado?.freePass ? 'Free pass valido' : 'Entrada valida',
        message: data.invitado?.freePass
          ? 'Ingreso permitido. Free pass activo.'
          : 'Ingreso registrado correctamente.',
        invitado: data.invitado,
      })
    } catch {
      setScanResult({
        success: false,
        title: 'Error de validacion',
        message: 'No se pudo validar el QR. Revisá la conexion e intentá nuevamente.',
      })
    } finally {
      setIsLoading(false)
      setIsScanning(false)
    }
  }, [onAuthExpired])

  useEffect(() => {
    if (!hasPermission || !isScanning) return

    const html5QrCode = new Html5Qrcode('reader')
    scannerRef.current = html5QrCode

    html5QrCode
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          html5QrCode.pause()
          await validateQRCode(decodedText)
        },
        (errorMessage) => {
          if (!errorMessage.includes('NotFound')) {
            console.warn(errorMessage)
          }
        }
      )
      .catch(() => {
        setError('No se pudo iniciar el scanner de QR.')
        setIsScanning(false)
      })

    return () => {
      scannerRef.current = null
      html5QrCode.stop().catch(() => null)
    }
  }, [hasPermission, isScanning, validateQRCode])

  const handleReset = () => {
    setScanResult(null)
    setError(null)
    setIsScanning(true)
  }

  return (
    <div className="pt-6 pb-6 pl-6 pr-6 flex flex-col items-center relative z-10">
      <div className="w-full max-w-3xl mt-12 flex flex-col">
        <div className="title-image-container mb-2">
          <Image
            src={theme.resources.images.title || '/eventest.png'}
            alt="Eventest"
            width={300}
            height={100}
            className="title-image"
            priority
          />
        </div>

        <h1 className="heading-h1 mb-4" style={{ color: theme.colors.primary }}>
          Scanner QR
        </h1>

        <Card className="rounded-xl shadow-md p-4 mb-4 border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] bg-white">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-[#FFF7E8] border border-[#FFD9A8] p-3 text-center">
              <p className="text-xs text-gray-600">Lectura</p>
              <p className="text-lg font-bold text-gray-900">QR por ID</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-xs text-green-700">Valido</p>
              <p className="text-lg font-bold text-green-800">Marca ingreso</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
              <p className="text-xs text-amber-700">Repetido</p>
              <p className="text-lg font-bold text-amber-800">No aprueba</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-2 border-[#FFD9A8] p-4 shadow-sm bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-800">
              <div className="w-16 h-16 border-4 border-[#FF914E] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-center font-medium">Validando QR...</p>
            </div>
          ) : scanResult ? (
            <div
              className={`rounded-xl border p-6 text-center ${
                scanResult.success
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className="mb-4 flex justify-center">
                {scanResult.success ? (
                  <CheckCircle2 className="h-14 w-14 text-green-700" />
                ) : (
                  <XCircle className="h-14 w-14 text-red-700" />
                )}
              </div>
              <h2 className="text-2xl font-bold font-secondary mb-2">{scanResult.title}</h2>
              <p className="mb-4">{scanResult.message}</p>

              {scanResult.invitado && (
                <div className="space-y-1 rounded-lg bg-white/70 border border-current/10 p-3 text-sm">
                  <p>
                    <strong>ID:</strong> {scanResult.invitado.id}
                  </p>
                  <p>
                    <strong>Nombre:</strong> {scanResult.invitado.nombre}
                  </p>
                  {scanResult.invitado.fechaHoraIngreso && (
                    <p>
                      <strong>Ingreso:</strong> {scanResult.invitado.fechaHoraIngreso}
                    </p>
                  )}
                  {scanResult.invitado.freePass && (
                    <p>
                      <strong>Tipo:</strong> Free pass
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleReset}
                className="mt-5 w-full bg-[#FF914E] hover:bg-[#ff8132] text-white border-2 border-[#FF914E]"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Escanear otro QR
              </Button>
            </div>
          ) : !hasPermission ? (
            <div className="text-center p-6 text-gray-800">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF914E]">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 font-secondary mb-2">
                Acceso a la camara
              </h2>
              <p className="mb-4 text-gray-700">
                Permití el acceso para escanear el QR de ingreso.
              </p>
              {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
              <Button
                onClick={requestCameraPermission}
                className="w-full bg-[#FF914E] hover:bg-[#ff8132] text-white border-2 border-[#FF914E]"
              >
                Permitir acceso
              </Button>
            </div>
          ) : (
            <div className="text-gray-800">
              <div className="mb-4 flex items-center justify-center gap-2 text-center">
                <ScanLine className="h-5 w-5 text-[#FF914E]" />
                <p className="font-medium">Escaneá el QR de la entrada</p>
              </div>
              {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}
              <div
                id="reader"
                className="mx-auto min-h-[300px] overflow-hidden rounded-lg border border-[#FFD9A8]"
                style={{ width: '100%' }}
              />
            </div>
          )}
        </Card>

        <footer className="mt-8 pt-6 pb-2 flex justify-center">
          <a
            href="https://eventechy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity leading-[0]"
          >
            <Image
              src={backgroundIsDark ? '/logo-fondo-oscuro.png' : '/logo-fondo-claro.png'}
              alt="Eventechy"
              width={155}
              height={115}
              className="block rounded-lg object-contain"
              style={{ width: 155, height: 115 }}
            />
          </a>
        </footer>
      </div>
    </div>
  )
}

export default QRScanner
