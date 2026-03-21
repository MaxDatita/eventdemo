# Checklist de Clonacion

Usar esta checklist cada vez que se prepara un nuevo clon para un cliente o evento.

## 1. Proyecto y deploy

1. Crear el proyecto nuevo en Vercel.
2. Configurar el dominio correcto.
3. Definir `NEXT_PUBLIC_BASE_URL` con la URL final del evento.
4. Verificar que el clon no apunte al dominio de un proyecto anterior.

## 2. Secrets reutilizables

Confirmar que el proyecto tenga cargados:

1. `GOOGLE_OAUTH_CLIENT_ID`
2. `GOOGLE_OAUTH_CLIENT_SECRET`
3. `GOOGLE_OAUTH_REFRESH_TOKEN`
4. `GOOGLE_OAUTH_REDIRECT_URI`
5. `GOOGLE_SERVICE_ACCOUNT_EMAIL`
6. `GOOGLE_PRIVATE_KEY`
7. `OPENAI_API_KEY` si se usa moderacion de mensajes
8. `OPENAI_MODEL` si se usa moderacion de mensajes
9. `CRON_SECRET` si se usa reproceso de mensajes
10. `ENVIALO_SIMPLE_API_KEY` si se usa envio de mails
11. `MERCADOPAGO_ACCESS_TOKEN` si se usa Mercado Pago
12. `NEXT_PUBLIC_MP_CLIENT_ID` si se usa Mercado Pago
13. `NEXT_PUBLIC_MP_CLIENT_SECRET` si se usa Mercado Pago

## 3. Variables exclusivas del evento

Definir y revisar:

1. `GOOGLE_SHEET_ID`
2. `GOOGLE_DRIVE_FOLDER_ID`
3. `OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID`
4. `OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID` si aplica
5. `MODERATION_PASSWORD`
6. `PHOTO_WALL_MODE`
7. `MESSAGE_MODERATION_ENABLED`
8. `MESSAGE_MODERATION_THRESHOLD`
9. `MESSAGE_MODERATION_BATCH_SIZE`

## 4. Google Drive

### Carpeta de invitados

1. Crear o identificar la carpeta `photos` del evento.
2. Copiar el ID correcto en `GOOGLE_DRIVE_FOLDER_ID`.
3. Compartir la carpeta con la cuenta OAuth.
4. Verificar que la carpeta no sea de otro evento.
5. Verificar que no sea una carpeta en papelera.

### Carpeta de contenido oficial

1. Crear o identificar la carpeta de contenido oficial.
2. Copiar el ID correcto en `OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID`.
3. Si se usa una sola carpeta para preview y oficial, dejar vacia `OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID`.
4. Compartir la carpeta con la cuenta OAuth.

## 5. Google Sheets

1. Crear o duplicar un spreadsheet nuevo por evento.
2. Compartirlo con `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
3. Cargar su ID en `GOOGLE_SHEET_ID`.
4. Verificar que existan las hojas:
   - `Invitados`
   - `Mensajes`
   - `Datos`

### Hoja `Invitados`

Validar columnas minimas:

1. `ID`
2. `Nombre` o `Invitado`
3. `Ingreso`
4. `Fecha Hora Ingreso`

### Hoja `Datos`

Validar si aplica:

1. `C2` token vendedor Mercado Pago
2. `C3` nombre evento
3. `C4` email organizador
4. `C6` PIN scanner

## 6. Branding y configuracion visual

Revisar [theme.ts](/Users/MaxiChamas/Documents/Datita/Eventy/invitametech/invitametech-demo/config/theme.ts):

1. colores principales
2. fechas del evento
3. `resources.contentLink`
4. imagenes y recursos
5. `rsvpButton.mode`
6. `tickets`
7. `menuModal.type`

Revisar [layout.tsx](/Users/MaxiChamas/Documents/Datita/Eventy/invitametech/invitametech-demo/app/layout.tsx):

1. `title`
2. `description`
3. Open Graph
4. Twitter cards
5. URLs publicas

## 7. Feature flags

Revisar [feature-flags.ts](/Users/MaxiChamas/Documents/Datita/Eventy/invitametech/invitametech-demo/config/feature-flags.ts):

1. `social`
2. `rsvp`
3. `tickets`
4. `scanner`
5. `payments`

## 8. Passwords y accesos internos

1. Definir `MODERATION_PASSWORD`.
2. No dejar la password por defecto.
3. Validar acceso a moderacion.
4. Validar acceso a invitados.
5. Validar dashboard si se usa.

Nota:

Hoy hay partes del proyecto demo/admin que todavia muestran o usan `admin123`, asi que este punto debe revisarse manualmente en cada clon.

## 9. Pruebas minimas obligatorias

### Fotos de invitados

1. Subir una foto.
2. Aprobar una foto.
3. Verificar que se cree `aprobadas` dentro de la carpeta `photos`.
4. Rechazar una foto.
5. Verificar que exista `rechazadas`.

### Contenido oficial

1. Abrir `Ver Fotos Previas`.
2. Confirmar que carga la carpeta oficial correcta.
3. Abrir una foto en grande.
4. Si hay video, probar reproduccion.

### Invitados

1. Abrir `/invitados`.
2. Buscar por nombre o ID.
3. Marcar check-in.
4. Confirmar cambio en la hoja `Invitados`.

### Mensajes

1. Enviar un mensaje.
2. Confirmar que se guarda en `Mensajes`.
3. Si la moderacion IA esta activa, confirmar estado `approved`, `rejected` o `pending`.

### Pagos y scanner

1. Si hay tickets, validar Mercado Pago.
2. Si hay scanner, validar `Datos!C6` y el flujo en `/scanner`.

## 10. Validacion final antes de entregar

1. Confirmar que Drive no apunta a carpetas de otro evento.
2. Confirmar que el Sheet no apunta al de otro cliente.
3. Confirmar que metadata y branding no son heredados.
4. Confirmar que la URL publica final es correcta.
5. Confirmar que el proyecto responde bien en mobile.
6. Confirmar que el cliente o fotografo compartieron las carpetas correctas.
