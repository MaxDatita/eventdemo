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

    // Buscar y marcar como eliminado (soft delete)
    const guests = getGuests();
    const guestIndex = guests.findIndex(g => g.id === guestId);
    
    if (guestIndex === -1) {
      return NextResponse.json(
        { error: 'Invitado no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete
    guests[guestIndex] = {
      ...guests[guestIndex],
      deleted: true,
      deletedAt: new Date().toISOString()
    };
    mockGuests = guests;

    return NextResponse.json({
      success: true,
      message: 'Invitado eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting guest:', error);
    return NextResponse.json(
      { error: 'Error al eliminar invitado' },
      { status: 500 }
    );
  }
}

