# Configuración de Moderación de Mensajes (IA)

Esta guía deja lista la moderación automática para proyectos reales, manteniendo demo apagada.
El flujo principal ahora es moderación inmediata al enviar el mensaje. El endpoint de cron queda como respaldo manual para re-procesar `pending` si alguna vez OpenAI falla o si querés recuperar mensajes atrasados. También queda preparado un workflow de GitHub Actions, pero desactivado por defecto.

## 1) Variables de entorno

Agregar en `.env.local` (y en el proyecto de Vercel del cliente):

```env
MESSAGE_MODERATION_ENABLED=false
MESSAGE_MODERATION_THRESHOLD=0.70
MESSAGE_MODERATION_BATCH_SIZE=25

OPENAI_API_KEY=tu_api_key
OPENAI_MODEL=gpt-4.1-mini
CRON_SECRET=tu_secret_largo_y_unico
```

Notas:
- En demo: `MESSAGE_MODERATION_ENABLED=false`
- En cliente real: `MESSAGE_MODERATION_ENABLED=true`

## 2) Flujo principal

1. El usuario envía mensaje.
2. `POST /api/messages` consulta OpenAI en ese mismo momento.
3. El mensaje se guarda directo como:
   - `approved`
   - `rejected`
   - `pending` si OpenAI falla o está desactivado

## 3) Respaldo manual para `pending`

El endpoint `/api/messages/moderate-cron` sigue disponible para re-procesar mensajes pendientes.

## 4) GitHub Actions preparado, sin activar

Se agregó el workflow:

`/.github/workflows/message-moderation-manual.yml`

Estado actual:
- Solo corre manualmente con `workflow_dispatch`
- No tiene `schedule` activo

Para usarlo a futuro:
- Agregar secrets en GitHub:
  - `APP_BASE_URL`
  - `CRON_SECRET`
- Descomentar la sección `schedule` del workflow
- Ajustar frecuencia si querés cada 5 minutos o la que te convenga

## 5) Prueba manual local

Con el server levantado:

```bash
curl -X POST http://localhost:3000/api/messages/moderate-cron \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

## 6) Mostrar solo aprobados en front

`GET /api/messages` ya devuelve por defecto solo `approved`.
Opcionalmente, se puede usar `?status=pending|rejected|all` para vistas internas.
