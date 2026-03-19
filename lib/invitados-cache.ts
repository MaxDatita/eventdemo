import type { InvitadoRecord } from '@/lib/google-sheets-invitados';

const INVITADOS_CACHE_TTL_MS = 8000;

let cachedAt = 0;
let cachedInvitados: InvitadoRecord[] = [];
let inFlightRequest: Promise<InvitadoRecord[]> | null = null;

export function isInvitadosCacheFresh(now = Date.now()) {
  return cachedAt > 0 && now - cachedAt <= INVITADOS_CACHE_TTL_MS;
}

export function getCachedInvitados() {
  return cachedInvitados;
}

export function setCachedInvitados(data: InvitadoRecord[]) {
  cachedInvitados = data;
  cachedAt = Date.now();
}

export function getInvitadosInFlightRequest() {
  return inFlightRequest;
}

export function setInvitadosInFlightRequest(request: Promise<InvitadoRecord[]> | null) {
  inFlightRequest = request;
}

export function invalidateInvitadosCache() {
  cachedAt = 0;
  cachedInvitados = [];
  inFlightRequest = null;
}
