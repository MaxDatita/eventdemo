# Estrategia Recomendada de Clonacion

Esta guia documenta la estrategia recomendada para clonar este proyecto y adaptarlo a nuevos clientes o eventos sin mezclar carpetas, planillas, mensajes, pagos ni branding entre implementaciones.

La idea es que funcione como documento base para:

1. preparar un nuevo proyecto en Vercel
2. configurar Google Drive y Google Sheets
3. coordinar contenido con cliente, anfitriones y fotografos
4. validar que el clon no herede datos ni enlaces de una implementacion anterior

## Objetivo operativo

Cada clon debe quedar aislado por evento.

Eso implica:

1. una carpeta de Drive propia para fotos de invitados
2. una carpeta de Drive propia para contenido oficial
3. un Google Sheet propio para invitados, mensajes y datos operativos
4. una URL publica propia
5. branding y fechas propias del evento

Lo que si se puede reutilizar entre clones es la infraestructura comun:

1. credenciales OAuth para Google Drive
2. credenciales del Service Account para Google Sheets
3. integracion base de Vercel
4. logica del proyecto

## Resumen ejecutivo

El proyecto trabaja con dos identidades Google distintas.

### 1. Cuenta OAuth

Se usa para Google Drive.

Sirve para:

1. subir fotos de invitados
2. mover fotos entre `photos`, `aprobadas` y `rechazadas`
3. leer contenido oficial
4. leer imagenes y videos privados desde Drive

Variables:

1. `GOOGLE_OAUTH_CLIENT_ID`
2. `GOOGLE_OAUTH_CLIENT_SECRET`
3. `GOOGLE_OAUTH_REFRESH_TOKEN`
4. `GOOGLE_OAUTH_REDIRECT_URI`

### 2. Service Account

Se usa para Google Sheets.

Sirve para:

1. leer invitados
2. marcar check-in
3. leer y escribir mensajes
4. guardar datos operativos del evento
5. guardar token de Mercado Pago del vendedor
6. leer el PIN del scanner

Variables:

1. `GOOGLE_SERVICE_ACCOUNT_EMAIL`
2. `GOOGLE_PRIVATE_KEY`
3. `GOOGLE_SHEET_ID`

## Estrategia recomendada para reutilizar infraestructura

La estrategia mas simple para vender en serie es esta:

1. reutilizar siempre la misma cuenta OAuth para Drive
2. reutilizar siempre el mismo Service Account para Sheets
3. crear nuevas carpetas y nuevas planillas por cada evento
4. cambiar solo los IDs y datos especificos del cliente en cada clon

Con esta estrategia:

1. no hace falta generar nuevas credenciales Google por cada cliente
2. no hace falta repetir el flujo OAuth por cada proyecto
3. solo hay que compartir la carpeta correcta con la cuenta OAuth
4. solo hay que compartir el Sheet correcto con el Service Account

## Que se puede reutilizar entre clones

Estas variables pueden mantenerse iguales entre proyectos si queres centralizar operacion:

```env
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
GOOGLE_OAUTH_REDIRECT_URI=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
CRON_SECRET=
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MP_CLIENT_ID=
NEXT_PUBLIC_MP_CLIENT_SECRET=
ENVIALO_SIMPLE_API_KEY=
```

Notas:

1. `OPENAI_API_KEY` solo hace falta si la moderacion de mensajes va a estar activa.
2. `MERCADOPAGO_ACCESS_TOKEN` y credenciales MP dependen de tu estrategia comercial. Si cada cliente conecta su propia cuenta, igual vas a reutilizar la app base pero luego guardaras el seller token del cliente en el Sheet del evento.
3. `ENVIALO_SIMPLE_API_KEY` se puede reutilizar si el envio de mails sale desde una cuenta centralizada.

## Que debe ser unico por clon

Estas variables deben revisarse y ajustarse en cada proyecto nuevo:

```env
NEXT_PUBLIC_BASE_URL=
GOOGLE_SHEET_ID=
GOOGLE_DRIVE_FOLDER_ID=
OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID=
OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID=
MODERATION_PASSWORD=
PHOTO_WALL_MODE=
MESSAGE_MODERATION_ENABLED=
MESSAGE_MODERATION_THRESHOLD=
MESSAGE_MODERATION_BATCH_SIZE=
```

En la practica:

1. `GOOGLE_SHEET_ID` debe apuntar al spreadsheet del evento actual
2. `GOOGLE_DRIVE_FOLDER_ID` debe apuntar a la carpeta `photos` del evento actual
3. `OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID` debe apuntar a la carpeta de contenido oficial del evento actual
4. `OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID` es opcional; si no existe, se reutiliza la carpeta oficial de preview
5. `NEXT_PUBLIC_BASE_URL` debe coincidir con el dominio real del clon
6. `MODERATION_PASSWORD` debe definirse conscientemente y no dejarse por defecto

