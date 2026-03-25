import { createHmac, timingSafeEqual } from 'crypto';
import { photoWallConfig } from '@/config/photo-wall';

const INVITADOS_SESSION_COOKIE = 'invitados_session';
const INVITADOS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

function signInvitadosSession(expiresAt: string) {
  return createHmac('sha256', getInvitadosSessionSecret())
    .update(expiresAt)
    .digest('hex');
}

function getInvitadosSessionSecret() {
  return (
    process.env.INVITADOS_SESSION_SECRET ||
    process.env.INVITADOS_PASSWORD ||
    process.env.MODERATION_PASSWORD ||
    'dev-invitados-session-secret'
  );
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split('=');
    if (rawName === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return '';
}

export function getInvitadosPassword() {
  return process.env.INVITADOS_PASSWORD || photoWallConfig.moderationPassword || 'admin123';
}

export function getPasswordFromRequest(request: Request) {
  return request.headers.get('x-invitados-password')?.trim() || '';
}

export function createInvitadosSessionToken() {
  const expiresAt = String(Date.now() + INVITADOS_SESSION_MAX_AGE_SECONDS * 1000);
  const signature = signInvitadosSession(expiresAt);
  return `${expiresAt}.${signature}`;
}

export function getInvitadosSessionCookieName() {
  return INVITADOS_SESSION_COOKIE;
}

export function getInvitadosSessionMaxAge() {
  return INVITADOS_SESSION_MAX_AGE_SECONDS;
}

export function isInvitadosSessionValid(request: Request) {
  const token = getCookieValue(request, INVITADOS_SESSION_COOKIE);
  if (!token) return false;

  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature) return false;
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false;

  const expectedSignature = signInvitadosSession(expiresAt);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function isInvitadosPasswordValid(request: Request) {
  return (
    isInvitadosSessionValid(request) ||
    getPasswordFromRequest(request) === getInvitadosPassword()
  );
}
