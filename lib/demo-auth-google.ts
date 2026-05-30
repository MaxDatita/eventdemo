import 'server-only';

import { google } from 'googleapis';
import { getRoleForDemoEmail } from '@/config/demo-auth';

const GOOGLE_LOGIN_SCOPES = ['openid', 'email', 'profile'];

function getGoogleLoginRedirectUri() {
  const redirectUri = process.env.GOOGLE_LOGIN_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error('Falta configurar GOOGLE_LOGIN_REDIRECT_URI');
  }
  return redirectUri;
}

function getGoogleAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Faltan GOOGLE_OAUTH_CLIENT_ID o GOOGLE_OAUTH_CLIENT_SECRET');
  }

  return new google.auth.OAuth2(clientId, clientSecret, getGoogleLoginRedirectUri());
}

export function buildGoogleAuthUrl(state: string) {
  const client = getGoogleAuthClient();

  return client.generateAuthUrl({
    access_type: 'online',
    include_granted_scopes: true,
    prompt: 'select_account',
    scope: GOOGLE_LOGIN_SCOPES,
    state,
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = getGoogleAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new Error('Google no devolvió id_token');
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || payload.email_verified !== true) {
    throw new Error('La cuenta de Google no tiene un email verificado');
  }

  const role = getRoleForDemoEmail(payload.email);
  if (!role) {
    return null;
  }

  return {
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email,
    picture: payload.picture || undefined,
    role,
  };
}
