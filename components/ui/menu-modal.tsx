'use client'

import { useState, type ReactNode } from 'react'
import { Button } from "./button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog"
import { UtensilsCrossed } from 'lucide-react'
import { theme } from '@/config/theme'
import { useDemoDates } from '@/contexts/DemoContext'

// --- Modo con precios (venta) ---
interface MenuItem {
  name: string
  price: number
  details?: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

interface MenuData {
  bebidas?: {
    alcoholicas: MenuSection
    sinAlcohol: MenuSection
  }
  comidas?: {
    entrada: MenuSection
    principal: MenuSection
    postre: MenuSection
  }
}

// --- Modo informativo (sin venta: ej. casamiento) ---
interface InformativeMenuItem {
  name: string
  details?: string
  /** Etiquetas adicionales mostradas como chips (ej. "Sin TACC", "Vegano") */
  chips?: string[]
}

/** Grupo de ítems bajo "Opción 1", "Opción 2", etc. (solo visual, no seleccionable) */
interface MenuOpcion {
  items: InformativeMenuItem[]
}

interface InformativeMenuSection {
  title: string
  /** Si se define, se muestran "Opción 1", "Opción 2", "Opción 3" con sus ítems. Si no, se usa items. */
  opciones?: MenuOpcion[]
  items: InformativeMenuItem[]
}

interface AnexoSection {
  title: string
  /** Ej: "00:00" — a partir de qué hora se habilita */
  availableFrom?: string
  items: InformativeMenuItem[]
}

interface InformativeMenuData {
  /** Menú de toda la noche (entrada, principal, postre, etc.) */
  menuDeLaNoche: InformativeMenuSection[]
  /** Consumos anexos: barra de tragos, otros */
  consumosAnexos: AnexoSection[]
}

const defaultMenuData: MenuData = {
  bebidas: {
    alcoholicas: {
      title: "Bebidas con Alcohol",
      items: [
        { name: "Fernet con Coca", price: 2500 },
        { name: "Cerveza Quilmes", price: 1800 },
        { name: "Vino Tinto", price: 2000, details: "Copa" },
        { name: "Vino Blanco", price: 2000, details: "Copa" }
      ]
    },
    sinAlcohol: {
      title: "Bebidas sin Alcohol",
      items: [
        { name: "Coca Cola", price: 1200, details: "Vaso" },
        { name: "Sprite", price: 1200, details: "Vaso" },
        { name: "Agua Mineral", price: 800, details: "500ml" },
        { name: "Jugo de Naranja", price: 1000 }
      ]
    }
  },
  comidas: {
    entrada: {
      title: "Entrada",
      items: [
        { name: "Empanadas de Carne", price: 800, details: "unidad" },
        { name: "Empanadas J&Q", price: 800, details: "unidad" },
        { name: "Chips y Snacks", price: 1200, details: "porción" }
      ]
    },
    principal: {
      title: "Plato Principal",
      items: [
        { name: "Asado", price: 5500, details: "porción" },
        { name: "Choripán", price: 2500 },
        { name: "Ensaladas Variadas", price: 1800 }
      ]
    },
    postre: {
      title: "Postre",
      items: [
        { name: "Helado", price: 2000, details: "2 bochas" },
        { name: "Torta de Chocolate", price: 1800, details: "porción" },
        { name: "Frutas de Estación", price: 1500 }
      ]
    }
  }
}

const defaultInformativeMenuData: InformativeMenuData = {
  menuDeLaNoche: [
    {
      title: "Entrada",
      items: [
        { name: "Empanadas de carne y jamón & queso", chips: ["Por unidad"] },
        { name: "Bastones de muzarella con salsa" },
        { name: "Verduras grilladas con oliva y hierbas", chips: ["Vegano"] }
      ]
    },
    {
      title: "Plato principal",
      opciones: [
        {
          items: [
            { name: "Asado", details: "tira, vacío y chorizo" },
            { name: "Ensalada de rúcula, parmesano y nueces" },
            { name: "Papas noisette" }
          ]
        },
        {
          items: [
            { name: "Risotto de hongos", chips: ["Vegetariano"] },
            { name: "Pollo al limón con vegetales" },
            { name: "Ensalada César" }
          ]
        },
        {
          items: [
            { name: "Merluza con puré", chips: ["Sin TACC"] },
            { name: "Ensalada mixta" },
            { name: "Verduras al wok" }
          ]
        }
      ],
      items: []
    },
    {
      title: "Postre",
      items: [
        { name: "Mesa dulce", details: "brownies, lemon pie, frutas de estación", chips: ["Variado"] },
        { name: "Torta de bodas" }
      ]
    },
    {
      title: "Cierre de la noche",
      items: [
        { name: "Salados", details: "pizzas, empanadas, sandwiches, etc.", chips: ["A la gorra"] }
      ]
    }
  ],
  consumosAnexos: [
    {
      title: "Barra de tragos",
      availableFrom: "00:00",
      items: [
        { name: "Fernet con Coca" },
        { name: "Gancia" },
        { name: "Cerveza", details: "lata" },
        { name: "Vino tinto y blanco", details: "copa" },
        { name: "Gaseosas y agua" }
      ]
    },
    {
      title: "Café y té",
      availableFrom: "02:00",
      items: [
        { name: "Café espresso y con leche" },
        { name: "Té variados" }
      ]
    }
  ]
}

interface MenuSectionProps {
  section: MenuSection
}

const MenuSection = ({ section }: MenuSectionProps) => (
  <div className="bg-muted rounded-lg p-4">
    <h3 className="font-semibold mb-2">{section.title}</h3>
    <ul className="space-y-2">
      {section.items.map((item, index) => (
        <li key={index} className="flex justify-between items-center">
          <span>{item.name}{item.details ? ` (${item.details})` : ''}</span>
          <span className="font-semibold">${item.price}</span>
        </li>
      ))}
    </ul>
  </div>
)

const primaryColor = theme.colors?.primary ?? '#04724d'
const primaryLight = theme.colors?.primaryLight ?? '#34d399'

function MenuChip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${primaryColor}18`,
        color: primaryColor,
        border: `1px solid ${primaryColor}40`
      }}
    >
      {children}
    </span>
  )
}

function InformativeItemRow({ item, textColor }: { item: InformativeMenuItem; textColor?: string }) {
  const hasDetails = !!item.details
  const hasChips = item.chips && item.chips.length > 0
  const showChips = hasDetails || hasChips
  const color = textColor ?? '#000000'

  return (
    <li className="py-2 border-b last:border-0" style={{ borderColor: `${primaryColor}20` }}>
      <div className="font-medium" style={{ color }}>
        {item.name}
      </div>
      {showChips && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {item.details && <MenuChip>{item.details}</MenuChip>}
          {item.chips?.map((c, i) => (
            <MenuChip key={i}>{c}</MenuChip>
          ))}
        </div>
      )}
    </li>
  )
}

const InformativeSection = ({ section, isDarkMode }: { section: InformativeMenuSection; isDarkMode?: boolean }) => {
  const hasOpciones = section.opciones && section.opciones.length > 0
  const displayItems = hasOpciones ? undefined : section.items
  const textColor = isDarkMode ? '#ffffff' : '#000000'
  const cardBg = isDarkMode ? 'transparent' : 'white'

  return (
    <div
      className="rounded-xl p-4 shadow-sm border"
      style={{
        backgroundColor: cardBg,
        borderColor: `${primaryColor}40`
      }}
    >
      <h3
        className="font-semibold mb-3 text-sm uppercase tracking-wide"
        style={{ color: textColor }}
      >
        {section.title}
      </h3>

      {hasOpciones ? (
        <div className="space-y-4">
          {section.opciones!.map((opcion, idx) => (
            <div key={idx}>
              <p
                className="text-xs font-semibold mb-2 opacity-90"
                style={{ color: textColor }}
              >
                Opción {idx + 1}
              </p>
              <ul className="space-y-0 rounded-lg pl-2 border-l-2" style={{ borderColor: `${primaryLight}60` }}>
                {opcion.items.map((item, i) => (
                  <InformativeItemRow key={i} item={item} textColor={textColor} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-0">
          {displayItems?.map((item, index) => (
            <InformativeItemRow key={index} item={item} textColor={textColor} />
          ))}
        </ul>
      )}
    </div>
  )
}

const AnexoBlock = ({ anexo, isDarkMode }: { anexo: AnexoSection; isDarkMode?: boolean }) => {
  const textColor = isDarkMode ? '#ffffff' : '#000000'
  const cardBg = isDarkMode ? 'transparent' : 'white'
  return (
    <div
      className="rounded-xl p-4 shadow-sm border"
      style={{
        backgroundColor: cardBg,
        borderColor: `${primaryColor}40`
      }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: textColor }}>
          {anexo.title}
        </h3>
        {anexo.availableFrom != null && (
          <MenuChip>
            A partir de las {anexo.availableFrom}
          </MenuChip>
        )}
      </div>
      <ul className="space-y-0">
        {anexo.items.map((item, index) => (
          <InformativeItemRow key={index} item={item} textColor={textColor} />
        ))}
      </ul>
    </div>
  )
}

interface MenuModalProps {
  data?: MenuData
  /** Solo usado cuando menuModal.type === 'informative' */
  informativeData?: InformativeMenuData
  buttonText?: string
}

type MenuModalType = 'withPrices' | 'informative'

export function MenuModal({
  data = defaultMenuData,
  informativeData = defaultInformativeMenuData,
  buttonText = "Consumibles"
}: MenuModalProps) {
  const menuType: MenuModalType = (theme.menuModal?.type as MenuModalType) ?? 'withPrices'
  const isInformative = menuType === 'informative'

  const hasBebidas = !isInformative && !!data.bebidas
  const hasComidas = !isInformative && !!data.comidas
  const [selectedTab, setSelectedTab] = useState<'bebidas' | 'comidas'>(data.bebidas ? 'bebidas' : 'comidas')
  const [informativeTab, setInformativeTab] = useState<'menu' | 'anexos'>('menu')

  const { isDemoMode, isEventLive, isDarkMode, demoDates } = useDemoDates()
  const contentActivationDate = isDemoMode ? new Date(demoDates.contentActivation) : new Date(theme.dates.contentActivation)
  const isContentActive = isDemoMode ? isEventLive : (new Date() >= contentActivationDate)

  const getModalTitle = () => {
    if (isInformative) return "Menú del evento"
    if (hasBebidas && hasComidas) return "Bebidas y Comidas"
    if (hasBebidas) return "Bebidas"
    if (hasComidas) return "Comidas"
    return buttonText
  }

  const triggerLabel = isInformative ? (buttonText === "Consumibles" ? "Menú" : buttonText) : buttonText

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="invitation" className="w-full flex items-center justify-center">
          <UtensilsCrossed className="mr-2 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[425px] max-h-[500px] flex flex-col ${isDarkMode ? 'dark bg-gray-900 text-white' : ''}`}>
        <DialogHeader className="text-center">
          <DialogTitle className={`text-center mb-4 font-semibold ${isDarkMode ? 'text-white' : 'text-[var(--color-primary)]'}`}>{getModalTitle()}</DialogTitle>
        </DialogHeader>

        {isInformative ? (
          <>
            {isContentActive ? (
              <>
                <div className="flex space-x-2 mb-4">
                  <Button
                    variant="invitation"
                    className={`flex-1 ${informativeTab !== 'menu' ? 'bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/40' : ''}`}
                    onClick={() => setInformativeTab('menu')}
                  >
                    Menú de la noche
                  </Button>
                  <Button
                    variant="invitation"
                    className={`flex-1 ${informativeTab !== 'anexos' ? 'bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/40' : ''}`}
                    onClick={() => setInformativeTab('anexos')}
                  >
                    Consumos anexos
                  </Button>
                </div>
                <div className="overflow-y-auto flex-1 pr-2">
                  {informativeTab === 'menu' && (
                    <div className="space-y-4">
                      {informativeData.menuDeLaNoche.map((section, i) => (
                        <InformativeSection key={i} section={section} isDarkMode={isDarkMode} />
                      ))}
                    </div>
                  )}
                  {informativeTab === 'anexos' && (
                    <div className="space-y-4">
                      {informativeData.consumosAnexos.map((anexo, i) => (
                        <AnexoBlock key={i} anexo={anexo} isDarkMode={isDarkMode} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-center p-4">
                <p className="text-muted-foreground">
                  El menú estará disponible más cerca de la fecha del evento.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {isContentActive ? (
              <>
                {hasBebidas && hasComidas && (
                  <div className="flex space-x-2 mb-4">
                    <Button
                      variant="invitation"
                      className={`flex-1 ${selectedTab !== 'bebidas' ? 'bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/40' : ''}`}
                      onClick={() => setSelectedTab('bebidas')}
                    >
                      Bebidas
                    </Button>
                    <Button
                      variant="invitation"
                      className={`flex-1 ${selectedTab !== 'comidas' ? 'bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/40' : ''}`}
                      onClick={() => setSelectedTab('comidas')}
                    >
                      Comidas
                    </Button>
                  </div>
                )}

                <div className="overflow-y-auto flex-1 pr-2">
                  {data.bebidas && ((!hasComidas || selectedTab === 'bebidas') ? (
                    <div className="space-y-4">
                      <MenuSection section={data.bebidas.alcoholicas} />
                      <MenuSection section={data.bebidas.sinAlcohol} />
                    </div>
                  ) : null)}

                  {data.comidas && ((!hasBebidas || selectedTab === 'comidas') ? (
                    <div className="space-y-4">
                      <MenuSection section={data.comidas.entrada} />
                      <MenuSection section={data.comidas.principal} />
                      <MenuSection section={data.comidas.postre} />
                    </div>
                  ) : null)}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-center p-4">
                <p className="text-muted-foreground">
                  El menú de consumibles estará disponible más cerca de la fecha del evento.
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 