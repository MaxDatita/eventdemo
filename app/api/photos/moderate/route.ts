import { NextRequest, NextResponse } from 'next/server';
import { photoWallConfig } from '@/config/photo-wall';
import { getGoogleDriveService } from '@/lib/google-drive';

export async function PUT(request: NextRequest) {
  try {
    const { photoId, action, password } = await request.json();

    // Validar password de moderación
    if (password !== photoWallConfig.moderationPassword) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Validar acción
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    // Verificar si Google Drive está configurado
    const isGoogleDriveConfigured = !!(
      process.env.GOOGLE_DRIVE_FOLDER_ID && 
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
      process.env.GOOGLE_PRIVATE_KEY
    );

    if (!isGoogleDriveConfigured) {
      return NextResponse.json({ 
        success: true, 
        message: action === 'approve' ? 'Foto aprobada (modo demo)' : 'Foto rechazada (modo demo)'
      });
    }

    // Obtener instancia de Google Drive Service
    const googleDriveService = getGoogleDriveService();
    if (!googleDriveService) {
      return NextResponse.json({ 
        success: true, 
        message: action === 'approve' ? 'Foto aprobada (modo demo)' : 'Foto rechazada (modo demo)'
      });
    }

    if (action === 'approve') {
      // Mover foto a carpeta de aprobadas
      const approvedFolderId = await googleDriveService.getOrCreateApprovedFolder();
      await googleDriveService.moveFile(photoId, approvedFolderId);
    } else if (action === 'reject') {
      // Mover foto a carpeta de rechazadas
      const rejectedFolderId = await googleDriveService.getOrCreateRejectedFolder();
      await googleDriveService.moveFile(photoId, rejectedFolderId);
    }

    return NextResponse.json({ 
      success: true, 
      message: action === 'approve' ? 'Foto aprobada' : 'Foto rechazada'
    });

  } catch (error) {
    console.error('Error moderating photo:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}
