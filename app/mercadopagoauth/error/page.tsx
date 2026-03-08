'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle } from 'lucide-react'
import { demoFeatures, pausedFeatureMessage } from '@/config/feature-flags'

export default function MercadoPagoAuthErrorPage() {
  const router = useRouter()

  if (!demoFeatures.payments) {
    return (
      <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 bg-gradient-animation flex items-center justify-center">
        <Card className="auth-card rounded-xl">
          <div className="auth-card-content">
            <h1 className="auth-card-title">Pagos en pausa</h1>
            <p className="auth-card-text">{pausedFeatureMessage}</p>
            <Button variant="primary" className="w-full" onClick={() => router.push('/')}>
              Volver al Inicio
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 bg-gradient-animation flex items-center justify-center">
      <Card className="auth-card rounded-xl">
        <div className="auth-card-content">
          <AlertTriangle className="auth-card-icon auth-card-icon-error" />
          <h1 className="auth-card-title">Error de Configuración</h1>
          
          <p className="auth-card-text">
            Ha ocurrido un error al conectar tu cuenta. Contacta al equipo de Eventechy.
          </p>

          <Button variant="primary" className="w-full">
            Volver al Inicio
          </Button>
        </div>
      </Card>
    </div>
  )
} 
