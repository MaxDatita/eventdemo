import { createHmac, timingSafeEqual } from 'crypto';
import { requireServerEnv } from '@/lib/required-env';

const ADMIN_GUESTS_SESSION_COOKIE = 'admin_guests_session';
const ADMIN_GUESTS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getAdminGuestsSessionSecret() {
  return requireServerEnv('ADMIN_GUESTS_SESSION_SECRET');
}

function signAdminGuestsSession(expiresAt: string) {
  return createHmac('sha256', getAdminGuestsSessionSecret())
    .update(expiresAt)
    .digest('hex');
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

export function getAdminGuestsPassword() {
  return requireServerEnv('ADMIN_GUESTS_PASSWORD');
}

export function createAdminGuestsSessionToken() {
  const expiresAt = String(Date.now() + ADMIN_GUESTS_SESSION_MAX_AGE_SECONDS * 1000);
  const signature = signAdminGuestsSession(expiresAt);
  return `${expiresAt}.${signature}`;
}

export function getAdminGuestsSessionCookieName() {
  return ADMIN_GUESTS_SESSION_COOKIE;
}

export function getAdminGuestsSessionMaxAge() {
  return ADMIN_GUESTS_SESSION_MAX_AGE_SECONDS;
}

export function isAdminGuestsSessionValid(request: Request) {
  const token = getCookieValue(request, ADMIN_GUESTS_SESSION_COOKIE);
  if (!token) return false;

  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature) return false;
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false;

  const expectedSignature = signAdminGuestsSession(expiresAt);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

