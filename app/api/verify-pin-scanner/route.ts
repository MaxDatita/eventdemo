import { NextResponse } from 'next/server'
import { demoFeatures, pausedFeatureMessage } from '@/config/feature-flags'

export async function POST(request: Request) {
  if (!demoFeatures.scanner) {
    return NextResponse.json({ error: pausedFeatureMessage }, { status: 503 })
  }

  try {
    const { pin } = await request.json()
    const correctPin = '1234'

    if (pin === correctPin) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
} 
