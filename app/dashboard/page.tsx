'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { StatsCard } from '@/components/ui/stats-card'
import { LoteModal } from '@/components/ui/lote-modal'
import { GenerateTicketModal } from '@/components/ui/generate-ticket-modal'
import { ExportSummaryModal } from '@/components/ui/export-summary-modal'
import { useDemoDates } from '@/contexts/DemoContext'
import { theme } from '@/config/theme'
import {
  Users,
  Ticket,
  AlertCircle,
  UserPlus,
  Plus,
  FileText,
  Search,
  Filter,
  Lock,
  RefreshCw,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface Guest {
  id: string
  firstName: string
  lastName: string
  companions: number
  dietaryRequirements: string
  confirmedAt: string
}

interface Ticket {
  id: string
  type: string
  buyerName: string
  buyerEmail: string
  quantity: number
  purchasedAt: string
  price: number
}

interface DashboardStats {
  totalGuests: number
  totalTicketsSold: number
  totalTicketsAvailable: number
  guestsWithDietaryRequirements: number
  totalCompanions: number
  ticketsByType: Record<string, number>
  dietaryRequirementsBreakdown: Record<string, number>
}

type FilterType = 'all' | 'with-dietary' | 'without-dietary'

function DashboardContent() {
  const searchParams = useSearchParams()
  const { isDarkMode } = useDemoDates()
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [guests, setGuests] = useState<Guest[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tickets, setTickets] = useState<Ticket[]>([]) // Guardado para futuras funcionalidades
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [showLoteModal, setShowLoteModal] = useState(false)
  const [showGenerateTicketModal, setShowGenerateTicketModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [themeConfig, setThemeConfig] = useState<typeof theme | null>(null)

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true)
      fetchDashboardData()
      fetchThemeConfig()
    } else {
      toast.error('Contraseña incorrecta')
    }
  }

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!isAuthenticated) return

    if (!silent) setIsLoading(true)
    try {
      const response = await fetch(
        `/api/dashboard/stats?password=${encodeURIComponent(password || 'admin123')}`
      )
      const result = await response.json()

      if (response.ok && result.success) {
        setGuests(result.guests || [])
        setTickets(result.tickets || []) // Guardado para futuras funcionalidades
        setStats(result.stats || null)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [isAuthenticated, password])

  const fetchThemeConfig = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const response = await fetch(
        `/api/dashboard/update-theme?password=${encodeURIComponent(password || 'admin123')}`
      )
      const result = await response.json()

      if (response.ok && result.success) {
        setThemeConfig(result.config)
      }
    } catch (error) {
      console.error('Error fetching theme config:', error)
    }
  }, [isAuthenticated, password])

  // Auto-autenticar si viene la contraseña en query params (modo demo)
  useEffect(() => {
    const demoParam = searchParams.get('demo')
    const passwordParam = searchParams.get('password')
    
    if (demoParam === 'true' && passwordParam === 'admin123' && !isAuthenticated) {
      setPassword(passwordParam)
      setIsAuthenticated(true)
      // Ejecutar las funciones fetch después de autenticar
      setTimeout(() => {
        fetchDashboardData()
        fetchThemeConfig()
      }, 100)
    }
  }, [searchParams, isAuthenticated, fetchDashboardData, fetchThemeConfig])

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    if (!isAuthenticated) return

    fetchDashboardData(false)
    fetchThemeConfig()

    const interval = setInterval(() => {
      setIsRefreshing(true)
      fetchDashboardData(true)
      fetchThemeConfig()
      setTimeout(() => setIsRefreshing(false), 2000)
    }, 60000)

    return () => clearInterval(interval)
  }, [isAuthenticated, fetchDashboardData, fetchThemeConfig])

  const handleLoteSave = () => {
    fetchThemeConfig()
    fetchDashboardData(true)
  }

  const handleGenerateTicketSuccess = () => {
    fetchDashboardData(true)
  }

  // Filtrar invitados
  const filteredGuests = guests.filter((guest) => {
    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        guest.firstName.toLowerCase().includes(query) ||
        guest.lastName.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Filtro por requerimientos alimentarios
    if (filter === 'with-dietary') {
      return guest.dietaryRequirements && guest.dietaryRequirements.trim() !== ''
    }
    if (filter === 'without-dietary') {
      return !guest.dietaryRequirements || guest.dietaryRequirements.trim() === ''
    }

    return true
  })

  const isRsvpMode = theme.rsvpButton.mode === 'rsvp'
  const isTicketsMode = theme.rsvpButton.mode === 'tickets'

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
              <h1 className="heading-h1-alt">Dashboard del Evento</h1>
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
    )
  }

  return (
    <>
      <div className="bg-gradient-animation" />
      <div className="demo-badge-center-bottom">
        <span className="text-xs font-bold">MODO DEMO</span>
      </div>
      <div className="content-container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="heading-h2">Dashboard del Evento</h1>
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <div className="flex items-center gap-2 text-white/60">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Actualizando...</span>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => setIsAuthenticated(false)}
              className={`border ${
                isDarkMode
                  ? 'border-gray-600 text-white'
                  : 'border-white/60 text-white'
              } bg-transparent hover:bg-white/10`}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Cards de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isRsvpMode ? (
            <>
              <StatsCard
                title="Invitados"
                value={stats?.totalGuests || 0}
                icon={Users}
                isDarkMode={isDarkMode}
              />
              <StatsCard
                title="Acompañantes"
                value={stats?.totalCompanions || 0}
                icon={UserPlus}
                isDarkMode={isDarkMode}
              />
              <StatsCard
                title="Con Requerimientos"
                value={stats?.guestsWithDietaryRequirements || 0}
                icon={AlertCircle}
                isDarkMode={isDarkMode}
                className={
                  (stats?.guestsWithDietaryRequirements || 0) > 0
                    ? 'border-orange-400'
                    : ''
                }
              />
              <StatsCard
                title="Total de Personas"
                value={
                  (stats?.totalGuests || 0) + (stats?.totalCompanions || 0)
                }
                icon={Users}
                isDarkMode={isDarkMode}
              />
            </>
          ) : (
            <>
              <StatsCard
                title="Tickets Vendidos"
                value={stats?.totalTicketsSold || 0}
                icon={Ticket}
                isDarkMode={isDarkMode}
              />
              <StatsCard
                title="Tickets Disponibles"
                value={stats?.totalTicketsAvailable || 0}
                icon={Ticket}
                isDarkMode={isDarkMode}
              />
              <StatsCard
                title="VIP Vendidos"
                value={stats?.ticketsByType?.['VIP'] || 0}
                icon={Ticket}
                isDarkMode={isDarkMode}
              />
              <StatsCard
                title="Regular Vendidos"
                value={stats?.ticketsByType?.['Regular'] || 0}
                icon={Ticket}
                isDarkMode={isDarkMode}
              />
            </>
          )}
        </div>

        {/* Modo RSVP */}
        {isRsvpMode && (
          <div className="space-y-6">
            {/* Botón de Exportar Resumen */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generar Resumen
              </Button>
            </div>

            {/* Requerimientos Alimentarios */}
            {stats &&
              Object.keys(stats.dietaryRequirementsBreakdown).length > 0 && (
                <Card
                  className={`p-6 rounded-xl border-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border-orange-500/50'
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <h2
                    className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Requerimientos Alimentarios
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(stats.dietaryRequirementsBreakdown).map(
                      ([req, count]) => (
                        <div
                          key={req}
                          className={`p-3 rounded-lg ${
                            isDarkMode
                              ? 'bg-gray-700 text-white'
                              : 'bg-white text-gray-900'
                          }`}
                        >
                          <span className="font-semibold">{req}</span>
                          <span
                            className={`ml-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}
                          >
                            ({count} invitado{count !== 1 ? 's' : ''})
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </Card>
              )}

            {/* Lista de Invitados */}
            <Card
              className={`p-6 rounded-xl border-2 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Lista de Invitados ({filteredGuests.length})
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    />
                    <Input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 ${
                        isDarkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : ''
                      }`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filter === 'all' ? 'primary' : 'secondary'}
                      onClick={() => setFilter('all')}
                      className={`flex items-center gap-2 transition-all focus:outline-none focus:ring-0 ${
                        filter === 'all'
                          ? 'ring-2 ring-purple-400 ring-offset-2'
                          : ''
                      }`}
                    >
                      <Filter className="h-4 w-4" />
                      Todos
                    </Button>
                    <Button
                      variant={
                        filter === 'with-dietary' ? 'primary' : 'secondary'
                      }
                      onClick={() => setFilter('with-dietary')}
                      className={`flex items-center gap-2 transition-all focus:outline-none focus:ring-0 ${
                        filter === 'with-dietary'
                          ? 'ring-2 ring-purple-400 ring-offset-2'
                          : ''
                      }`}
                    >
                      Con Requerimientos
                    </Button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className={isDarkMode ? 'text-white' : 'text-gray-600'}>
                    Cargando invitados...
                  </p>
                </div>
              ) : filteredGuests.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No hay invitados que coincidan con los filtros
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className={`p-4 rounded-lg border-2 ${
                        guest.dietaryRequirements &&
                        guest.dietaryRequirements.trim() !== ''
                          ? isDarkMode
                            ? 'bg-orange-900/20 border-orange-500/50'
                            : 'bg-orange-50 border-orange-200'
                          : isDarkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {guest.firstName} {guest.lastName}
                            </h3>
                            {guest.dietaryRequirements &&
                              guest.dietaryRequirements.trim() !== '' && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white">
                                  Requerimientos
                                </span>
                              )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            {guest.companions > 0 && (
                              <span
                                className={
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }
                              >
                                +{guest.companions} acompañante
                                {guest.companions > 1 ? 's' : ''}
                              </span>
                            )}
                            {guest.dietaryRequirements &&
                              guest.dietaryRequirements.trim() !== '' && (
                                <span
                                  className={
                                    isDarkMode
                                      ? 'text-orange-300'
                                      : 'text-orange-600'
                                  }
                                >
                                  {guest.dietaryRequirements}
                                </span>
                              )}
                            <span
                              className={
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }
                            >
                              {new Date(guest.confirmedAt).toLocaleDateString(
                                'es-ES'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Modo Tickets */}
        {isTicketsMode && (
          <div className="space-y-6">
            {/* Gestión de Lotes */}
            <Card
              className={`p-6 rounded-xl border-2 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Gestión de Lotes
                </h2>
                <Button
                  onClick={() => setShowLoteModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {themeConfig?.tickets?.lotes?.enabled
                    ? 'Editar Lote'
                    : 'Crear Lote'}
                </Button>
              </div>

              {themeConfig?.tickets?.lotes ? (
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        Estado:
                      </span>
                      <p
                        className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {themeConfig.tickets.lotes.enabled
                          ? 'Activo'
                          : 'Deshabilitado'}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        Lote Actual:
                      </span>
                      <p
                        className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        #{themeConfig.tickets.lotes.currentLot}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        Máximo por Lote:
                      </span>
                      <p
                        className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {themeConfig.tickets.lotes.maxTicketsPerLot === 0
                          ? 'Ilimitado'
                          : themeConfig.tickets.lotes.maxTicketsPerLot}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        Mensaje Agotado:
                      </span>
                      <p
                        className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {themeConfig.tickets.lotes.soldOutMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  No hay lotes configurados. Crea uno para comenzar.
                </p>
              )}
            </Card>

            {/* Estadísticas de Ventas */}
            <Card
              className={`p-6 rounded-xl border-2 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <h2
                className={`text-xl font-bold mb-6 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                Estadísticas de Ventas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats?.ticketsByType &&
                  Object.entries(stats.ticketsByType).map(([type, count]) => (
                    <div
                      key={type}
                      className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        Tipo: {type}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {count} tickets
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Generar Tickets Gratuitos */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowGenerateTicketModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generar Tickets Gratuitos
              </Button>
            </div>
          </div>
        )}

        {/* Modales */}
        <LoteModal
          open={showLoteModal}
          onClose={() => setShowLoteModal(false)}
          onSave={handleLoteSave}
          lote={themeConfig?.tickets?.lotes}
        />

        <GenerateTicketModal
          open={showGenerateTicketModal}
          onClose={() => setShowGenerateTicketModal(false)}
          onSuccess={handleGenerateTicketSuccess}
        />

        <ExportSummaryModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="content-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Cargando dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