## Estructura recomendada por evento

Ejemplo de estructura sugerida en Drive:

1. `02-Eventechy/Events/cliente-x/photos`
2. `02-Eventechy/Events/cliente-x/contenido-oficial`
3. `02-Eventechy/Events/cliente-x/sheet`

El sistema no usa la ruta textual. Usa exclusivamente IDs.

Lo importante es que todo lo del evento quede agrupado y que al configurar el clon copies los IDs correctos.

## Flujo de fotos de invitados

### Objetivo

Permitir que invitados suban fotos y que el equipo las modere antes de mostrarlas.

### Flujo

1. el invitado sube una foto desde la app
2. la foto se guarda en la carpeta `GOOGLE_DRIVE_FOLDER_ID`
3. moderacion decide aprobar o rechazar
4. al aprobar, el archivo se mueve a `photos/aprobadas`
5. al rechazar, el archivo se mueve a `photos/rechazadas`
6. la galeria y proyeccion muestran solo las aprobadas

### Consideraciones de clonacion

1. `GOOGLE_DRIVE_FOLDER_ID` debe ser el ID de la carpeta `photos` del evento actual
2. la carpeta debe estar compartida con la cuenta OAuth
3. no reutilizar carpetas de otro evento
4. no usar IDs de carpetas borradas o en papelera

### Comportamiento actual del proyecto

El proyecto ya esta preparado para evitar dos problemas graves:

1. no reutiliza carpetas en papelera al buscar `aprobadas`, `rechazadas` o `previa`
2. no deja el servicio de Drive pegado a un `folderId` viejo si se cambia entre proyectos

Esto es clave para evitar mezcla entre clones.

## Flujo de contenido oficial

### Objetivo

Mostrar contenido subido por anfitriones, cliente o fotografo sin pasar por moderacion.

### Flujo

1. el cliente o fotografo sube fotos y/o videos a una carpeta de Drive
2. la app lee esa carpeta y la muestra en:
   - `Ver Fotos Previas`
   - `Contenido Oficial`
3. el contenido no pasa por aprobacion ni rechazo

### Configuracion recomendada

Si queres una sola carpeta para ambas vistas:

```env
OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID=ID_CONTENIDO_OFICIAL
```

Y no definir:

```env
OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID
```

En ese caso el proyecto reutiliza la misma carpeta para `preview` y `official`.

### Requerimientos

1. la carpeta oficial debe estar compartida con la cuenta OAuth
2. si hay videos, el wall tambien los puede mostrar
3. no hace falta moderacion para este flujo

### Datos a pedir al cliente o fotografo

1. carpeta final de entrega en Drive
2. confirmacion de que esa carpeta pertenece al evento correcto
3. tipo de contenido esperado:
   - fotos
   - videos
   - reels o clips exportados
4. fecha estimada de carga del contenido
5. si va a cargar material antes del evento, durante el evento o ambas cosas

## Flujo de invitados y check-in

### Objetivo

Usar una sola planilla por evento para invitados, check-in, mensajes y datos operativos.

### Hoja `Invitados`

El proyecto espera una hoja llamada exactamente `Invitados`.

Columnas requeridas:

1. `ID`
2. `Nombre` o `Invitado`
3. `Ingreso`
4. `Fecha Hora Ingreso`

Columnas opcionales:

1. `Acompañantes`
2. `Mesa`
3. `Email`
4. `Ticket`
5. `QRimg`

### Flujo de check-in

1. la pagina `/invitados` consulta el Sheet
2. busca invitados por nombre o ID
3. al marcar ingreso:
   - `Ingreso` pasa a `TRUE`
   - `Fecha Hora Ingreso` se completa con fecha y hora

### Password de acceso

Hoy la pagina de invitados reutiliza `MODERATION_PASSWORD`.

Eso implica que, al clonar:

1. si cambias la password de moderacion, tambien cambia la de invitados
2. si dejas la password por defecto, expones tanto moderacion como invitados

## Flujo de mensajes

### Objetivo

Permitir que los invitados dejen mensajes y moderarlos antes de mostrarlos.

### Hoja `Mensajes`

El proyecto espera una hoja llamada exactamente `Mensajes`.

Columnas recomendadas:

1. `id`
2. `Fecha`
3. `Nombre`
4. `Mensaje`
5. `Estado`
6. `moderation_score`
7. `moderation_reason` opcional

### Flujo

1. el usuario envia un mensaje
2. `POST /api/messages` lo guarda en el Sheet del evento
3. si la moderacion IA esta activa:
   - el mensaje puede quedar `approved`
   - `rejected`
   - `pending` si la IA falla
