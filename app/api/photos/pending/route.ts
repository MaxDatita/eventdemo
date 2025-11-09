import { NextRequest, NextResponse } from 'next/server';
import { photoWallConfig } from '@/config/photo-wall';
import { getGoogleDriveService } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  try {
    // Verificar password de moderación si se proporciona
    const password = request.nextUrl.searchParams.get('password');
    if (password && password !== photoWallConfig.moderationPassword) {
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
        message: 'Google Drive no configurado. Las fotos aparecerán aquí cuando se suban.'
      });
    }

    // Obtener instancia de Google Drive Service
    const googleDriveService = getGoogleDriveService();
    if (!googleDriveService) {
      return NextResponse.json({ 
        photos: [],
        message: 'Google Drive no configurado. Las fotos aparecerán aquí cuando se suban.'
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

    // Obtener fotos de la carpeta principal (pendientes)
    // Ya están filtradas automáticamente por getPhotos() que excluye aprobadas/rechazadas
    const drivePhotos = await googleDriveService.getPhotos();
    
    const pendingPhotos = drivePhotos.map(drivePhoto => {
      // Extraer username del nombre del archivo (formato: username_timestamp_filename)
      const parts = drivePhoto.name.split('_');
      const username = parts[0] || 'Usuario';
      
      // Usar el proxy de imágenes para evitar problemas de CORS
      const imageUrl = `/api/photos/image?id=${drivePhoto.id}`;
      
      return {
        id: drivePhoto.id,
        url: imageUrl,
        thumbnailUrl: drivePhoto.thumbnailLink || imageUrl,
        fullUrl: imageUrl,
        username: username,
        timestamp: drivePhoto.createdTime,
        driveUrl: drivePhoto.webViewLink,
        status: 'pending' as const,
      };
    });

    return NextResponse.json({ photos: pendingPhotos });

  } catch (error) {
    console.error('Error fetching pending photos:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      photos: []
    }, { status: 500 });
  }
}
