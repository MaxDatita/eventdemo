'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  GripVertical,
  LayoutGrid,
  List,
  Lock,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { isBackgroundDark } from '@/config/theme'
import {
  EXPENSE_CATEGORIES,
  type AdminExpenseRecord,
  type ExpenseCategory,
  type ExpenseStatus,
  type ExpensesConfig,
} from '@/lib/event-expenses'

type AdminInvitado = {
  id: string
  nombre: string
  acompanantes: number | null
  mesa: string | null
  ingreso: boolean
  fechaHoraIngreso: string | null
  rowNumber: number
}

type AdminView = 'list' | 'tables' | 'expenses'

type MesaGroup = {
  key: string
  label: string
  invitados: AdminInvitado[]
  totalPersonas: number
}

type ExpenseForm = {
  concepto: string
  categoria: ExpenseCategory
  monto: string
  medioPago: string
  fecha: string
  proveedor: string
  notas: string
  estado: ExpenseStatus
}

const UNASSIGNED_MESA_KEY = '__UNASSIGNED__'
const EMPTY_EXPENSE_FORM: ExpenseForm = {
  concepto: '',
  categoria: EXPENSE_CATEGORIES[0],
  monto: '',
  medioPago: '',
  fecha: '',
  proveedor: '',
  notas: '',
  estado: 'pendiente' as ExpenseStatus,
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [search, setSearch] = useState('')
  const [expenseSearch, setExpenseSearch] = useState('')
  const [activeView, setActiveView] = useState<AdminView>('list')
  const [invitados, setInvitados] = useState<AdminInvitado[]>([])
  const [gastos, setGastos] = useState<AdminExpenseRecord[]>([])
  const [expensesConfig, setExpensesConfig] = useState<ExpensesConfig>({
    useBudget: false,
    budgetTotal: null,
  })
  const [editingRowNumber, setEditingRowNumber] = useState<number | null>(null)
  const [movingRowNumber, setMovingRowNumber] = useState<number | null>(null)
  const [editingExpenseRowNumber, setEditingExpenseRowNumber] = useState<number | null>(null)
  const [moveMesaValue, setMoveMesaValue] = useState('')
  const [draggingGuest, setDraggingGuest] = useState<AdminInvitado | null>(null)
  const [dragOverMesaKey, setDragOverMesaKey] = useState<string | null>(null)
  const [desktopDragEnabled, setDesktopDragEnabled] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: '',
    acompanantes: '',
    mesa: '',
  })
  const [form, setForm] = useState({
    nombre: '',
    acompanantes: '',
    mesa: '',
  })
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM)

  const backgroundIsDark = isBackgroundDark()

  const resetAdminSession = (message: string) => {
    setIsAuthenticated(false)
    setAuthError(message)
    setInvitados([])
    setGastos([])
  }

  const loadInvitados = useCallback(async () => {
    const response = await fetch('/api/admin/invitados', { cache: 'no-store' })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || 'No se pudo cargar la lista')
    }

    setInvitados(data.invitados || [])
  }, [])

  const loadGastos = useCallback(async () => {
    const response = await fetch('/api/admin/gastos', { cache: 'no-store' })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || 'No se pudo cargar la lista de gastos')
    }

    setGastos(data.gastos || [])
  }, [])

  const loadExpensesConfig = useCallback(async () => {
    const response = await fetch('/api/admin/gastos/config', { cache: 'no-store' })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || 'No se pudo cargar la configuración de gastos')
    }

    setExpensesConfig(
      data.config || {
        useBudget: false,
        budgetTotal: null,
      }
    )
  }, [])

  const loadAdminData = useCallback(async () => {
    await Promise.all([loadInvitados(), loadGastos(), loadExpensesConfig()])
  }, [loadExpensesConfig, loadGastos, loadInvitados])

  useEffect(() => {
    let alive = true

    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/auth', { cache: 'no-store' })
        if (!alive) return
        setIsAuthenticated(response.ok)
      } catch {
        if (!alive) return
        setIsAuthenticated(false)
      } finally {
        if (alive) {
          setIsAuthLoading(false)
        }
      }
    }

    void checkSession()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const update = () => setDesktopDragEnabled(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => {
      mediaQuery.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    let alive = true

    const run = async (showLoading = false) => {
      try {
        if (showLoading) setIsLoading(true)
        await loadAdminData()
        if (!alive) return
        setError('')
      } catch (err) {
        if (!alive) return
        const message = err instanceof Error ? err.message : 'Error cargando invitados'
        if (message.toLowerCase().includes('no autenticado')) {
          resetAdminSession('Tu sesión expiró. Ingresá la contraseña nuevamente.')
          return
        }
        setError(message)
      } finally {
        if (alive && showLoading) {
          setIsLoading(false)
        }
      }
    }

    void run(true)

    return () => {
      alive = false
    }
  }, [isAuthenticated, loadAdminData])

  const handleLogin = async () => {
    try {
      setAuthError('')
      setSuccessMessage('')
      const trimmed = password.trim()
      if (!trimmed) {
        setAuthError('Ingresá una contraseña')
        return
      }

      const response = await fetch('/api/admin/auth', {
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
      setError('')
      setIsLoading(true)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => null)
    setIsAuthenticated(false)
    setInvitados([])
    setPassword('')
    setAuthError('')
    setSuccessMessage('')
    setError('')
  }

  const handleCreateInvitado = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      setSuccessMessage('')

      const nombre = form.nombre.trim()
      if (!nombre) {
        setError('Ingresá el nombre del invitado')
        return
      }

      const body = {
        nombre,
        acompanantes: form.acompanantes === '' ? null : Number(form.acompanantes),
        mesa: form.mesa.trim() || null,
      }

      const response = await fetch('/api/admin/invitados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          resetAdminSession('Tu sesión expiró. Ingresá la contraseña nuevamente.')
          return
        }
        throw new Error(data?.error || 'No se pudo guardar el invitado')
      }

      setForm({
        nombre: '',
        acompanantes: '',
        mesa: '',
      })
      setSuccessMessage(`Invitado agregado correctamente. ID asignado: ${data.invitado.id}.`)
      setInvitados((prev) => [data.invitado, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el invitado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateGuestMesa = async (rowNumber: number, mesa: string | null) => {
    const guest = invitados.find((item) => item.rowNumber === rowNumber)
    if (!guest) return false

    const response = await fetch('/api/admin/invitados', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rowNumber,
        nombre: guest.nombre,
        acompanantes: guest.acompanantes,
        mesa,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        resetAdminSession('Tu sesión expiró. Ingresá la contraseña nuevamente.')
        return false
      }
      throw new Error(data?.error || 'No se pudo mover el invitado')
    }

    setInvitados((prev) =>
      prev.map((item) => (item.rowNumber === rowNumber ? data.invitado : item))
    )
    return true
  }

  const startEditing = (guest: AdminInvitado) => {
    setActiveView('list')
    setEditingRowNumber(guest.rowNumber)
    setEditForm({
      nombre: guest.nombre,
      acompanantes: guest.acompanantes === null ? '' : String(guest.acompanantes),
      mesa: guest.mesa || '',
    })
    setError('')
    setSuccessMessage('')
  }

  const cancelEditing = () => {
    setEditingRowNumber(null)
    setEditForm({
      nombre: '',
      acompanantes: '',
      mesa: '',
    })
  }

  const handleUpdateInvitado = async (rowNumber: number) => {
    try {
      setError('')
      setSuccessMessage('')

      const response = await fetch('/api/admin/invitados', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rowNumber,
          nombre: editForm.nombre.trim(),
          acompanantes: editForm.acompanantes === '' ? null : Number(editForm.acompanantes),
          mesa: editForm.mesa.trim() || null,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          resetAdminSession('Tu sesión expiró. Ingresá la contraseña nuevamente.')
          return
        }
        throw new Error(data?.error || 'No se pudo actualizar el invitado')
      }

      setInvitados((prev) =>
        prev.map((guest) => (guest.rowNumber === rowNumber ? data.invitado : guest))
      )
      setSuccessMessage('Invitado actualizado correctamente.')
      cancelEditing()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el invitado')
    }
  }

  const handleDeleteInvitado = async (guest: AdminInvitado) => {
    const confirmed = window.confirm(`¿Eliminar a ${guest.nombre} de la lista?`)
    if (!confirmed) return

    try {
      setError('')
      setSuccessMessage('')

      const response = await fetch('/api/admin/invitados', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rowNumber: guest.rowNumber }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          resetAdminSession('Tu sesión expiró. Ingresá la contraseña nuevamente.')
          return
        }
        throw new Error(data?.error || 'No se pudo eliminar el invitado')
      }

      setInvitados((prev) => prev.filter((item) => item.rowNumber !== guest.rowNumber))
      if (editingRowNumber === guest.rowNumber) {
        cancelEditing()
      }
      setSuccessMessage('Invitado eliminado correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el invitado')
    }
  }

  const startMovingGuest = (guest: AdminInvitado) => {
    setMovingRowNumber(guest.rowNumber)
    setMoveMesaValue(guest.mesa || '')
    setError('')
    setSuccessMessage('')
  }

  const cancelMovingGuest = () => {
    setMovingRowNumber(null)
    setMoveMesaValue('')
  }

  const handleMoveGuest = async (guest: AdminInvitado) => {
    try {
      setError('')
      setSuccessMessage('')
      const updated = await updateGuestMesa(guest.rowNumber, moveMesaValue.trim() || null)
      if (!updated) return
      setSuccessMessage(
        moveMesaValue.trim()
          ? `Invitado movido a ${moveMesaValue.trim()}.`
          : 'Invitado movido a Sin asignar.'
      )
      cancelMovingGuest()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al mover el invitado')
    }
  }

  const handleDragStart = (guest: AdminInvitado) => {
    if (!desktopDragEnabled) return
    setDraggingGuest(guest)
    setDragOverMesaKey(null)
  }

  const handleDropOnMesa = async (mesaKey: string) => {
    if (!draggingGuest) return

    try {
      setError('')
      setSuccessMessage('')
      const nextMesa = mesaKey === UNASSIGNED_MESA_KEY ? null : mesaKey
      const updated = await updateGuestMesa(draggingGuest.rowNumber, nextMesa)
      if (!updated) return
      setSuccessMessage(
        nextMesa ? `${draggingGuest.nombre} movido a ${nextMesa}.` : `${draggingGuest.nombre} movido a Sin asignar.`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al mover el invitado')
    } finally {
      setDraggingGuest(null)
      setDragOverMesaKey(null)
    }
  }

  const filteredInvitados = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    if (!normalizedSearch) return invitados

    return invitados.filter((guest) =>
      guest.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(normalizedSearch)
    )
  }, [invitados, search])

  const filteredGastos = useMemo(() => {
    const normalizedSearch = expenseSearch
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    if (!normalizedSearch) return gastos

    return gastos.filter((expense) =>
      [expense.concepto, expense.categoria, expense.proveedor || '', expense.medioPago || '']
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(normalizedSearch)
    )
  }, [expenseSearch, gastos])

  const expenseSummary = useMemo(() => {
    const total = gastos.reduce((sum, expense) => sum + expense.monto, 0)
    const pagado = gastos
      .filter((expense) => expense.estado === 'pagado')
      .reduce((sum, expense) => sum + expense.monto, 0)
    const pendiente = gastos
      .filter((expense) => expense.estado === 'pendiente')
      .reduce((sum, expense) => sum + expense.monto, 0)
    const categories = gastos.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.monto
      return acc
    }, {})

    const topCategory =
      Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
      total,
      pagado,
      pendiente,
      topCategory,
      budgetRemaining:
        expensesConfig.useBudget && expensesConfig.budgetTotal !== null
          ? expensesConfig.budgetTotal - total
          : null,
      budgetUsage:
        expensesConfig.useBudget && expensesConfig.budgetTotal
          ? (total / expensesConfig.budgetTotal) * 100
          : null,
    }
  }, [gastos, expensesConfig])

  const expenseTips = useMemo(() => {
    const tips: string[] = []

    if (!expensesConfig.useBudget || expensesConfig.budgetTotal === null) {
      tips.push('Definí un presupuesto total para medir desvíos y tomar decisiones con tiempo.')
    }

    if (expenseSummary.pendiente > 0) {
      tips.push(`Tenés ${expenseSummary.pendiente.toLocaleString('es-AR')} pendientes de pago para revisar.`)
    }

    if (expenseSummary.topCategory) {
      tips.push(`La categoría con mayor peso hoy es ${expenseSummary.topCategory}.`)
    }

    if (expensesConfig.useBudget && expenseSummary.budgetUsage !== null) {
      if (expenseSummary.budgetUsage >= 100) {
        tips.push('El gasto total ya superó el presupuesto definido.')
      } else if (expenseSummary.budgetUsage >= 80) {
        tips.push('El gasto total ya pasó el 80% del presupuesto. Conviene revisar prioridades.')
      }
    }

    if (gastos.length === 0) {
      tips.push('Empezá cargando los gastos grandes primero: salón, catering y música.')
    }

    return tips.slice(0, 5)
  }, [expenseSummary, expensesConfig, gastos.length])

  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    if (expenseTips.length <= 1) return

    const interval = setInterval(() => {
      setTipIndex((current) => (current + 1) % expenseTips.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [expenseTips])

  useEffect(() => {
    setTipIndex(0)
  }, [expenseTips.length])

  const handleExpenseSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      setSuccessMessage('')

      const response = await fetch('/api/admin/gastos', {
        method: editingExpenseRowNumber === null ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rowNumber: editingExpenseRowNumber,
          ...expenseForm,
          monto: Number(expenseForm.monto),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          resetAdminSession('Tu sesión expiró. Ingresá la contraseña nuevamente.')
          return
        }
        throw new Error(data?.error || 'No se pudo guardar el gasto')
      }

      if (editingExpenseRowNumber === null) {
        setGastos((prev) => [data.gasto, ...prev])
        setSuccessMessage('Gasto agregado correctamente.')
      } else {
        setGastos((prev) =>
          prev.map((expense) =>
            expense.rowNumber === editingExpenseRowNumber ? data.gasto : expense
          )
        )
        setSuccessMessage('Gasto actualizado correctamente.')
      }

      setEditingExpenseRowNumber(null)
      setExpenseForm(EMPTY_EXPENSE_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditingExpense = (expense: AdminExpenseRecord) => {
    setActiveView('expenses')
    setEditingExpenseRowNumber(expense.rowNumber)
    setExpenseForm({
      concepto: expense.concepto,
      categoria: expense.categoria,
      monto: String(expense.monto),
      medioPago: expense.medioPago || '',
      fecha: expense.fecha || '',
      proveedor: expense.proveedor || '',
      notas: expense.notas || '',
      estado: expense.estado,
    })
    setError('')
    setSuccessMessage('')
  }

  const cancelEditingExpense = () => {
    setEditingExpenseRowNumber(null)
    setExpenseForm(EMPTY_EXPENSE_FORM)
  }

  const handleDeleteExpense = async (expense: AdminExpenseRecord) => {
    const confirmed = window.confirm(`¿Eliminar el gasto "${expense.concepto}"?`)
    if (!confirmed) return

    try {
      setError('')
      setSuccessMessage('')
      const response = await fetch('/api/admin/gastos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rowNumber: expense.rowNumber }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          resetAdminSession('Tu sesión expiró. Ingresá la contraseña nuevamente.')
          return
        }
        throw new Error(data?.error || 'No se pudo eliminar el gasto')
      }

      setGastos((prev) => prev.filter((item) => item.rowNumber !== expense.rowNumber))
      setSuccessMessage('Gasto eliminado correctamente.')
      if (editingExpenseRowNumber === expense.rowNumber) {
        cancelEditingExpense()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el gasto')
    }
  }

  const handleBudgetConfigSave = async () => {
    try {
      setError('')
      setSuccessMessage('')
      const response = await fetch('/api/admin/gastos/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expensesConfig),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          resetAdminSession('Tu sesión expiró. Ingresá la contraseña nuevamente.')
          return
        }
        throw new Error(data?.error || 'No se pudo guardar la configuración')
      }

      setExpensesConfig(data.config)
      setSuccessMessage('Configuración de presupuesto guardada.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la configuración')
    }
  }

  const mesaGroups = useMemo<MesaGroup[]>(() => {
    const groups = new Map<string, AdminInvitado[]>()

    filteredInvitados.forEach((guest) => {
      const key = guest.mesa?.trim() || UNASSIGNED_MESA_KEY
      const current = groups.get(key) || []
      current.push(guest)
      groups.set(key, current)
    })

    return Array.from(groups.entries())
      .map(([key, guests]) => ({
        key,
        label: key === UNASSIGNED_MESA_KEY ? 'Sin asignar' : key,
        invitados: guests.sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base', numeric: true })
        ),
        totalPersonas: guests.reduce((acc, guest) => acc + 1 + (guest.acompanantes ?? 0), 0),
      }))
      .sort((a, b) => {
        if (a.key === UNASSIGNED_MESA_KEY) return 1
        if (b.key === UNASSIGNED_MESA_KEY) return -1
        return a.label.localeCompare(b.label, 'es', { sensitivity: 'base', numeric: true })
      })
  }, [filteredInvitados])

  if (isAuthLoading) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white border-2 border-[#FFD9A8] shadow-lg p-8 text-center">
          <p className="text-gray-700">Cargando panel...</p>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen px-6 py-10 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md rounded-2xl border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] shadow-lg bg-white p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#FF914E] rounded-full flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-secondary">Administrador de Evento</h1>
            <p className="text-gray-700">
              Ingresá la contraseña para acceder al administrador de evento.
            </p>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setAuthError('')
              }}
              placeholder="Contraseña de admin"
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
            height={115}
            className="block rounded-lg object-contain"
            style={{ width: 155, height: 115 }}
          />
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="rounded-2xl border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] bg-white p-5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <h1 className="min-w-0 bg-gradient-to-r from-[#FF914E] via-[#ffb04a] to-[#FFCF6E] bg-clip-text text-3xl font-secondary font-bold text-transparent [filter:drop-shadow(0_1px_0_rgb(255_228_180_/_0.65))_drop-shadow(0_1px_0.3px_rgb(255_193_110_/_0.35))_drop-shadow(0_2px_2px_rgb(62_32_12_/_0.12))]">
                Administrador de Evento
              </h1>
              <div className="flex shrink-0 flex-nowrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    void loadAdminData().catch((err) =>
                      setError(err instanceof Error ? err.message : 'Error al refrescar')
                    )
                  }
                  className="inline-flex h-11 w-40 shrink-0 items-center justify-center whitespace-nowrap border border-[#FFD9A8] bg-white px-3 text-gray-800 hover:bg-[#FFF7E8]"
                >
                  <RefreshCw className="mr-2 h-4 w-4 shrink-0" />
                  Refrescar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex h-11 w-40 shrink-0 items-center justify-center whitespace-nowrap bg-[#FF914E] px-3 text-white hover:bg-[#ff8132]"
                >
                  <LogOut className="mr-2 h-4 w-4 shrink-0" />
                  Salir
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-700 sm:text-base">
               Administrá y lleva el control de las secciones mas importantes del evento. Invitados, Mesas, Gastos y mucho más.
            </p>

            <div className="relative flex w-full rounded-full border border-[#FFD9A8] bg-white p-1 shadow-sm">
              <div
                className={`absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-[#FFCF6E] transition-transform duration-300 ease-out ${
                  activeView === 'list'
                    ? 'translate-x-0'
                    : activeView === 'tables'
                      ? 'translate-x-full'
                      : 'translate-x-[200%]'
                }`}
              />
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  activeView === 'list' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                <List className="h-4 w-4 shrink-0" />
                <span className="truncate">Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('tables')}
                className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  activeView === 'tables' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span className="truncate">Mesas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('expenses')}
                className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  activeView === 'expenses' ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                <Coins className="h-4 w-4 shrink-0" />
                <span className="truncate">Gastos</span>
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="rounded-2xl border-2 border-t-4 border-[#FF914E] border-t-[#FFCF6E] bg-white p-5 shadow-lg">
            {activeView === 'expenses' ? (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="flex items-center gap-2 text-xl font-secondary font-semibold text-gray-900">
                    <Coins className="h-5 w-5 text-[#FF914E]" />
                    {editingExpenseRowNumber === null ? 'Agregar gasto' : 'Editar gasto'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Registrá gastos del evento y analizalos después por categoría y presupuesto.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleExpenseSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Concepto</label>
                    <Input
                      value={expenseForm.concepto}
                      onChange={(e) =>
                        setExpenseForm((prev) => ({ ...prev, concepto: e.target.value }))
                      }
                      placeholder="Ej: Seña del DJ"
                      className="bg-white text-gray-900 border-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Categoría</label>
                      <select
                        value={expenseForm.categoria}
                        onChange={(e) =>
                          setExpenseForm((prev) => ({
                            ...prev,
                            categoria: e.target.value as (typeof EXPENSE_CATEGORIES)[number],
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      >
                        {EXPENSE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Monto</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseForm.monto}
                        onChange={(e) =>
                          setExpenseForm((prev) => ({ ...prev, monto: e.target.value }))
                        }
                        placeholder="0"
                        className="bg-white text-gray-900 border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Medio de pago</label>
                      <Input
                        value={expenseForm.medioPago}
                        onChange={(e) =>
                          setExpenseForm((prev) => ({ ...prev, medioPago: e.target.value }))
                        }
                        placeholder="Transferencia, efectivo..."
                        className="bg-white text-gray-900 border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Fecha</label>
                      <Input
                        value={expenseForm.fecha}
                        onChange={(e) =>
                          setExpenseForm((prev) => ({ ...prev, fecha: e.target.value }))
                        }
                        placeholder="Ej: 09/04/2026"
                        className="bg-white text-gray-900 border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Proveedor</label>
                      <Input
                        value={expenseForm.proveedor}
                        onChange={(e) =>
                          setExpenseForm((prev) => ({ ...prev, proveedor: e.target.value }))
                        }
                        placeholder="Nombre del proveedor"
                        className="bg-white text-gray-900 border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Estado</label>
                      <select
                        value={expenseForm.estado}
                        onChange={(e) =>
                          setExpenseForm((prev) => ({
                            ...prev,
                            estado: e.target.value as ExpenseStatus,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Notas</label>
                    <textarea
                      value={expenseForm.notas}
                      onChange={(e) =>
                        setExpenseForm((prev) => ({ ...prev, notas: e.target.value }))
                      }
                      rows={3}
                      placeholder="Detalle opcional"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-[#FFCF6E] hover:bg-[#FFCF6E]/90 text-gray-800 border-2 border-gray-700"
                    >
                      {isSubmitting
                        ? 'Guardando...'
                        : editingExpenseRowNumber === null
                          ? 'Guardar gasto'
                          : 'Actualizar gasto'}
                    </Button>
                    {editingExpenseRowNumber !== null && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={cancelEditingExpense}
                        className="border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>

                <div className="rounded-2xl border border-[#FFE4BC] bg-[#FFF9F1] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Presupuesto</h3>
                      <p className="text-xs text-gray-600">
                        Activá esta opción si querés comparar el gasto contra un objetivo total.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpensesConfig((prev) => ({ ...prev, useBudget: !prev.useBudget }))
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        expensesConfig.useBudget ? 'bg-[#FF914E]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          expensesConfig.useBudget ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={expensesConfig.budgetTotal ?? ''}
                      disabled={!expensesConfig.useBudget}
                      onChange={(e) =>
                        setExpensesConfig((prev) => ({
                          ...prev,
                          budgetTotal: e.target.value === '' ? null : Number(e.target.value),
                        }))
                      }
                      placeholder="Presupuesto total"
                      className="bg-white text-gray-900 border-gray-300"
                    />
                    <Button
                      type="button"
                      onClick={() => void handleBudgetConfigSave()}
                      className="bg-[#FF914E] hover:bg-[#ff8132] text-white"
                    >
                      Guardar presupuesto
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleCreateInvitado}>
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-xl font-secondary font-semibold text-gray-900">
                  <Plus className="h-5 w-5 text-[#FF914E]" />
                  Agregar invitado
                </h2>
                <p className="text-sm text-gray-600">
                  Solo completá nombre. Acompañantes y mesa son opcionales.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Pedro García"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Acompañantes</label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={form.acompanantes}
                    onChange={(e) => setForm((prev) => ({ ...prev, acompanantes: e.target.value }))}
                    placeholder="0"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mesa</label>
                  <Input
                    value={form.mesa}
                    onChange={(e) => setForm((prev) => ({ ...prev, mesa: e.target.value }))}
                    placeholder="Ej: Mesa 8"
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#FFCF6E] hover:bg-[#FFCF6E]/90 text-gray-800 border-2 border-gray-700"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar en Google Sheets'}
              </Button>

              {successMessage && (
                <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {successMessage}
                </p>
              )}

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              </form>
            )}
          </Card>

          <Card className="rounded-2xl border-2 border-[#FFD9A8] bg-white p-5 shadow-lg">
            {activeView === 'expenses' ? (
              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-[#FFD9A8] bg-gradient-to-r from-[#FFF7E8] via-white to-[#FFF1D6]">
                  <div className="flex items-center gap-2 border-b border-[#FFE4BC] px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-[#FF914E]" />
                    <p className="text-sm font-medium text-gray-800">Sugerencias del panel</p>
                  </div>
                  <div className="relative min-h-[84px] px-4 py-4">
                    {expenseTips.map((tip, index) => (
                      <div
                        key={`${tip}-${index}`}
                        className={`absolute inset-0 flex items-center px-4 transition-all duration-500 ${
                          tipIndex === index
                            ? 'translate-y-0 opacity-100'
                            : 'translate-y-3 opacity-0 pointer-events-none'
                        }`}
                      >
                        <p className="text-sm text-gray-700 sm:text-base">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-[#FFE4BC] bg-[#FFFDF9] p-4">
                    <div className="mb-2 flex items-center gap-2 text-gray-500">
                      <Coins className="h-4 w-4" />
                      <span className="text-sm">Total gastado</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${expenseSummary.total.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-green-700">
                      <ArrowUpCircle className="h-4 w-4" />
                      <span className="text-sm">Pagado</span>
                    </div>
                    <p className="text-2xl font-semibold text-green-800">
                      ${expenseSummary.pagado.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-amber-700">
                      <ArrowDownCircle className="h-4 w-4" />
                      <span className="text-sm">Pendiente</span>
                    </div>
                    <p className="text-2xl font-semibold text-amber-800">
                      ${expenseSummary.pendiente.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#FFD9A8] bg-[#FFF7E8] p-4">
                    <div className="mb-2 flex items-center gap-2 text-gray-600">
                      <Coins className="h-4 w-4" />
                      <span className="text-sm">
                        {expensesConfig.useBudget ? 'Restante' : 'Presupuesto'}
                      </span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {expensesConfig.useBudget && expenseSummary.budgetRemaining !== null
                        ? `$${expenseSummary.budgetRemaining.toLocaleString('es-AR')}`
                        : 'No definido'}
                    </p>
                    {expensesConfig.useBudget && expenseSummary.budgetUsage !== null && (
                      <p className="mt-1 text-xs text-gray-600">
                        {expenseSummary.budgetUsage.toFixed(1)}% del presupuesto usado
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-secondary font-semibold text-gray-900">
                      Gastos registrados
                    </h2>
                    <p className="text-sm text-gray-600">
                      {gastos.length} gasto{gastos.length === 1 ? '' : 's'} cargado{gastos.length === 1 ? '' : 's'}.
                    </p>
                  </div>
                  <Input
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="Buscar gasto"
                    className="w-full sm:max-w-xs bg-white text-gray-900 border-gray-300"
                  />
                </div>

                {isLoading ? (
                  <div className="rounded-xl border border-[#FFD9A8] bg-[#FFF7E8] px-4 py-6 text-center text-gray-700">
                    Cargando gastos...
                  </div>
                ) : filteredGastos.length === 0 ? (
                  <div className="rounded-xl border border-[#FFD9A8] bg-[#FFF7E8] px-4 py-6 text-center text-gray-700">
                    No hay gastos para mostrar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGastos.map((expense) => (
                      <div
                        key={`${expense.rowNumber}-${expense.id}`}
                        className="rounded-xl border border-[#FFE4BC] bg-[#FFFDF9] p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-gray-900">{expense.concepto}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span>ID: {expense.id}</span>
                              <span>Categoría: {expense.categoria}</span>
                              <span>Proveedor: {expense.proveedor || 'sin proveedor'}</span>
                              <span>Fecha: {expense.fecha || 'sin fecha'}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span>Monto: ${expense.monto.toLocaleString('es-AR')}</span>
                              <span>Medio de pago: {expense.medioPago || 'sin definir'}</span>
                            </div>
                            {expense.notas && (
                              <p className="text-sm text-gray-600">{expense.notas}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-start gap-2 lg:items-end">
                            <span
                              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                expense.estado === 'pagado'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {expense.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => startEditingExpense(expense)}
                                className="border border-[#FFD9A8] bg-white text-gray-800 hover:bg-[#FFF7E8]"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void handleDeleteExpense(expense)}
                                className="border border-red-200 bg-white text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-xl font-secondary font-semibold text-gray-900">
                      <Users className="h-5 w-5 text-[#FF914E]" />
                      Invitados cargados
                    </h2>
                    <p className="text-sm text-gray-600">
                      {invitados.length} invitado{invitados.length === 1 ? '' : 's'} en la hoja.
                    </p>
                  </div>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre"
                    className="w-full sm:max-w-xs bg-white text-gray-900 border-gray-300"
                  />
                </div>

                {isLoading ? (
              <div className="rounded-xl border border-[#FFD9A8] bg-[#FFF7E8] px-4 py-6 text-center text-gray-700">
                Cargando invitados...
              </div>
            ) : filteredInvitados.length === 0 ? (
              <div className="rounded-xl border border-[#FFD9A8] bg-[#FFF7E8] px-4 py-6 text-center text-gray-700">
                No hay invitados para mostrar.
              </div>
            ) : activeView === 'list' ? (
              <div className="space-y-3">
                {filteredInvitados.map((guest) => (
                  <div
                    key={`${guest.rowNumber}-${guest.id || guest.nombre}`}
                    className="rounded-xl border border-[#FFE4BC] bg-[#FFFDF9] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        {editingRowNumber === guest.rowNumber ? (
                          <div className="space-y-3">
                            <Input
                              value={editForm.nombre}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, nombre: e.target.value }))
                              }
                              className="bg-white text-gray-900 border-gray-300"
                              placeholder="Nombre"
                            />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                value={editForm.acompanantes}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    acompanantes: e.target.value,
                                  }))
                                }
                                className="bg-white text-gray-900 border-gray-300"
                                placeholder="Acompañantes"
                              />
                              <Input
                                value={editForm.mesa}
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, mesa: e.target.value }))
                                }
                                className="bg-white text-gray-900 border-gray-300"
                                placeholder="Mesa"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-base font-semibold text-gray-900">{guest.nombre}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                              <span>ID: {guest.id}</span>
                              <span>Acompañantes: {guest.acompanantes ?? 0}</span>
                              <span>Mesa: {guest.mesa || 'sin asignar'}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            guest.ingreso
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {guest.ingreso ? 'Ingresó' : 'Pendiente'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {editingRowNumber === guest.rowNumber ? (
                            <>
                              <Button
                                type="button"
                                onClick={() => void handleUpdateInvitado(guest.rowNumber)}
                                className="bg-[#FFCF6E] hover:bg-[#FFCF6E]/90 text-gray-800 border-2 border-gray-700"
                              >
                                Guardar
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={cancelEditing}
                                className="border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => startEditing(guest)}
                                className="border border-[#FFD9A8] bg-white text-gray-800 hover:bg-[#FFF7E8]"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void handleDeleteInvitado(guest)}
                                className="border border-red-200 bg-white text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {mesaGroups.map((mesa) => (
                  <div
                    key={mesa.key}
                    onDragOver={(event) => {
                      if (!desktopDragEnabled) return
                      event.preventDefault()
                      setDragOverMesaKey(mesa.key)
                    }}
                    onDragLeave={() => {
                      if (!desktopDragEnabled) return
                      setDragOverMesaKey((current) => (current === mesa.key ? null : current))
                    }}
                    onDrop={(event) => {
                      if (!desktopDragEnabled) return
                      event.preventDefault()
                      void handleDropOnMesa(mesa.key)
                    }}
                    className={`rounded-[28px] border-2 p-4 shadow-lg transition-all ${
                      mesa.key === UNASSIGNED_MESA_KEY
                        ? 'border-dashed border-[#FFD9A8] bg-white'
                        : 'border-[#FFE4BC] bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF4E5]'
                    } ${dragOverMesaKey === mesa.key ? 'scale-[1.01] border-[#FF914E] shadow-xl' : ''}`}
                  >
                    <div className="mb-4 text-center">
                      <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#FFD9A8] bg-[#FFF7E8] text-center">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Mesa</p>
                          <p className="font-secondary text-lg font-bold text-gray-900">
                            {mesa.label}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {mesa.invitados.length} invitado{mesa.invitados.length === 1 ? '' : 's'} · {mesa.totalPersonas} persona{mesa.totalPersonas === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {mesa.invitados.map((guest) => (
                        <div
                          key={guest.rowNumber}
                          draggable={desktopDragEnabled}
                          onDragStart={() => handleDragStart(guest)}
                          onDragEnd={() => {
                            setDraggingGuest(null)
                            setDragOverMesaKey(null)
                          }}
                          className={`rounded-2xl border border-[#FFE4BC] bg-white p-3 ${
                            desktopDragEnabled ? 'cursor-grab active:cursor-grabbing' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{guest.nombre}</p>
                              <p className="text-xs text-gray-600">
                                ID {guest.id} · Acompañantes {guest.acompanantes ?? 0}
                              </p>
                            </div>
                            {desktopDragEnabled && (
                              <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
                            )}
                          </div>

                          {movingRowNumber === guest.rowNumber ? (
                            <div className="mt-3 space-y-2">
                              <Input
                                value={moveMesaValue}
                                onChange={(e) => setMoveMesaValue(e.target.value)}
                                placeholder="Nueva mesa o vacío para sin asignar"
                                className="bg-white text-gray-900 border-gray-300"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  onClick={() => void handleMoveGuest(guest)}
                                  className="bg-[#FFCF6E] hover:bg-[#FFCF6E]/90 text-gray-800 border-2 border-gray-700"
                                >
                                  Guardar mesa
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={cancelMovingGuest}
                                  className="border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => startMovingGuest(guest)}
                                className="border border-[#FFD9A8] bg-white text-gray-800 hover:bg-[#FFF7E8]"
                              >
                                Mover
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => startEditing(guest)}
                                className="border border-[#FFD9A8] bg-white text-gray-800 hover:bg-[#FFF7E8]"
                              >
                                Editar
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
