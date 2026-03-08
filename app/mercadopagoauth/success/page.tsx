'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle } from 'lucide-react'
import { useEffect } from 'react'
import { demoFeatures, pausedFeatureMessage } from '@/config/feature-flags'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!demoFeatures.payments) return

    const token = searchParams.get('token')

    if (token) {
      fetch('/api/mercadopago/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Token saved:', data)
      })
      .catch(error => {
        console.error('Error saving token:', error)
      })
    }
  }, [searchParams])

  if (!demoFeatures.payments) {
    return (
      <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 bg-gradient-animation flex items-center justify-center">
        <Card className="auth-card rounded-xl">
          <div className="auth-card-content">
            <h1 className="auth-card-title">Pagos en pausa</h1>
            <p className="auth-card-text">{pausedFeatureMessage}</p>
            <Button variant="primary" className="w-full" onClick={() => router.push('/')}>
              Ir al inicio
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
          <CheckCircle className="auth-card-icon auth-card-icon-success" />
          <h1 className="auth-card-title">¡Configuración Exitosa!</h1>
          
          <p className="auth-card-text">
            Tu cuenta de MercadoPago ha sido conectada correctamente. Ya puedes comenzar a vender tickets.
          </p>

          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Ir a la Aplicación
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function MercadoPagoAuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 bg-gradient-animation flex items-center justify-center">
        <Card className="auth-card">
          <div className="text-center">Cargando...</div>
        </Card>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 
