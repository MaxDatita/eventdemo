import { google } from 'googleapis';

function parseRedirectUris(raw: string | undefined): string[] {
  if (!raw) return [];

  const value = raw.trim();
  if (!value) return [];

  // Accept JSON array format: ["http://localhost:3000/callback","https://domain/callback"]
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
    } catch {
      // Fall through to CSV/single parsing
    }
  }

  // Accept CSV format: http://localhost:3000/callback,https://domain/callback
  if (value.includes(',')) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // Single URL format
  return [value];
}

export function resolveGoogleOAuthRedirectUri(preferred?: string | null): string {
  const available = parseRedirectUris(process.env.GOOGLE_OAUTH_REDIRECT_URI);
  if (available.length === 0) {
    throw new Error('GOOGLE_OAUTH_REDIRECT_URI no está configurado');
  }

  if (!preferred) return available[0];

  if (preferred === 'local') {
    return available.find((uri) => uri.includes('localhost')) || available[0];
  }

  if (preferred === 'prod') {
    return available.find((uri) => !uri.includes('localhost')) || available[0];
  }

  // If user provided a concrete URL, use it only if it's part of allowed list.
  if (available.includes(preferred)) {
    return preferred;
  }

  return available[0];
}

export function createGoogleOAuthClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Faltan GOOGLE_OAUTH_CLIENT_ID o GOOGLE_OAUTH_CLIENT_SECRET');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const GOOGLE_DRIVE_OAUTH_SCOPES = ['https://www.googleapis.com/auth/drive'];
