import { NextResponse } from 'next/server';
import { demoPhotos } from '@/data/demo-photos';
import { photoWallConfig } from '@/config/photo-wall';
import { theme } from '@/config/theme';
import { googleDriveService, getDirectImageUrl, getThumbnailUrl, getDirectDownloadUrl, getVideoUrl, getVideoThumbnailUrl } from '@/lib/google-drive';

export async function GET(request: Request) {
  try {
    // Obtener parámetro de la URL para saber si usar fotos aprobadas
    const { searchParams } = new URL(request.url);
    const useApprovedParam = searchParams.get('useApproved');
    const useApproved = useApprovedParam === 'true';

    // Verificar si Google Drive está configurado
    const isGoogleDriveConfigured = !!(
      process.env.GOOGLE_DRIVE_FOLDER_ID && 
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
      process.env.GOOGLE_PRIVATE_KEY
    );

    if (!isGoogleDriveConfigured) {
      console.warn('Google Drive no está configurado. Usando datos demo.');
      const approvedPhotos = demoPhotos.filter(photo => photo.approved);
      return NextResponse.json({ photos: approvedPhotos });
    }

    // Verificar que la carpeta existe
    const folderExists = await googleDriveService.verifyFolder();
    if (!folderExists) {
      console.warn('La carpeta de Google Drive no existe o no es accesible. Usando datos demo.');
      const approvedPhotos = demoPhotos.filter(photo => photo.approved);
      return NextResponse.json({ photos: approvedPhotos });
    }

    // Obtener fotos según el parámetro recibido
    // Si useApproved es true, usar carpeta "aprobadas"
    // Si es false, usar carpeta "previa"
    const drivePhotos = useApproved
      ? await googleDriveService.getApprovedPhotos()
      : await googleDriveService.getPreviaPhotos();
    
    // Convertir formato de Google Drive a formato de la app
    const photos = drivePhotos.map(drivePhoto => {
      const isVideo = drivePhoto.mimeType?.includes('video/') || false;
      // IMPORTANTE: Para videos, SIEMPRE usar el proxy del servidor para evitar CORS
      // Google Drive no permite streaming directo de videos desde el navegador
      // Para imágenes, usar el proxy de imagen
      const mediaUrl = isVideo 
        ? `/api/photos/video?id=${drivePhoto.id}`
        : `/api/photos/image?id=${drivePhoto.id}`;
      
      return {
        id: drivePhoto.id,
        url: mediaUrl, // SIEMPRE usar proxy para videos
        username: drivePhoto.name.split('_')[0] || 'Usuario',
        timestamp: drivePhoto.createdTime,
        approved: true, // En modo fotógrafo, todas están aprobadas
        driveUrl: drivePhoto.webViewLink,
        // Para videos, usar el proxy de thumbnail específico; para imágenes, usar thumbnailLink o generar uno
        thumbnailUrl: isVideo 
          ? `/api/photos/thumbnail?id=${drivePhoto.id}` // Usar proxy específico para thumbnails de video
          : (drivePhoto.thumbnailLink || getThumbnailUrl(drivePhoto.id, 'large')),
        fullUrl: mediaUrl, // Misma URL de alta calidad
        alternativeUrl: isVideo 
          ? (drivePhoto.webContentLink || `/api/photos/video?id=${drivePhoto.id}`) // Usar webContentLink si está disponible
          : getDirectImageUrl(drivePhoto.id), // URL alternativa solo para imágenes
        // Para videos, también incluir webContentLink si está disponible (necesita archivo público)
        webContentLink: isVideo ? drivePhoto.webContentLink : undefined,
        mimeType: drivePhoto.mimeType || 'image/jpeg', // Tipo de archivo
        isVideo: isVideo // Flag para identificar videos
      };
    });

    // Filtrar por aprobación si está en modo moderación
    const approvedPhotos = photoWallConfig.requiresApproval 
      ? photos.filter(photo => photo.approved)
      : photos;

    return NextResponse.json({ photos: approvedPhotos });

  } catch (error) {
    console.error('Error fetching photos:', error);
    // En caso de error, retornar fotos demo
    const approvedPhotos = demoPhotos.filter(photo => photo.approved);
    return NextResponse.json({ photos: approvedPhotos });
  }
}

