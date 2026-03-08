import { NextResponse } from 'next/server';
import { registrarTickets } from '@/lib/google-sheets-registros';
import { demoFeatures, pausedFeatureMessage } from '@/config/feature-flags';

export async function POST(request: Request) {
  if (!demoFeatures.payments) {
    return NextResponse.json({ error: pausedFeatureMessage }, { status: 503 });
  }

  try {
    const { nombre, email, tipoTicket, quantity } = await request.json();

    await registrarTickets(
      nombre,
      email,
      tipoTicket,
      Number(quantity)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el proceso de pago:', error);
    return NextResponse.json(
      { error: 'Error en el proceso de pago', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
