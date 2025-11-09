import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, name, email, ticketType, quantity } = body;

    // Verificar contraseña
    if (password !== 'admin123') {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Validar campos requeridos
    if (!name || !email || !ticketType || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes o inválidos' },
        { status: 400 }
      );
    }

    // Simular generación de tickets (en producción se guardaría en base de datos)
    const ticketIds = Array.from({ length: quantity }, (_, i) => ({
      id: `ticket-${Date.now()}-${i}`,
      type: ticketType,
      name,
      email
    }));

    return NextResponse.json({
      success: true,
      message: `Se generaron ${quantity} tickets gratuitos de tipo ${ticketType}`,
      tickets: ticketIds
    });
  } catch (error) {
    console.error('Error generating tickets:', error);
    return NextResponse.json(
      { error: 'Error al generar tickets' },
      { status: 500 }
    );
  }
}



