import { NextResponse } from 'next/server';
import { generateDashboardData, calculateStats, generateMockTickets } from '@/lib/mock-data';
import { isDemoAdminPasswordValid } from '@/lib/demo-admin-auth';

// Compartir el mismo estado de invitados entre todas las rutas
let mockGuests = generateDashboardData().guests;

// Función para reinicializar si es necesario
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
    if (!isDemoAdminPasswordValid(password)) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Obtener invitados activos (no eliminados)
    const activeGuests = getGuests().filter(g => !g.deleted);
    const tickets = generateMockTickets(45);
    const stats = calculateStats(activeGuests, tickets);

    return NextResponse.json({
      success: true,
      guests: activeGuests,
      tickets,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}


