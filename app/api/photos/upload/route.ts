import { NextRequest, NextResponse } from 'next/server';
import { photoWallConfig } from '@/config/photo-wall';
import { getGoogleDriveService, isGoogleDriveConfigured } from '@/lib/google-drive';
import { applyRateLimit, getRateLimitClientIp } from '@/lib/rate-limit';
import { logError, logWarn } from '@/lib/server-log';

const MAX_PHOTO_USERNAME_LENGTH = 50;
const MAX_PHOTO_FILENAME_LENGTH = 120;

export async function POST(request: NextRequest) {
  try {
    const clientIp = getRateLimitClientIp(request);
    const rateLimit = applyRateLimit(request, {
      name: 'photos-upload',
      limit: 3,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      logWarn('photo_upload_rate_limited', { ip: clientIp });
      return NextResponse.json(
        { error: 'Demasiadas cargas seguidas. Esperá un momento antes de volver a intentar.' },
        { status: 429 }
      );
    }

    // Verificar si Google Drive está configurado
    if (!isGoogleDriveConfigured()) {
      return NextResponse.json({ 
        error: 'Google Drive no está configurado. Por favor, contacta al administrador.',
        code: 'DRIVE_NOT_CONFIGURED'
      }, { status: 503 });
    }

    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const username = formData.get('username') as string;

    // Validaciones
    if (!photo) {
      return NextResponse.json({ error: 'No se proporcionó ninguna foto' }, { status: 400 });
    }

    if (!(photo instanceof File)) {
      return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 });
    }

    if (!username || username.trim() === '') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    if (username.trim().length > MAX_PHOTO_USERNAME_LENGTH) {
      return NextResponse.json(
        { error: `El nombre no puede superar los ${MAX_PHOTO_USERNAME_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    if (photo.size <= 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 });
    }

    const safeFileName = (photo.name || 'photo.jpg').trim();
    if (safeFileName.length === 0 || safeFileName.length > MAX_PHOTO_FILENAME_LENGTH) {
      return NextResponse.json(
        { error: 'El nombre del archivo no es válido' },
        { status: 400 }
      );
    }

    // Validar formato (permitir HEIC/HEIF pero convertirlos en cliente, aceptar JPEG/PNG/WEBP)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const isHeic = photo.type === 'image/heic' || photo.type === 'image/heif' || !photo.type || photo.type === '';
    
    // Permitir si es JPEG, PNG, WEBP, o si no tiene tipo (será tratado como JPEG)
    if (photo.type && !isHeic && !allowedTypes.includes(photo.type)) {
      return NextResponse.json({ 
        error: `Formato no permitido. Formatos válidos: ${allowedTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validar tamaño
    const maxSizeBytes = photoWallConfig.maxFileSize * 1024 * 1024;
    if (photo.size > maxSizeBytes) {
      return NextResponse.json({ 
        error: `El archivo es muy grande. Máximo: ${photoWallConfig.maxFileSize}MB` 
      }, { status: 400 });
    }

    // Obtener instancia de Google Drive Service
    const googleDriveService = getGoogleDriveService();
    if (!googleDriveService) {
      return NextResponse.json({ 
        error: 'Google Drive no está configurado. Por favor, contacta al administrador.',
        code: 'DRIVE_NOT_CONFIGURED'
      }, { status: 503 });
    }

    // Convertir File a Buffer
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Google Drive
    const drivePhoto = await googleDriveService.uploadPhoto(
      buffer, 
      safeFileName, 
      username.trim()
    );

    // TODO: Guardar metadata en base de datos local si es necesario
    // Por ahora solo retornamos éxito

    return NextResponse.json({ 
      success: true, 
      photoId: drivePhoto.id,
      driveUrl: drivePhoto.webViewLink,
      thumbnailUrl: drivePhoto.thumbnailLink,
      message: photoWallConfig.requiresApproval 
        ? 'Foto subida correctamente. Será revisada por el moderador.' 
        : 'Foto compartida correctamente en la Photo Wall!'
    });

  } catch (error) {
    logError('photo_upload_error', {
      ip: getRateLimitClientIp(request),
      reason: error instanceof Error ? error.message : 'unknown',
    });
    
    // Mensajes de error más descriptivos
    let errorMessage = 'Error al subir la foto a Google Drive';
    let statusCode = 500;
    let errorDetails = 'Error desconocido';

    if (error instanceof Error) {
      errorDetails = error.message;
      const errorStr = error.message.toLowerCase();
      const errorStack = error.stack?.toLowerCase() || '';
      
      if (error.message.includes('GOOGLE_DRIVE_FOLDER_ID') || errorStr.includes('folder_id')) {
        errorMessage = 'Google Drive no está configurado correctamente';
        statusCode = 503;
      } else if (errorStr.includes('authentication') || errorStr.includes('credentials') || errorStr.includes('unauthorized') || errorStr.includes('401')) {
        errorMessage = 'Error de autenticación con Google Drive. Verifica las credenciales.';
        statusCode = 503;
      } else if (errorStr.includes('permission') || errorStr.includes('403') || errorStr.includes('forbidden') || errorStr.includes('storage quota')) {
        errorMessage = 'La carpeta debe estar compartida con el Service Account. Comparte la carpeta de Google Drive con el email: ' + (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'tu-service-account@...');
        statusCode = 403;
      } else if (errorStr.includes('not found') || errorStr.includes('404')) {
        errorMessage = 'La carpeta de Google Drive no existe o no es accesible';
        statusCode = 404;
      } else if (errorStr.includes('invalid_grant') || errorStack.includes('invalid_grant')) {
        errorMessage = 'Las credenciales de Google Drive han expirado o son inválidas';
        statusCode = 503;
      } else if (errorStr.includes('invalid_request') || errorStack.includes('invalid_request')) {
        errorMessage = 'Error en la solicitud a Google Drive. Verifica la configuración.';
        statusCode = 400;
      } else {
        errorMessage = error.message || 'Error desconocido al subir la foto';
      }
    } else if (typeof error === 'object' && error !== null) {
      // Intentar extraer información del error
      const errorObj = error as { message?: string; error?: string; code?: string };
      errorDetails = errorObj.message || errorObj.error || JSON.stringify(error);
      if (errorObj.code) {
        if (errorObj.code === 'ECONNREFUSED') {
          errorMessage = 'No se pudo conectar con Google Drive. Verifica tu conexión.';
        }
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: statusCode });
  }
}
