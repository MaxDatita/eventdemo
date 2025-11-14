import { NextResponse } from 'next/server';
import { generateDashboardData } from '@/lib/mock-data';

// Compartir el mismo estado de invitados
let mockGuests = generateDashboardData().guests;

function getGuests() {
  if (mockGuests.length === 0) {
    mockGuests = generateDashboardData().guests;
  }
  return mockGuests;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Verificar contraseña
    if (password !== 'admin123') {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Obtener invitados eliminados
    const deletedGuests = getGuests().filter(g => g.deleted === true);

    return NextResponse.json({
      success: true,
      guests: deletedGuests
    });
  } catch (error) {
    console.error('Error fetching deleted guests:', error);
    return NextResponse.json(
      { error: 'Error al obtener invitados eliminados' },
      { status: 500 }
    );
  }
}

