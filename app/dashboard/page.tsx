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
import { EditGuestModal } from '@/components/ui/edit-guest-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDemoDates } from '@/contexts/DemoContext'
import { theme } from '@/config/theme'
import { generateDashboardData, calculateStats, generateMockTickets } from '@/lib/mock-data'
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
  Edit,
  Trash2,
  Table,
  RotateCcw,
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
  tableNumber?: number | null
  deleted?: boolean
  deletedAt?: string | null
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

type FilterType = 'all' | 'with-dietary' | 'with-table' | 'without-table'

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
  const [showEditGuestModal, setShowEditGuestModal] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [deletedGuests, setDeletedGuests] = useState<Guest[]>([])
  const [themeConfig, setThemeConfig] = useState<typeof theme | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true)
      fetchDashboardData()
      fetchThemeConfig()
    } else {
      toast.error('Contraseña incorrecta')
    }
  }

  // Funciones helper para localStorage
  const loadGuestsFromStorage = useCallback((): Guest[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('demo-guests')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading guests from storage:', error)
    }
    return []
  }, [])

  const saveGuestsToStorage = useCallback((guestsToSave: Guest[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('demo-guests', JSON.stringify(guestsToSave))
    } catch (error) {
      console.error('Error saving guests to storage:', error)
    }
  }, [])

  const initializeGuests = useCallback((): Guest[] => {
    const stored = loadGuestsFromStorage()
    if (stored.length > 0) {
      // Ordenar: los más recientes primero (por confirmedAt)
      return stored.sort((a, b) => {
        const dateA = new Date(a.confirmedAt).getTime()
        const dateB = new Date(b.confirmedAt).getTime()
        return dateB - dateA // Más reciente primero
      })
    }
    // Si no hay datos guardados, generar nuevos
    const initialData = generateDashboardData()
    const initialGuests = initialData.guests.map(g => ({
      ...g,
      tableNumber: g.tableNumber || null,
      deleted: g.deleted || false,
      deletedAt: g.deletedAt || null
    }))
    // Ordenar por fecha de confirmación (más recientes primero)
    initialGuests.sort((a, b) => {
      const dateA = new Date(a.confirmedAt).getTime()
      const dateB = new Date(b.confirmedAt).getTime()
      return dateB - dateA
    })
    saveGuestsToStorage(initialGuests)
    return initialGuests
  }, [loadGuestsFromStorage, saveGuestsToStorage])

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!isAuthenticated) return

    if (!silent) setIsLoading(true)
    try {
      // Cargar desde localStorage
      const allGuests = initializeGuests()
      const activeGuests = allGuests.filter(g => !g.deleted)
      const tickets = generateMockTickets(45)
      const stats = calculateStats(activeGuests, tickets)

      setGuests(activeGuests)
      setTickets(tickets)
      setStats(stats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [isAuthenticated, initializeGuests])

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

  const fetchDeletedGuests = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      // Cargar desde localStorage
      const allGuests = loadGuestsFromStorage()
      const deleted = allGuests.filter(g => g.deleted === true)
      setDeletedGuests(deleted)
    } catch (error) {
      console.error('Error fetching deleted guests:', error)
    }
  }, [isAuthenticated, loadGuestsFromStorage])

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
        fetchDeletedGuests()
      }, 100)
    }
  }, [searchParams, isAuthenticated, fetchDashboardData, fetchThemeConfig, fetchDeletedGuests])

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    if (!isAuthenticated) return

    fetchDashboardData(false)
    fetchThemeConfig()
    fetchDeletedGuests()

    const interval = setInterval(() => {
      setIsRefreshing(true)
      fetchDashboardData(true)
      fetchThemeConfig()
      fetchDeletedGuests()
      setTimeout(() => setIsRefreshing(false), 2000)
    }, 60000)

    return () => clearInterval(interval)
  }, [isAuthenticated, fetchDashboardData, fetchThemeConfig, fetchDeletedGuests])


  const handleLoteSave = () => {
    fetchThemeConfig()
    fetchDashboardData(true)
  }

  const handleGenerateTicketSuccess = () => {
    fetchDashboardData(true)
  }

  const handleEditGuest = (guest: Guest) => {
    setSelectedGuest(guest)
    setShowEditGuestModal(true)
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este invitado?')) {
      return
    }

    try {
      // Cargar todos los invitados
      const allGuests = loadGuestsFromStorage()
      const guestIndex = allGuests.findIndex(g => g.id === guestId)
      
      if (guestIndex === -1) {
        toast.error('Invitado no encontrado')
        return
      }

      // Marcar como eliminado
      allGuests[guestIndex] = {
        ...allGuests[guestIndex],
        deleted: true,
        deletedAt: new Date().toISOString()
      }

      // Guardar en localStorage
      saveGuestsToStorage(allGuests)
      
      toast.success('Invitado eliminado correctamente')
      fetchDashboardData(true)
      fetchDeletedGuests()
    } catch (error) {
      console.error('Error deleting guest:', error)
      toast.error('Error al eliminar invitado')
    }
  }

  const handleRestoreGuest = async (guestId: string) => {
    try {
      // Cargar todos los invitados
      const allGuests = loadGuestsFromStorage()
      const guestIndex = allGuests.findIndex(g => g.id === guestId)
      
      if (guestIndex === -1) {
        toast.error('Invitado no encontrado')
        return
      }

      // Restaurar
      allGuests[guestIndex] = {
        ...allGuests[guestIndex],
        deleted: false,
        deletedAt: null
      }

      // Guardar en localStorage
      saveGuestsToStorage(allGuests)
      
      toast.success('Invitado restaurado correctamente')
      fetchDashboardData(true)
      fetchDeletedGuests()
    } catch (error) {
      console.error('Error restoring guest:', error)
      toast.error('Error al restaurar invitado')
    }
  }

  const handleGuestSaved = (updatedGuest: Guest) => {
    try {
      // Cargar todos los invitados
      const allGuests = loadGuestsFromStorage()
      const guestIndex = allGuests.findIndex(g => g.id === updatedGuest.id)
      
      if (guestIndex === -1) {
        // Si es un nuevo invitado, agregarlo al principio
        const newGuests = [updatedGuest, ...allGuests]
        saveGuestsToStorage(newGuests)
        toast.success('Invitado agregado correctamente')
      } else {
        // Actualizar el invitado existente
        allGuests[guestIndex] = updatedGuest
        // Mover al principio si fue actualizado recientemente
        const updatedGuestItem = allGuests.splice(guestIndex, 1)[0]
        allGuests.unshift(updatedGuestItem)
        saveGuestsToStorage(allGuests)
        toast.success('Invitado actualizado correctamente')
      }
      
      fetchDashboardData(true)
    } catch (error) {
      console.error('Error saving guest:', error)
      toast.error('Error al guardar cambios')
    }
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
    
    // Filtro por mesa
    if (filter === 'with-table') {
      return guest.tableNumber !== null && guest.tableNumber !== undefined
    }
    if (filter === 'without-table') {
      return guest.tableNumber === null || guest.tableNumber === undefined
    }

    return true
  }).sort((a, b) => {
    // Si el filtro es 'with-table', ordenar por número de mesa
    if (filter === 'with-table') {
      const tableA = a.tableNumber || 0
      const tableB = b.tableNumber || 0
      return tableA - tableB // Mesa más chica primero
    }
    // Para otros filtros, mantener el orden por fecha (más recientes primero)
    const dateA = new Date(a.confirmedAt).getTime()
    const dateB = new Date(b.confirmedAt).getTime()
    return dateB - dateA
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
                <div className="flex items-center gap-4">
                  <h2
                    className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Lista de Invitados ({filteredGuests.length})
                  </h2>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowTrash(true)
                      fetchDeletedGuests()
                    }}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Papelera ({deletedGuests.length})
                  </Button>
                </div>
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
                  <Button
                    variant={filter !== 'all' ? 'secondary' : 'primary'}
                    onClick={() => setShowFilterModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {filter !== 'all' && (
                      <span className="ml-1 px-2 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                        {filter === 'with-dietary' && 'Con Requerimientos'}
                        {filter === 'with-table' && 'Con Mesa'}
                        {filter === 'without-table' && 'Sin Mesa'}
                      </span>
                    )}
                  </Button>
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
                      className={`p-4 rounded-lg border-2 relative ${
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3
                              className={`font-semibold text-lg ${
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
                            {guest.tableNumber && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500 text-white flex items-center gap-1">
                                <Table className="h-3 w-3" />
                                Mesa {guest.tableNumber}
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
                        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto sm:ml-4 justify-end sm:justify-start">
                          <Button
                            onClick={() => handleEditGuest(guest)}
                            className="!bg-purple-600 hover:!bg-purple-700 !text-white !border-0 flex items-center justify-center gap-2 px-4 py-2 min-w-[100px] rounded-xl font-medium shadow-md"
                            title="Editar invitado"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="!bg-red-600 hover:!bg-red-700 !text-white !border-0 flex items-center justify-center gap-2 px-4 py-2 min-w-[100px] rounded-xl font-medium shadow-md"
                            title="Eliminar invitado"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Eliminar</span>
                          </Button>
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

        <EditGuestModal
          open={showEditGuestModal}
          onClose={() => {
            setShowEditGuestModal(false)
            setSelectedGuest(null)
          }}
          guest={selectedGuest}
          onSave={handleGuestSaved}
        />

        {/* Modal de Filtros */}
        <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
          <DialogContent className={`sm:max-w-[500px] ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Filtrar Invitados
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3 mt-4">
              <Button
                variant={filter === 'all' ? 'primary' : 'secondary'}
                onClick={() => {
                  setFilter('all')
                  setShowFilterModal(false)
                }}
                className="w-full flex items-center justify-start gap-2"
              >
                <Filter className="h-4 w-4" />
                Todos
              </Button>
              
              <Button
                variant={filter === 'with-dietary' ? 'primary' : 'secondary'}
                onClick={() => {
                  setFilter('with-dietary')
                  setShowFilterModal(false)
                }}
                className="w-full flex items-center justify-start gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Con Requerimientos Alimentarios
              </Button>
              
              <Button
                variant={filter === 'with-table' ? 'primary' : 'secondary'}
                onClick={() => {
                  setFilter('with-table')
                  setShowFilterModal(false)
                }}
                className="w-full flex items-center justify-start gap-2"
              >
                <Table className="h-4 w-4" />
                Con Mesa (ordenados por número)
              </Button>
              
              <Button
                variant={filter === 'without-table' ? 'primary' : 'secondary'}
                onClick={() => {
                  setFilter('without-table')
                  setShowFilterModal(false)
                }}
                className="w-full flex items-center justify-start gap-2"
              >
                <Table className="h-4 w-4" />
                Sin Mesa
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Papelera */}
        <Dialog open={showTrash} onOpenChange={setShowTrash}>
          <DialogContent className={`sm:max-w-[700px] max-h-[80vh] overflow-y-auto ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Trash2 className="h-5 w-5" />
                Papelera ({deletedGuests.length})
              </DialogTitle>
            </DialogHeader>

            {deletedGuests.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No hay invitados eliminados
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {deletedGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className={`p-4 rounded-lg border-2 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 opacity-75'
                        : 'bg-gray-50 border-gray-200 opacity-75'
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
                          {guest.tableNumber && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500 text-white flex items-center gap-1">
                              <Table className="h-3 w-3" />
                              Mesa {guest.tableNumber}
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
                          {guest.deletedAt && (
                            <span
                              className={
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }
                            >
                              Eliminado: {new Date(guest.deletedAt).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            handleRestoreGuest(guest.id)
                            fetchDeletedGuests()
                          }}
                          className="flex items-center gap-2 px-4 py-2 min-w-[100px] text-white bg-green-600 hover:bg-green-700 border-0"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restaurar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
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

