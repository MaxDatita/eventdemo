import { NextResponse } from 'next/server';
import { registrarTickets } from '@/lib/google-sheets-registros';
import { demoFeatures, pausedFeatureMessage } from '@/config/feature-flags';

export async function POST(request: Request) {
  if (!demoFeatures.payments || !demoFeatures.tickets) {
    return NextResponse.json({ error: pausedFeatureMessage }, { status: 503 });
  }

  try {
    const { nombre, email, tipoTicket, cantidad } = await request.json();

    await registrarTickets(nombre, email, tipoTicket, Number(cantidad));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registrando tickets:', error);
    return NextResponse.json(
      { error: 'Error registrando tickets', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
