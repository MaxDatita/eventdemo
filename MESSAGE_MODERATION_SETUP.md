# Configuración de Moderación de Mensajes (IA + Cron)

Esta guía deja lista la moderación automática para proyectos reales, manteniendo demo apagada.

## 1) Variables de entorno

Agregar en `.env.local` (y en el proyecto de Vercel del cliente):

```env
CRON_SECRET=tu_secret_largo_y_unico
MESSAGE_MODERATION_ENABLED=false
MESSAGE_MODERATION_THRESHOLD=0.70
MESSAGE_MODERATION_BATCH_SIZE=25

OPENAI_API_KEY=tu_api_key
OPENAI_MODEL=gpt-4.1-mini
```

Notas:
- En demo: `MESSAGE_MODERATION_ENABLED=false`
- En cliente real: `MESSAGE_MODERATION_ENABLED=true`

## 2) Cron en Vercel

Ya está configurado en `vercel.json`:

- Endpoint: `/api/messages/moderate-cron`
- Frecuencia: cada 2 minutos (`*/2 * * * *`)

## 3) Qué hace el cron

1. Lee filas `Estado = pending` en la hoja `Mensajes`.
2. Evalúa cada mensaje con IA.
3. Actualiza:
   - `Estado` => `approved` o `rejected`
   - `moderation_score` => `0..1`
   - `moderation_reason` (si la columna existe)

## 4) Prueba manual local

Con el server levantado:

```bash
curl -X POST http://localhost:3000/api/messages/moderate-cron \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

## 5) Mostrar solo aprobados en front

`GET /api/messages` ya devuelve por defecto solo `approved`.
Opcionalmente, se puede usar `?status=pending|rejected|all` para vistas internas.

