import { NextResponse } from 'next/server';
import { demoPhotos } from '@/data/demo-photos';
import { photoWallConfig } from '@/config/photo-wall';
import {
  getGoogleDriveService,
  getGoogleDriveServiceForFolder,
  getDirectImageUrl,
  getThumbnailUrl,
  isGoogleDriveConfigured,
} from '@/lib/google-drive';

export async function GET(request: Request) {
  try {
    // Obtener parámetro de la URL para saber si usar fotos aprobadas
    const { searchParams } = new URL(request.url);
    const useApprovedParam = searchParams.get('useApproved');
    const useApproved = useApprovedParam === 'true';
    const source = searchParams.get('source') || 'guest'; // guest | official
    const phase = searchParams.get('phase') || (useApproved ? 'live' : 'preview'); // preview | live

    // Verificar si Google Drive está configurado
    if (!isGoogleDriveConfigured()) {
      console.warn('Google Drive no está configurado. Usando datos demo.');
      const approvedPhotos = demoPhotos.filter(photo => photo.approved);
      return NextResponse.json({ photos: approvedPhotos });
    }

    // Obtener instancia de Google Drive Service
    const officialPreviewFolderId = process.env.OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID;
    const officialLiveFolderId =
      process.env.OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID || officialPreviewFolderId;
    const selectedOfficialFolderId = phase === 'live' ? officialLiveFolderId : officialPreviewFolderId;

    if (source === 'official' && !selectedOfficialFolderId) {
      return NextResponse.json({ photos: [], error: 'Falta OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID' }, { status: 400 });
    }

    const googleDriveService =
      source === 'official' && selectedOfficialFolderId
        ? getGoogleDriveServiceForFolder(selectedOfficialFolderId)
        : getGoogleDriveService();
    if (!googleDriveService) {
      if (source === 'official') {
        return NextResponse.json({ photos: [], error: 'Google Drive oficial no está configurado correctamente' }, { status: 500 });
      }
      console.warn('Google Drive no está configurado. Usando datos demo.');
      const approvedPhotos = demoPhotos.filter(photo => photo.approved);
      return NextResponse.json({ photos: approvedPhotos });
    }

    // Verificar que la carpeta existe
    const folderExists = await googleDriveService.verifyFolder();
    if (!folderExists) {
      if (source === 'official') {
        return NextResponse.json({ photos: [], error: 'La carpeta oficial no existe o no es accesible' }, { status: 404 });
      }
      console.warn('La carpeta de Google Drive no existe o no es accesible. Usando datos demo.');
      const approvedPhotos = demoPhotos.filter(photo => photo.approved);
      return NextResponse.json({ photos: approvedPhotos });
    }

    // Obtener fotos según el parámetro recibido
    // Si useApproved es true, usar carpeta "aprobadas"
    // Si es false, usar carpeta "previa"
    const drivePhotos =
      source === 'official'
        ? await googleDriveService.getFolderMedia()
        : (useApproved
            ? await googleDriveService.getApprovedPhotos()
            : await googleDriveService.getPreviaPhotos());
    
    // Convertir formato de Google Drive a formato de la app
    const photos = drivePhotos.map(drivePhoto => {
      const isVideo = drivePhoto.mimeType?.includes('video/') || false;
      // IMPORTANTE: Para videos, SIEMPRE usar el proxy del servidor para evitar CORS
      // Google Drive no permite streaming directo de videos desde el navegador
      // Para imágenes, usar el proxy de imagen
      const mediaUrl = isVideo 
        ? `/api/photos/video?id=${drivePhoto.id}`
        : `/api/photos/image?id=${drivePhoto.id}`;
      const isOfficialSource = source === 'official';
      
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
          : (isOfficialSource ? `/api/photos/thumbnail?id=${drivePhoto.id}` : (drivePhoto.thumbnailLink || getThumbnailUrl(drivePhoto.id, 'large'))),
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
    const approvedPhotos = source === 'official'
      ? photos
      : photoWallConfig.requiresApproval 
      ? photos.filter(photo => photo.approved)
      : photos;

    return NextResponse.json({ photos: approvedPhotos });

  } catch (error) {
    console.error('Error fetching photos:', error);
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'guest';
    if (source === 'official') {
      return NextResponse.json(
        { photos: [], error: error instanceof Error ? error.message : 'Error al obtener contenido oficial' },
        { status: 500 }
      );
    }
    // En caso de error, retornar fotos demo
    const approvedPhotos = demoPhotos.filter(photo => photo.approved);
    return NextResponse.json({ photos: approvedPhotos });
  }
}
