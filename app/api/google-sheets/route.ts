import { NextResponse } from 'next/server';
import { getEventData, getUnsentTickets, markTicketsAsSent } from '@/services/googleSheet';
import { isPositiveIntegerArray, isValidEmail } from '@/lib/validation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  try {
    const eventData = await getEventData();
    const tickets = await getUnsentTickets(email);
    return NextResponse.json({ eventData, tickets });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { rowIndexes } = await request.json();

    if (!isPositiveIntegerArray(rowIndexes, { maxItems: 100, maxValue: 100000 })) {
      return NextResponse.json(
        { error: 'rowIndexes debe ser un array válido de enteros positivos' },
        { status: 400 }
      );
    }

    const result = await markTicketsAsSent(rowIndexes);
    
    if (result) {
      return NextResponse.json({ 
        success: true,
        message: `Marcadas ${rowIndexes.length} filas como enviadas`
      });
    } else {
      throw new Error('No se pudo completar la operación');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al marcar tickets como enviados');
    
    return NextResponse.json(
      { 
        error: 'Error al marcar tickets como enviados',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
} 
