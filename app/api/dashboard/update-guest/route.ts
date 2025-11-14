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
    const { password, guestId, updates } = body;

    // Verificar contraseña
    if (password !== 'admin123') {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Validar campos
    if (!guestId || !updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Buscar y actualizar el invitado
    const guests = getGuests();
    const guestIndex = guests.findIndex(g => g.id === guestId);
    
    if (guestIndex === -1) {
      return NextResponse.json(
        { error: 'Invitado no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el invitado
    guests[guestIndex] = {
      ...guests[guestIndex],
      ...updates
    };
    mockGuests = guests;

    return NextResponse.json({
      success: true,
      guest: guests[guestIndex]
    });
  } catch (error) {
    console.error('Error updating guest:', error);
    return NextResponse.json(
      { error: 'Error al actualizar invitado' },
      { status: 500 }
    );
  }
}

