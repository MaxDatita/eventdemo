'use client'

import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import Image from 'next/image'

interface PinInputProps {
  onValidPin: () => void
}

export default function PinInput({ onValidPin }: PinInputProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/verify-pin-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      })

      if (response.ok) {
        onValidPin()
      } else {
        setError('PIN incorrecto')
        setPin('')
      }
    } catch {
      setError('Error al verificar el PIN')
      setPin('')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-animation relative z-10">
      <div className="flex flex-col items-center min-h-[100dvh] pb-24">
        {/* Título EVENTEST (imagen) y MODO DEMO arriba */}
        <div className="w-full max-w-md pt-8 pb-6 px-6 text-center flex-shrink-0 mt-36">
          <div className="title-image-container mb-3">
            <Image
              src="/eventest.webp"
              alt="Eventest"
              width={300}
              height={100}
              className="title-image"
              priority
            />
          </div>
          <div className="bg-purple-600 text-white px-3 py-1 rounded-full backdrop-blur-sm shadow-lg inline-block">
            <span className="text-xs font-bold">MODO DEMO</span>
          </div>
        </div>
        
        {/* Contenido centrado verticalmente */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xs px-6">
          {/* Título Scanner */}
          <div className="mb-4 text-center">
            <h2 className="heading-h1 text-center mb-4">Scanner</h2>
            <p className="body-base text-center mb-4">
              Coloca el PIN proporcionado para acceder.
            </p>
          </div>
          
          {/* Formulario */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <Input
              type="tel"
              maxLength={4}
              placeholder="Ingrese el PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                setError('')
              }}
              className="text-center text-2xl"
              inputMode="numeric"
            />
            <Button type="submit" className="w-full" disabled={pin.length !== 4}>
              Verificar
            </Button>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </form>
        </div>
      </div>
      
      {/* Logo fijo abajo */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
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
            className="rounded-lg eventechy-logo"
          />
        </a>
      </div>
    </div>
  )
}