4. la UI publica consume por defecto solo mensajes `approved`
5. `/api/messages/moderate-cron` sirve para reprocesar pendientes

### Variables a revisar al clonar

1. `MESSAGE_MODERATION_ENABLED`
2. `MESSAGE_MODERATION_THRESHOLD`
3. `MESSAGE_MODERATION_BATCH_SIZE`
4. `OPENAI_API_KEY`
5. `OPENAI_MODEL`
6. `CRON_SECRET`

## Hoja `Datos`

El proyecto tambien usa una hoja llamada exactamente `Datos`.

Hoy se detectan estas celdas operativas:

1. `C2`: token del vendedor de Mercado Pago
2. `C3`: nombre del evento
3. `C4`: email del organizador
4. `C6`: PIN del scanner

### Consideraciones al clonar

1. si vas a usar pagos, el evento debe tener su `Datos!C2` correctamente poblado
2. si vas a usar scanner, el `Datos!C6` debe existir
3. si el cliente no usa pagos ni scanner, igual conviene dejar documentado el layout de la hoja

## Que se comparte con quien

### Drive

Compartir con la cuenta OAuth.

Se recomienda compartir:

1. carpeta `photos`
2. carpeta de contenido oficial

Permiso recomendado:

1. `Editor` para `photos`
2. `Viewer` o `Editor` para contenido oficial, segun operativa

### Google Sheet

