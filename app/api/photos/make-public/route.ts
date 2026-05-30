import { NextResponse } from 'next/server';
import { photoWallConfig } from '@/config/photo-wall';
import { getGoogleDriveService, isGoogleDriveConfigured } from '@/lib/google-drive';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password !== photoWallConfig.moderationPassword) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Verificar si Google Drive está configurado
    if (!isGoogleDriveConfigured()) {
      return NextResponse.json({ 
        error: 'Google Drive no está configurado' 
      }, { status: 400 });
    }

    // Obtener instancia de Google Drive Service
    const googleDriveService = getGoogleDriveService();
    if (!googleDriveService) {
      return NextResponse.json({ 
        error: 'Google Drive no está configurado' 
      }, { status: 400 });
    }

    // Hacer todas las fotos públicas
    await googleDriveService.makeAllPhotosPublic();

    return NextResponse.json({ 
      success: true, 
      message: 'Todas las fotos han sido hechas públicas' 
    });

  } catch (error) {
    console.error('Error making photos public:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
