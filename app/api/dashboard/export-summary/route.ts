import { NextResponse } from 'next/server';
import { generateDashboardData } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, format } = body;

    // Verificar contraseña
    if (password !== 'admin123') {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Validar formato
    if (!['pdf', 'text'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato inválido. Debe ser "pdf" o "text"' },
        { status: 400 }
      );
    }

    // Generar datos mock
    const { guests, stats } = generateDashboardData();

    if (format === 'text') {
      // Generar texto plano
      let text = `RESUMEN DEL EVENTO\n`;
      text += `========================\n\n`;
      text += `ESTADÍSTICAS GENERALES\n`;
      text += `Total de invitados confirmados: ${stats.totalGuests}\n`;
      text += `Total de acompañantes: ${stats.totalCompanions}\n`;
      text += `Total de personas: ${stats.totalGuests + stats.totalCompanions}\n`;
      text += `Invitados con requerimientos alimentarios: ${stats.guestsWithDietaryRequirements}\n\n`;

      // Requerimientos alimentarios
      if (Object.keys(stats.dietaryRequirementsBreakdown).length > 0) {
        text += `REQUERIMIENTOS ALIMENTARIOS\n`;
        Object.entries(stats.dietaryRequirementsBreakdown).forEach(([req, count]) => {
          text += `- ${req}: ${count} invitado(s)\n`;
        });
        text += `\n`;
      }

      // Lista de invitados
      text += `LISTA DE INVITADOS\n`;
      guests.forEach((guest, index) => {
        text += `${index + 1}. ${guest.firstName} ${guest.lastName}`;
        if (guest.companions > 0) {
          text += ` (+${guest.companions} acompañante${guest.companions > 1 ? 's' : ''})`;
        }
        if (guest.dietaryRequirements) {
          text += ` - ${guest.dietaryRequirements}`;
        }
        text += `\n`;
      });

      return NextResponse.json({
        success: true,
        format: 'text',
        content: text
      });
    } else {
      // Para PDF, retornamos los datos y el frontend generará el PDF
      return NextResponse.json({
        success: true,
        format: 'pdf',
        data: {
          guests,
          stats
        }
      });
    }
  } catch (error) {
    console.error('Error exporting summary:', error);
    return NextResponse.json(
      { error: 'Error al exportar resumen' },
      { status: 500 }
    );
  }
}