Compartir con `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

Permiso recomendado:

1. `Editor`

Motivo:

1. necesita leer invitados
2. necesita marcar ingresos
3. necesita guardar mensajes
4. puede guardar datos operativos

## Estrategia recomendada en Vercel

### Secrets reutilizables

Cargarlos una vez por proyecto si mantenes operacion centralizada:

1. `GOOGLE_OAUTH_CLIENT_ID`
2. `GOOGLE_OAUTH_CLIENT_SECRET`
3. `GOOGLE_OAUTH_REFRESH_TOKEN`
4. `GOOGLE_OAUTH_REDIRECT_URI`
5. `GOOGLE_SERVICE_ACCOUNT_EMAIL`
6. `GOOGLE_PRIVATE_KEY`
7. `OPENAI_API_KEY`
8. `OPENAI_MODEL`
9. `CRON_SECRET`
10. `ENVIALO_SIMPLE_API_KEY`
11. `MERCADOPAGO_ACCESS_TOKEN`
12. `NEXT_PUBLIC_MP_CLIENT_ID`
13. `NEXT_PUBLIC_MP_CLIENT_SECRET`

### Variables especificas del cliente

Ajustarlas en cada clon:

1. `NEXT_PUBLIC_BASE_URL`
2. `GOOGLE_SHEET_ID`
3. `GOOGLE_DRIVE_FOLDER_ID`
4. `OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID`
5. `OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID` si aplica
6. `MODERATION_PASSWORD`
7. `PHOTO_WALL_MODE`
8. `MESSAGE_MODERATION_ENABLED`

## Otras consideraciones de clonacion fuera de fotos, invitados y mensajes

Ademas de Drive y Sheets, hay otros puntos del proyecto que conviene revisar al clonar.

### 1. Branding y fechas en `config/theme.ts`

Revisar al menos:

1. colores principales
2. recursos visuales
3. `dates.event`
4. `dates.contentActivation`
5. `dates.rsvpDeadline`
6. `dates.liveEnd`
7. `resources.contentLink`
8. configuracion de tickets
9. `rsvpButton.mode`
10. `menuModal.type`

Importante:

1. `resources.contentLink` puede quedar apuntando a un Drive viejo si no se revisa
2. las fechas de activacion impactan en contenido, countdown y estado live

### 2. Metadata publica en `app/layout.tsx`

Hoy hay metadata hardcodeada que conviene revisar en cada clon:

1. `title`
2. `description`
3. `openGraph.url`
4. `openGraph.title`
5. `openGraph.description`
6. `twitter.title`
7. `twitter.description`

Si esto no se cambia, el clon puede salir con nombre, descripcion o URL del proyecto anterior.

### 3. Feature flags en `config/feature-flags.ts`

Revisar antes de publicar:

1. `social`
2. `rsvp`
3. `tickets`
4. `scanner`
5. `payments`

Esto define que modulos quedan visibles o no para cada cliente.

### 4. Mercado Pago

Si el proyecto del cliente usa tickets o pagos:

1. revisar `feature-flags`
2. revisar `theme.tickets`
3. revisar `Datos!C2`
4. revisar `NEXT_PUBLIC_BASE_URL`
5. validar retorno correcto de callbacks de pago

### 5. Scanner

Si el evento usa check-in con QR:

1. activar `scanner` en feature flags
2. definir `Datos!C6`
3. validar flujo en `/scanner`

### 6. Email y recursos externos

Si el proyecto usa envio de mails:

1. revisar `ENVIALO_SIMPLE_API_KEY`
2. revisar `NEXT_PUBLIC_BASE_URL`
3. validar assets usados en mails

## Riesgos principales al clonar

### Riesgo 1: mezclar carpetas de Drive entre eventos

Causa:

1. copiar un `GOOGLE_DRIVE_FOLDER_ID` viejo
2. copiar un `OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID` viejo

Prevencion:

1. verificar el ID desde la URL real de la carpeta
2. compartir esa carpeta con la cuenta OAuth
3. probar subida y lectura antes de publicar

### Riesgo 2: usar el Sheet de otro cliente

Causa:

1. olvidar cambiar `GOOGLE_SHEET_ID`

Consecuencia:

1. invitados, mensajes o pagos se mezclarian con otro evento

Prevencion:

1. crear o duplicar un spreadsheet nuevo por evento
2. compartirlo con el Service Account
3. validar hojas `Invitados`, `Mensajes` y `Datos`

### Riesgo 3: dejar branding o metadata viejos

Causa:

1. no revisar `config/theme.ts`
2. no revisar `app/layout.tsx`

Consecuencia:

1. el clon sale con nombres, links o previews de otro evento

### Riesgo 4: dejar passwords por defecto

Hoy hay varias rutas y pantallas internas que siguen mostrando o usando `admin123` como fallback o valor hardcodeado en contexto demo.

Al clonar:

1. definir `MODERATION_PASSWORD`
2. validar manualmente moderacion, invitados y dashboard
3. no asumir que cambiar la env alcanza si el flujo demo sigue exponiendo links con password fija

## Checklist operativo para un nuevo clon

### Etapa 1: preparar infraestructura

1. crear proyecto nuevo en Vercel
2. cargar secrets reutilizables
3. definir variables exclusivas del cliente
4. configurar dominio y `NEXT_PUBLIC_BASE_URL`

### Etapa 2: preparar Google Drive

1. crear carpeta del evento
2. crear carpeta `photos`
3. crear carpeta `contenido-oficial`
4. compartir ambas con la cuenta OAuth
5. copiar IDs correctos en Vercel

### Etapa 3: preparar Google Sheets

1. crear o duplicar spreadsheet del evento
2. validar hojas `Invitados`, `Mensajes` y `Datos`
3. compartir el spreadsheet con `GOOGLE_SERVICE_ACCOUNT_EMAIL`
4. cargar el `GOOGLE_SHEET_ID` correcto

### Etapa 4: preparar branding y configuracion

1. revisar `config/theme.ts`
2. revisar metadata publica
3. revisar feature flags
4. revisar tickets, pagos y scanner si aplican

### Etapa 5: pruebas minimas obligatorias

1. subir una foto de invitado
2. aprobar una foto y verificar que se cree `aprobadas` dentro de la carpeta `photos`
3. rechazar una foto y verificar `rechazadas`
4. abrir `Ver Fotos Previas` y confirmar lectura de contenido oficial
5. probar carga de un invitado desde el Sheet
6. marcar check-in
7. enviar un mensaje y validar escritura en `Mensajes`
8. si aplica, probar moderacion IA
9. si aplica, probar pagos
10. si aplica, probar scanner

## Datos que conviene pedir al cliente al iniciar un nuevo proyecto

### Contenido

1. carpeta de Drive para contenido oficial
2. responsable del contenido
3. fecha estimada de entrega
4. si habra fotos, videos o ambos

### Invitados

1. Google Sheet final o base para importar
2. formato de columnas esperado
3. criterio de IDs si el cliente ya los tiene
4. si el check-in usara mesa, acompanantes o ambos

### Mensajes

1. si la seccion estara activa
2. si la moderacion IA debe estar encendida
3. nivel de tolerancia a mensajes borderline

### Pagos y tickets

1. si habra venta de tickets
2. si el cliente conectara su propio Mercado Pago
3. si se usaran lotes y limites por tipo

### Operacion en puerta

1. si habra scanner QR
2. quien tendra el PIN
3. quien operara el check-in

## Recomendacion final

Para mantener una operacion escalable:

1. reutilizar credenciales globales
2. crear Drive y Sheet nuevos por evento
3. documentar el `folderId` y `sheetId` de cada cliente en una ficha operativa
4. correr siempre el checklist minimo antes de entregar el clon

Esa combinacion es la mas simple para vender en serie sin aumentar demasiado la complejidad tecnica ni correr el riesgo de mezclar datos entre eventos.
