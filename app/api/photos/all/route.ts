import { NextRequest, NextResponse } from 'next/server';
import { photoWallConfig } from '@/config/photo-wall';
import { googleDriveService } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    // Verificar password de moderación
    const password = request.nextUrl.searchParams.get('password');
    if (!password || password !== photoWallConfig.moderationPassword) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Verificar si Google Drive está configurado
    const isGoogleDriveConfigured = !!(
      process.env.GOOGLE_DRIVE_FOLDER_ID && 
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
      process.env.GOOGLE_PRIVATE_KEY
    );

    if (!isGoogleDriveConfigured) {
      return NextResponse.json({ 
        photos: [],
        message: 'Google Drive no configurado.'
      });
    }

    // Verificar que la carpeta existe
    const folderExists = await googleDriveService.verifyFolder();
    if (!folderExists) {
      return NextResponse.json({ 
        photos: [],
        message: 'La carpeta de Google Drive no existe o no es accesible.'
      });
    }

    // Obtener fotos aprobadas de la carpeta correspondiente
    const drivePhotos = await googleDriveService.getApprovedPhotos();
    
    // Convertir formato de Google Drive a formato de la app
    const photos = drivePhotos.map(drivePhoto => {
      const parts = drivePhoto.name.split('_');
      const username = parts[0] || 'Usuario';
      const imageUrl = `/api/photos/image?id=${drivePhoto.id}`;
      
      return {
        id: drivePhoto.id,
        url: imageUrl,
        thumbnailUrl: drivePhoto.thumbnailLink || imageUrl,
        fullUrl: imageUrl,
        username: username,
        timestamp: drivePhoto.createdTime,
        driveUrl: drivePhoto.webViewLink,
        status: 'approved' as const,
      };
    });

    return NextResponse.json({ photos });

  } catch (error) {
    console.error('Error fetching all photos:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      photos: []
    }, { status: 500 });
  }
}

