import { NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/google-drive';

export async function POST() {
  try {
    // Verificar si Google Drive está configurado
    const isGoogleDriveConfigured = !!(
      process.env.GOOGLE_DRIVE_FOLDER_ID && 
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
      process.env.GOOGLE_PRIVATE_KEY
    );

    if (!isGoogleDriveConfigured) {
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


