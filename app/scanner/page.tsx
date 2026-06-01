'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import QRScanner from '@/components/qr-scan'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { isBackgroundDark } from '@/config/theme'
import { pausedFeatureMessage, demoFeatures } from '@/config/feature-flags'

export default function ScannerPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)
  const backgroundIsDark = isBackgroundDark()

  useEffect(() => {
    let alive = true

    const checkSession = async () => {
      try {
        const response = await fetch('/api/invitados/auth', { cache: 'no-store' })
        if (!alive) return
        setIsAuthenticated(response.ok)
      } catch {
        if (!alive) return
        setIsAuthenticated(false)
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    if (demoFeatures.scanner) {
      void checkSession()
    } else {
      setLoading(false)
    }

    return () => {
      alive = false
    }
  }, [])

  const handleLogin = async () => {
    try {
      setAuthError('')
      const trimmed = password.trim()
      if (!trimmed) {
        setAuthError('Ingresá una contraseña')
        return
      }

      const response = await fetch('/api/invitados/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo iniciar sesión')
      }

      setPassword('')
      setIsAuthenticated(true)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }

  const handleAuthExpired = async () => {
    await fetch('/api/invitados/auth', { method: 'DELETE' }).catch(() => null)
    setIsAuthenticated(false)
    setPassword('')
    setAuthError('Tu sesión expiró. Ingresá la contraseña nuevamente.')
  }

  const handleLogout = async () => {
    await fetch('/api/invitados/auth', { method: 'DELETE' }).catch(() => null)
    setIsAuthenticated(false)
    setPassword('')
    setAuthError('')
  }

  if (!demoFeatures.scanner) {
    return (
      <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 flex items-center justify-center">
        <Card className="w-full max-w-md rounded-xl border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] shadow-lg bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 font-secondary mb-4">Scanner en pausa</h1>
          <p className="text-gray-700">{pausedFeatureMessage}</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 flex items-center justify-center">
        <Card className="w-full max-w-md rounded-xl border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] shadow-lg bg-white p-8 text-center text-gray-700">
          Cargando scanner...
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md rounded-xl border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] shadow-lg bg-white p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#FF914E] rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-secondary">Scanner QR</h1>
            <p className="text-gray-700">Ingresa la contraseña para acceder.</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setAuthError('')
              }}
              placeholder="Contraseña"
              className="bg-white text-gray-900 border-gray-400 placeholder:text-gray-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleLogin()
                }
              }}
            />
            <Button
              onClick={() => void handleLogin()}
              className="w-full bg-[#FFCF6E] hover:bg-[#FFCF6E]/90 text-gray-800 border-2 border-gray-700"
            >
              Ingresar
            </Button>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
          </div>
        </Card>
        <a
          href="https://eventechy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block hover:opacity-80 transition-opacity leading-[0]"
        >
          <Image
            src={backgroundIsDark ? '/logo-fondo-oscuro.png' : '/logo-fondo-claro.png'}
            alt="Eventechy"
            width={155}
            height={55}
            className="rounded-lg"
          />
        </a>
      </div>
    )
  }

  return <QRScanner onAuthExpired={handleAuthExpired} onLogout={handleLogout} />
}
