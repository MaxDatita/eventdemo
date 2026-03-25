'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { isBackgroundDark, theme } from '@/config/theme'
import { Lock } from 'lucide-react'

type Invitado = {
  id: string
  nombre: string
  acompanantes: number | null
  mesa: string | null
  ingreso: boolean
  fechaHoraIngreso: string | null
}

export default function InvitadosPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [allInvitados, setAllInvitados] = useState<Invitado[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const fetchInvitados = async () => {
    const response = await fetch('/api/invitados', {
      cache: 'no-store',
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || 'No se pudo cargar la lista de invitados')
    }

    setAllInvitados(data.invitados || [])
  }

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

    void checkSession()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('route-invitados')
    document.body.classList.add('route-invitados')

    return () => {
      document.documentElement.classList.remove('route-invitados')
      document.body.classList.remove('route-invitados')
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    let alive = true

    const run = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true)
        }
        await fetchInvitados()
        if (alive) setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error cargando invitados'
        if (message.toLowerCase().includes('contraseña incorrecta')) {
          await fetch('/api/invitados/auth', { method: 'DELETE' }).catch(() => null)
          if (alive) {
            setIsAuthenticated(false)
            setPassword('')
            setAuthError('Tu sesión expiró. Ingresá la contraseña nuevamente.')
            setAllInvitados([])
          }
          return
        }
        if (alive) {
          setError(message)
        }
      } finally {
        if (alive && showLoading) setLoading(false)
      }
    }

    run(true)
    const interval = setInterval(() => {
      if (!document.hidden) {
        run(false)
      }
    }, 15000)

    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [isAuthenticated])

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
      setError(null)
      setLoading(true)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }

  const handleToggleIngreso = async (id: string, ingreso: boolean) => {
    try {
      setUpdatingId(id)
      setError(null)

      const response = await fetch('/api/invitados/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ingreso }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          await fetch('/api/invitados/auth', { method: 'DELETE' }).catch(() => null)
          setIsAuthenticated(false)
          setPassword('')
          setAuthError('Tu sesión expiró. Ingresá la contraseña nuevamente.')
          setAllInvitados([])
          return
        }
        throw new Error(data?.error || 'No se pudo actualizar el ingreso')
      }

      setAllInvitados((prev) => prev.map((item) => (item.id === id ? data.invitado : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando ingreso')
    } finally {
      setUpdatingId(null)
    }
  }

  const invitados = useMemo(() => {
    const normalized = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    const filtered = !normalized
      ? allInvitados
      : allInvitados.filter((guest) => {
      const name = guest.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return name.includes(normalized)
    })

    return [...filtered].sort((a, b) => {
      if (a.ingreso === b.ingreso) {
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      }
      return a.ingreso ? 1 : -1
    })
  }, [allInvitados, query])

  const stats = useMemo(() => {
    const total = allInvitados.length
    const ingresados = allInvitados.filter((g) => g.ingreso).length
    const pendientes = total - ingresados
    return { total, ingresados, pendientes }
  }, [allInvitados])

  const backgroundIsDark = isBackgroundDark()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md rounded-xl border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] shadow-lg bg-white p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#FF914E] rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-secondary">Control de Ingresos</h1>
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

  return (
    <>
      <div className="pt-6 pb-6 pl-6 pr-6 flex flex-col items-center relative z-10">
        <div className="w-full max-w-3xl mt-12 flex flex-col">
          <div className="title-image-container mb-2">
            <Image
              src="/eventest.png"
              alt="Eventest"
              width={300}
              height={100}
              className="title-image"
              priority
            />
          </div>
          <h1 className="heading-h1 mb-4" style={{ color: theme.colors.primary }}>
            Control de Ingresos
          </h1>

          <div
            className="rounded-xl shadow-md p-4 mb-4 border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] bg-white"
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-[#FFF7E8] border border-[#FFD9A8] p-3 text-center">
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                <p className="text-xs text-green-700">Ingresados</p>
                <p className="text-xl font-bold text-green-800">{stats.ingresados}</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-xs text-amber-700">Pendientes</p>
                <p className="text-xl font-bold text-amber-800">{stats.pendientes}</p>
              </div>
            </div>
          </div>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre"
            className="mb-4 bg-white text-gray-900 border-gray-400 placeholder:text-gray-500"
          />

          {error && (
            <div
              className={`mb-4 rounded-lg border p-3 text-sm ${
                backgroundIsDark
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-red-300 bg-red-50 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          <div className="space-y-3">
            {loading ? (
              <div
                className="rounded-lg p-4 text-center border bg-white text-gray-700 border-[#FFD9A8]"
              >
                Cargando invitados...
              </div>
            ) : invitados.length === 0 ? (
              <div
                className="rounded-lg p-4 text-center border bg-white text-gray-700 border-[#FFD9A8]"
              >
                No hay invitados para mostrar.
              </div>
            ) : (
              invitados.map((guest) => (
                <div
                  key={guest.id}
                  className="rounded-xl border-2 border-[#FFD9A8] p-4 shadow-sm bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-gray-900 font-semibold">{guest.nombre}</p>
                      {guest.acompanantes !== null && (
                        <p className="text-xs text-gray-700 mt-1">
                          Acompañantes: {guest.acompanantes}
                        </p>
                      )}
                      {guest.mesa && (
                        <p className="text-xs text-gray-700 mt-1">Mesa: {guest.mesa}</p>
                      )}
                      {guest.fechaHoraIngreso && (
                        <p className="text-xs text-green-700 mt-1">
                          Ingresó: {guest.fechaHoraIngreso}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          guest.ingreso
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {guest.ingreso ? 'Ingresó' : 'Pendiente'}
                      </span>
                      <Button
                        onClick={() => handleToggleIngreso(guest.id, !guest.ingreso)}
                        disabled={updatingId === guest.id}
                        className={
                          guest.ingreso
                            ? 'bg-[#FFCF6E] hover:bg-[#FFCF6E]/90 text-gray-900 border-2 border-gray-700'
                            : 'bg-[#FF914E] hover:bg-[#ff8132] text-white border-2 border-[#FF914E]'
                        }
                      >
                        {updatingId === guest.id
                          ? 'Actualizando...'
                          : guest.ingreso
                            ? 'Marcar pendiente'
                            : 'Marcar ingreso'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

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
    </>
  )
}
