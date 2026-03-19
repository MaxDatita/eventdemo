// ─── COLOR PRINCIPAL (editar solo aquí al clonar) ─────────────────────────────
// Cambiando primary se actualizan botones, títulos de cards, decos, aurora y gradientes.
const primary = '#04724d'
const primaryHover = '#036340'
const primaryLight = '#34d399'
const primaryLighter = '#6ee7b7'
// ─────────────────────────────────────────────────────────────────────────────

export const theme = {
  // Configuración global de fondo para toda la demo
  // mode: 'gradient' mantiene el fondo actual
  // mode: 'aurora' activa el fondo aurora
  background: {
    mode: 'grainient', // 'gradient' | 'aurora' | 'bokeh' | 'smokey' | 'grainient'
    gradient: {
      color1: '#000000',
      color2: '#471069',
      color3: '#196E76',
    },
    grainient: {
      color1: '#04724d',
      color2: '#ffffff',
      color3: '#aebaa6',
      timeSpeed: 0.25,
      colorBalance: -0.44,
      warpStrength: 1.45,
      warpFrequency: 3.3,
      warpSpeed: 3.4,
      warpAmplitude: 57,
      blendAngle: 0,
      blendSoftness: 0.05,
      rotationAmount: 630,
      noiseScale: 2,
      grainAmount: 0.03,
      grainScale: 2,
      grainAnimated: false,
      contrast: 1.0,
      gamma: 1,
      saturation: 1,
      centerX: 0,
      centerY: 0,
      zoom: 0.9,
    },
    aurora: {
      baseColor: '#ffffff',
      color1: primary,
      color2: primaryLight,
      color3: primaryLighter,
      color4: '#ffffff',
      color5: '#2dd4bf',
      opacity: 1,
      blur: 15,
      animationSpeed: 12,
    },
    bokeh: {
      count: 24,
      minSize: 60,
      maxSize: 220,
      speed: 0.8,
      overlayOpacity: 0.16,
      vignetteOpacity: 0.7,
    },
    smokey: {
      speed: 1,
      opacity: 0.42,
      blur: 95,
      scale: 0.8,
    },
  },
 

  // Colores principales (primary/primaryHover: botones, títulos, countdown, decos)
  colors: {
    primary,
    primaryHover,
    primaryLight,
    primaryLighter,
    // Elementos de UI
    ui: {
      spinner: 'border-purple-600',
      dialog: {
        background: 'bg-white',
        border: 'border-purple-200',
      },
      input: {
        // border: 'border-purple-200',
        focus: 'focus:border-purple-600',
      },
    },
    // Gradientes para círculos de iniciale
    gradients: [
      'from-red-400 to-pink-600',
      'from-orange-400 to-red-600',
      'from-yellow-400 to-orange-600',
      'from-green-400 to-emerald-600',
      'from-teal-400 to-cyan-600',
      'from-blue-400 to-indigo-600',
      'from-indigo-400 to-purple-600',
      'from-purple-400 to-pink-600',
    ],
  },

  // Configuración de elementos específicos
  elements: {
    // Configuración del carrusel
    carousel: {
      transition: 'duration-500',
      borderRadius: 'rounded-lg',
    },
    // Configuración de modales
    modal: {
      maxWidth: 'max-w-md',
      padding: 'p-6',
      borderRadius: 'rounded-lg',
    },
    // Configuración de botones
    buttonSize: {
      small: 'px-4 py-2',
      medium: 'px-6 py-3',
      large: 'px-8 py-4',
    },
  },

  // Configuración de fechas importantes
  dates: {
    event: '2026-10-18T22:30:00', // Fecha del evento
    contentActivation: '2026-10-01T00:00:00', // Fecha de activación del contenido
    rsvpDeadline: '2026-02-17T00:00:00', // Fecha límite para venta de tickets
    liveEnd: '2026-10-19T06:59:59', // Fecha en que desaparece el indicador LIVE
  },

  // Enlaces y recursos
  resources: {
    contentLink: 'https://drive.google.com/drive/u/2/folders/1a1Nsde0Zyx9Ysk_rI7sjaGnSB93BeW1c',
    images: {
      carousel: ['/imgfest1.webp', '/imgfest2.webp', '/imgfest3.webp'],
      video: '/vidfest.mp4',
      title: '/eventest.png'
    },
    heroGradientText: {
      beforeCountdownEnds: 'Compartí con nosotros una noche inolvidable',
      afterCountdownEnds: 'Gracias por acompañarnos',
      colors: [primary, primaryLight, '#588157'],
      animationSpeed: 8,
    },
  },

  // Configuración de tickets
  tickets: {
    lotes: {
      enabled: false, // habilitar/deshabilitar sistema de lotes
      maxTicketsPerLot: 10, // 0 para ventas ilimitadas
      currentLot: 1, // número de lote actual
      soldOutMessage: "Lote agotado", // mensaje cuando se agota el lote actual
      nextLotMessage: "Se habilitan 10 tickets hasta el 15/10", // mensaje informativo sobre próximo lote
    },
    types: [
      {
        id: 'vip',
        name: 'Vip',
        maxPerLot: 115, // 0 para sin límite específico para este tipo
      },
      {
        id: 'regular',
        name: 'Regular',
        maxPerLot: 25, // sin límite específico
      }
    ]
  },

  // Configuración del botón principal (tickets o confirmar asistencia)
  rsvpButton: {
    mode: 'rsvp', // 'tickets' | 'rsvp' | 'both' (both solo funciona en modo demo)
    // mode: 'tickets' - muestra solo el botón de comprar tickets
    // mode: 'rsvp' - muestra solo el botón de confirmar asistencia
    // mode: 'both' - muestra ambos botones (solo en modo demo)
  },

  // Tipo de contenido del modal de menú/consumibles
  // withPrices: menú con precios (bebidas y comidas para comprar)
  // informative: menú de la noche + consumos anexos (ej. casamiento, sin venta)
  menuModal: {
    type: 'informative', // 'withPrices' | 'informative'
  },

  // // Configuración del título
  // title: {
  //   image: {
  //     width: '300px',
  //     height: 'auto',
      
  //   }
  // }
};

