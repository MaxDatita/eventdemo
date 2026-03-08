'use client'

import { useState } from 'react'
import QRScanner from '@/components/qr-scan'
import PinInput from '@/components/pin-input-scanner'
import { pausedFeatureMessage, demoFeatures } from '@/config/feature-flags'

export default function ScannerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!demoFeatures.scanner) {
    return (
      <div className="min-h-screen pt-6 pb-6 pl-6 pr-6 bg-gradient-animation flex items-center justify-center">
        <div className="auth-card rounded-xl p-8 text-center">
          <h1 className="heading-h1 mb-4">Scanner en pausa</h1>
          <p className="auth-card-text">{pausedFeatureMessage}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PinInput onValidPin={() => setIsAuthenticated(true)} />
  }

  return <QRScanner />
} 
