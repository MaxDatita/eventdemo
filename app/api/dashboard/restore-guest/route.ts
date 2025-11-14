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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, guestId } = body;

    // Verificar contraseña
    if (password !== 'admin123') {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    if (!guestId) {
      return NextResponse.json(
        { error: 'ID de invitado requerido' },
        { status: 400 }
      );
    }

    // Buscar y restaurar el invitado
    const guests = getGuests();
    const guestIndex = guests.findIndex(g => g.id === guestId);
    
    if (guestIndex === -1) {
      return NextResponse.json(
        { error: 'Invitado no encontrado' },
        { status: 404 }
      );
    }

    // Restaurar (quitar soft delete)
    guests[guestIndex] = {
      ...guests[guestIndex],
      deleted: false,
      deletedAt: null
    };
    mockGuests = guests;

    return NextResponse.json({
      success: true,
      message: 'Invitado restaurado correctamente',
      guest: guests[guestIndex]
    });
  } catch (error) {
    console.error('Error restoring guest:', error);
    return NextResponse.json(
      { error: 'Error al restaurar invitado' },
      { status: 500 }
    );
  }
}

