import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { DemoUserRole, hasDemoRoleAccess } from '@/config/demo-auth';

const SESSION_COOKIE_NAME = 'demo_auth_session';
const OAUTH_COOKIE_NAME = 'demo_auth_oauth';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;
export type DemoSession = {
  email: string;
  role: DemoUserRole;
  name: string;
  picture?: string;
  expiresAt: number;
};

type OAuthStatePayload = {
  expiresAt: number;
  nextPath: string;
  state: string;
};

function getDemoAuthSecret() {
  return (
    process.env.DEMO_AUTH_SESSION_SECRET ||
    process.env.INVITADOS_SESSION_SECRET ||
    process.env.DEMO_ADMIN_PASSWORD ||
    'dev-demo-auth-secret'
  );
}

function stringToUint8Array(value: string) {
  return new TextEncoder().encode(value);
}

function uint8ArrayToHex(value: Uint8Array) {
  return Array.from(value)
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
}

function stringToBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlToString(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    stringToUint8Array(getDemoAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, stringToUint8Array(value));
  return uint8ArrayToHex(new Uint8Array(signature));
}

async function createSignedToken(payload: object) {
  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

async function readSignedToken<T>(token: string | undefined | null): Promise<T | null> {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signValue(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    return JSON.parse(base64UrlToString(encodedPayload)) as T;
  } catch {
    return null;
  }
}

function normalizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith('/')) return '/';
  if (nextPath.startsWith('//')) return '/';
  return nextPath;
}

export function getDemoAuthCookieName() {
  return SESSION_COOKIE_NAME;
}

export function isDemoUserAuthorized(role: DemoUserRole, requiredRole: DemoUserRole) {
  return hasDemoRoleAccess(role, requiredRole);
}

export async function createDemoSession(payload: Omit<DemoSession, 'expiresAt'>) {
  return createSignedToken({
    ...payload,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export async function getDemoSessionFromToken(token: string | undefined | null) {
  const payload = await readSignedToken<DemoSession>(token);
  if (!payload) return null;
  if (!payload.expiresAt || payload.expiresAt < Date.now()) return null;
  return payload;
}

export async function getDemoSessionFromRequest(request: Request | NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);

  return getDemoSessionFromToken(token ? decodeURIComponent(token) : null);
}

export async function getDemoSessionFromCookieStore() {
  const cookieStore = await cookies();
  return getDemoSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function createGoogleOAuthState(nextPath: string) {
  const state = crypto.randomUUID();
  const token = await createSignedToken({
    expiresAt: Date.now() + OAUTH_STATE_MAX_AGE_SECONDS * 1000,
    nextPath: normalizeNextPath(nextPath),
    state,
  } satisfies OAuthStatePayload);

  return { state, token };
}

export async function readGoogleOAuthState(token: string | undefined | null, state: string | null) {
  const payload = await readSignedToken<OAuthStatePayload>(token);
  if (!payload) return null;
  if (payload.expiresAt < Date.now()) return null;
  if (!state || payload.state !== state) return null;
  return payload;
}

export function applyDemoSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function applyOAuthStateCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: OAUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
}

export function clearDemoAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: OAUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getOAuthStateCookieName() {
  return OAUTH_COOKIE_NAME;
}

export function getSafeNextPath(nextPath: string | null | undefined) {
  return normalizeNextPath(nextPath);
}
