import { photoWallConfig } from '@/config/photo-wall';

export function getInvitadosPassword() {
  return photoWallConfig.moderationPassword || 'admin123';
}

export function getPasswordFromRequest(request: Request) {
  return request.headers.get('x-invitados-password')?.trim() || '';
}

export function isInvitadosPasswordValid(request: Request) {
  return getPasswordFromRequest(request) === getInvitadosPassword();
}

