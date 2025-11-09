export interface PhotoWallConfig {
  mode: 'moderation' | 'photographer';
  requiresApproval: boolean;
  maxPhotos: number;
  allowedFormats: string[];
  maxFileSize: number; // en MB
  moderationPassword?: string;
}

export const photoWallConfig: PhotoWallConfig = {
  mode: process.env.PHOTO_WALL_MODE as 'moderation' | 'photographer' || 'moderation',
  requiresApproval: process.env.PHOTO_WALL_MODE === 'moderation',
  maxPhotos: 50,
  // Aceptamos también HEIC/HEIF; si el navegador lo provee, lo convertimos a JPEG en cliente
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  maxFileSize: 10, // 10MB
  moderationPassword: process.env.MODERATION_PASSWORD || 'admin123'
};

