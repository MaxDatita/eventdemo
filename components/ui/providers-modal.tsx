'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog"
import { Building2, Phone, Mail, Globe } from 'lucide-react'
import { useDemoDates } from '@/contexts/DemoContext'

interface Provider {
  id: string
  name: string
  description?: string
  phone?: string
  email?: string
  website?: string
  category?: string
}

const providers: Provider[] = [
  {
    id: '1',
    name: 'DJ Sound System',
    description: 'Sonido profesional y DJ para eventos. Equipamiento de última generación y amplia experiencia en eventos masivos.',
    phone: '+54 11 1234-5678',
    email: 'contacto@djsound.com',
    website: 'https://www.djsound.com',
    category: 'Entretenimiento'
  },
  {
    id: '2',
    name: 'Catering Premium',
    description: 'Servicio de catering y gastronomía de alta calidad. Menús personalizados y opciones para todos los gustos.',
    phone: '+54 11 2345-6789',
    email: 'info@cateringpremium.com',
    website: 'https://www.cateringpremium.com',
    category: 'Gastronomía'
  },
  {
    id: '3',
    name: 'Iluminación Pro',
    description: 'Diseño e instalación de iluminación profesional para eventos. Efectos especiales y ambientación.',
    phone: '+54 11 3456-7890',
    email: 'ventas@iluminacionpro.com',
    website: 'https://www.iluminacionpro.com',
    category: 'Iluminación'
  },
  {
    id: '4',
    name: 'Fotografía & Video',
    description: 'Cobertura fotográfica y videográfica completa del evento. Entrega en alta calidad y formato digital.',
    phone: '+54 11 4567-8901',
    email: 'studio@fotovideo.com',
    website: 'https://www.fotovideo.com',
    category: 'Fotografía'
  },
  {
    id: '5',
    name: 'Decoración Eventos',
    description: 'Diseño y montaje de decoración temática. Ambientación completa para crear la atmósfera perfecta.',
    phone: '+54 11 5678-9012',
    email: 'contacto@decoracioneventos.com',
    category: 'Decoración'
  },
  {
    id: '6',
    name: 'Seguridad Privada',
    description: 'Servicio de seguridad y control de acceso. Personal capacitado y protocolos de seguridad.',
    phone: '+54 11 6789-0123',
    email: 'info@seguridadprivada.com',
    category: 'Seguridad'
  }
]

export function ProvidersModal() {
  const { isDarkMode } = useDemoDates()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={`mt-3 px-2 py-1 rounded-xl text-xs transition-all ${
            isDarkMode
              ? 'bg-white/10 text-white border border-white/20'
              : 'bg-gray-100 text-gray-800 border border-gray-300'
          }`}
        >
          <Building2 className="inline-block mr-1.5 h-3 w-3" />
          Proveedores del Evento
        </button>
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[500px] max-h-[80vh] flex flex-col ${isDarkMode ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? 'text-white' : ''}>
            Proveedores del Evento
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {providers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                No hay proveedores registrados aún
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {provider.name}
                      </h3>
                      {provider.category && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isDarkMode
                            ? 'bg-purple-900/50 text-purple-300'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {provider.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {provider.description && (
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {provider.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {provider.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <a
                          href={`tel:${provider.phone}`}
                          className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                        >
                          {provider.phone}
                        </a>
                      </div>
                    )}
                    {provider.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <a
                          href={`mailto:${provider.email}`}
                          className={`hover:underline break-all ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                        >
                          {provider.email}
                        </a>
                      </div>
                    )}
                    {provider.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`hover:underline break-all ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                        >
                          {provider.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