/**
 * Luminancia relativa de un color hex (0 = negro, 1 = blanco).
 * Usado para decidir si el fondo del tema es claro u oscuro.
 */
function hexLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0782 * b;
}

/**
 * Indica si el fondo configurado en el tema es predominantemente oscuro.
 * Sirve para elegir logo (fondo-oscuro vs fondo-claro) sin depender del dark mode.
 */
export function isBackgroundDark(): boolean {
  const bg = theme.background;
  const mode = bg?.mode || 'gradient';

  // En aurora, bokeh y smokey el baseColor define el fondo real; los demás son acentos
  if (mode === 'aurora' || mode === 'bokeh' || mode === 'smokey') {
    const base = bg.aurora?.baseColor ?? '#07070c';
    if (/^#[0-9A-Fa-f]{6}$/.test(base)) {
      return hexLuminance(base) < 0.45;
    }
  }

  // Gradient: promediar los tres colores del gradiente
  if (mode === 'gradient' && bg.gradient) {
    const colors = [bg.gradient.color1, bg.gradient.color2, bg.gradient.color3].filter(
      (c) => /^#[0-9A-Fa-f]{6}$/.test(c)
    );
    if (colors.length > 0) {
      const avg = colors.reduce((sum, c) => sum + hexLuminance(c), 0) / colors.length;
      return avg < 0.45;
    }
  }

  // Grainient: usar los tres colores principales de la config
  if (mode === 'grainient' && bg.grainient) {
    const g = bg.grainient;
    const colors = [g.color1, g.color2, g.color3].filter(
      (c) => /^#[0-9A-Fa-f]{6}$/.test(c)
    );
    if (colors.length > 0) {
      const avg = colors.reduce((sum, c) => sum + hexLuminance(c), 0) / colors.length;
      return avg < 0.45;
    }
  }

  return true;
}
