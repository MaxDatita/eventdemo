# Guia Operativa Completa: Contenido e Invitados

Esta guia documenta de punta a punta como funciona la seccion de contenido del evento y la lista de invitados.

El objetivo es que sirva para:

1. Clonar el proyecto para nuevos clientes.
2. Configurar correctamente Google Drive y Google Sheets.
3. Coordinar con cliente, anfitriones y fotografos.
4. Evitar mezcla de carpetas, fotos o planillas entre eventos.

## Resumen ejecutivo

El proyecto usa dos integraciones distintas con Google:

1. Google Drive
   - Para fotos de invitados y contenido oficial.
   - Usa OAuth.

2. Google Sheets
   - Para lista de invitados, mensajes, datos del evento y otros datos operativos.
   - Usa Service Account.

Este punto es importante:

1. Las carpetas de Drive se comparten con la cuenta autenticada por OAuth.
2. El Google Sheet se comparte con el `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

No son la misma identidad.

## Arquitectura funcional

### Modulo 1: Contenido de invitados

Flujo:

1. El invitado sube una foto desde la app.
2. La foto entra en la carpeta raiz `photos` del evento.
3. Moderacion aprueba o rechaza.
4. Si se aprueba, la foto va a `photos/aprobadas`.
5. Si se rechaza, la foto va a `photos/rechazadas`.
6. La galeria y la proyeccion consumen las fotos aprobadas.

### Modulo 2: Contenido oficial

Flujo:

1. El cliente, anfitriones o fotografo cargan contenido en una carpeta de Google Drive.
2. Ese contenido no pasa por moderacion.
3. La app lo muestra en:
   - `Ver Fotos Previas`
   - `Contenido Oficial`
4. Puede usar una sola carpeta para ambos casos.

### Modulo 3: Invitados

Flujo:

1. La lista se lee desde Google Sheets.
2. La app `/invitados` lista, busca y marca ingresos.
3. El check-in actualiza el estado directamente en la hoja `Invitados`.
4. La autenticacion de la pagina de invitados usa la misma password base que moderacion.

## Identidades Google que intervienen

### 1. Cuenta OAuth

Se usa para Drive.

Permite:

1. Leer y escribir fotos de invitados.
2. Leer contenido oficial.
3. Mover fotos entre carpetas de moderacion.

Variables:

1. `GOOGLE_OAUTH_CLIENT_ID`
2. `GOOGLE_OAUTH_CLIENT_SECRET`
3. `GOOGLE_OAUTH_REFRESH_TOKEN`

### 2. Service Account

Se usa para Google Sheets.

Permite:

1. Leer hoja `Invitados`
2. Marcar ingresos
3. Leer y escribir mensajes
4. Leer y escribir datos operativos del evento

Variables:

1. `GOOGLE_SERVICE_ACCOUNT_EMAIL`
2. `GOOGLE_PRIVATE_KEY`
3. `GOOGLE_SHEET_ID`

## Que se comparte con cada cuenta

### Para Drive

Compartir con la cuenta OAuth.

Carpetas que hay que compartir:

1. Carpeta raiz de fotos del evento.
2. Carpeta de contenido oficial.

Recomendacion de permisos:

1. Carpeta de fotos de invitados:
   - Editor o equivalente.
   - Necesita crear y mover archivos.

2. Carpeta de contenido oficial:
   - Lector alcanza si solo se consume.
   - Editor si eventualmente queres que el sistema tambien escriba ahi.

### Para Google Sheets

Compartir con el `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

El Service Account debe tener acceso al spreadsheet del evento.

Recomendacion de permisos:

1. Editor.

Motivo:

1. Necesita leer invitados.
2. Necesita marcar ingresos.
3. Puede necesitar escribir mensajes o datos operativos.

## Variables de entorno

### Drive de invitados

1. `GOOGLE_DRIVE_FOLDER_ID`
   - Carpeta raiz `photos` del evento.

### Drive de contenido oficial

1. `OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID`
   - Carpeta para `Ver Fotos Previas`.

2. `OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID`
   - Opcional.
   - Si no existe, el sistema usa la de preview tambien para `Contenido Oficial`.

### Google Sheets

1. `GOOGLE_SHEET_ID`
   - ID del spreadsheet del evento.

2. `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - Cuenta que debe tener acceso al Sheet.

3. `GOOGLE_PRIVATE_KEY`
   - Credencial privada del Service Account.

### Passwords

1. `MODERATION_PASSWORD`
   - Se usa para moderacion.
   - Tambien se usa para la pagina de invitados.

## Estructura recomendada en Drive

Ejemplo recomendado:

1. `02-Eventechy/events/00-demo/photos`
2. `02-Eventechy/events/00-demo/contenido-oficial`
3. `02-Eventechy/events/00-demo/sheet` o `02-Eventechy/events/00-demo/planilla`

Notas:

1. El Sheet puede vivir dentro de la carpeta del evento para orden interno.
2. El sistema no usa la ruta textual; usa los IDs de carpeta y Sheet.
3. La carpeta oficial no tiene que estar dentro de `photos`, pero conviene que quede dentro del arbol del evento para que el equipo no se confunda.

## Estructura esperada en la carpeta de fotos de invitados

Dentro de `GOOGLE_DRIVE_FOLDER_ID`:

1. `aprobadas`
2. `rechazadas`
3. `previa` opcional

Detalles:

1. `aprobadas` y `rechazadas` se crean automaticamente cuando el sistema las necesita.
2. El proyecto ya esta corregido para no reutilizar carpetas en papelera.
3. Las carpetas solo se buscan dentro del `folderId` actual del proyecto.

## Estructura esperada del Google Sheet

El proyecto usa varias hojas dentro del mismo spreadsheet.

### Hoja `Invitados`

Es la hoja principal para lista y check-in.

Columnas requeridas:

1. `ID`
2. `Nombre` o `Invitado`
3. `Ingreso`
4. `Fecha Hora Ingreso`

Columnas opcionales:

1. `Acompañantes`
2. `Mesa`

El sistema tolera variaciones de nombre de cabecera mientras sean equivalentes.

Ejemplos aceptados:

1. `Nombre`
2. `Invitado`
3. `Acompañantes`
4. `Acompanantes`
5. `Fecha Hora Ingreso`
6. `Fecha y Hora`

### Hoja `Mensajes`

Se usa para guardar y moderar mensajes del evento.

### Hoja `Datos`

Se usa para guardar datos operativos.

Ejemplos detectados en el proyecto:

1. token de Mercado Pago en `C2`
2. nombre del evento en `C3`
3. email organizador en `C4`
4. PIN de scanner en `C6`

## Como funciona la lista de invitados

### Lectura

La pagina de invitados:

1. consulta `/api/invitados`
2. valida la password en el header `x-invitados-password`
3. lee la hoja `Invitados`
4. aplica cache corta en servidor
5. permite busqueda por nombre o ID

### Check-in

Cuando se marca ingreso:

1. busca el invitado por `ID`
2. cambia la columna `Ingreso` a `TRUE`
3. completa `Fecha Hora Ingreso`
4. guarda los cambios en Google Sheets

### Password de invitados

La pagina `/invitados` reutiliza la misma password de moderacion.

Fuente:

1. `MODERATION_PASSWORD`

## Como coordinar con quien hace el contenido del evento

### Si es el cliente o anfitrion

Pedir:

1. cuenta Google desde la que comparte la carpeta
2. confirmacion de que la carpeta oficial es la correcta
3. fecha limite de carga del contenido previo
4. si va a haber solo fotos o tambien videos

### Si es un fotografo externo

Pedir:

1. nombre y contacto
2. cuenta Google con la que comparte la carpeta
3. confirmacion del formato de entrega
4. si va a cargar contenido antes del evento o durante el evento
5. si va a usar una sola carpeta o varias

## Checklist de setup por cada proyecto nuevo

### Paso 1: Crear estructura

1. Crear carpeta del evento.
2. Crear carpeta `photos`.
3. Crear carpeta de contenido oficial.
4. Crear o ubicar el Google Sheet del evento.

### Paso 2: Compartir correctamente

1. Compartir carpetas de Drive con la cuenta OAuth.
2. Compartir el Google Sheet con el `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

### Paso 3: Configurar variables

Completar:

```env
GOOGLE_DRIVE_FOLDER_ID=ID_CARPETA_PHOTOS
OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID=ID_CARPETA_CONTENIDO_OFICIAL
GOOGLE_SHEET_ID=ID_DEL_SPREADSHEET
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
MODERATION_PASSWORD=...
```

### Paso 4: Reiniciar

1. Reiniciar `npm run dev` o redeployar.

### Paso 5: Validar

1. Subir una foto de invitado.
2. Aprobarla.
3. Confirmar que aparece `aprobadas`.
4. Rechazar otra.
5. Confirmar `rechazadas`.
6. Abrir `Ver Fotos Previas`.
7. Abrir `Contenido Oficial`.
8. Abrir `/invitados`.
9. Buscar un invitado.
10. Marcar ingreso.

## Riesgos mas comunes

1. Compartir el Sheet con la cuenta OAuth en vez del Service Account.
2. Compartir Drive con el Service Account y creer que eso alcanza para el contenido oficial.
3. Pegar el ID de un archivo de Drive en vez del ID de una carpeta.
4. Reutilizar carpetas de un evento anterior.
5. Cambiar `.env` y no reiniciar el proyecto.
6. Borrar carpetas y que queden en papelera.
7. Usar un spreadsheet sin la hoja `Invitados`.
8. Cambiar nombres de columnas obligatorias por algo no reconocible.

## Recomendaciones operativas

1. Mantener una carpeta de evento por cliente.
2. Mantener dentro de esa carpeta:
   - `photos`
   - `contenido-oficial`
   - `sheet`
3. Registrar los `folderId` y `sheetId` del evento en una ficha interna.
4. No duplicar proyectos reutilizando `.env` del cliente anterior sin revisar todos los IDs.
5. Validar siempre una subida, una aprobacion y un check-in antes de entregar.

## Resumen final

1. Drive de invitados:
   - usa OAuth
   - se comparte con la cuenta OAuth
   - crea `aprobadas` y `rechazadas`

2. Drive de contenido oficial:
   - usa OAuth
   - se comparte con la cuenta OAuth
   - no pasa por moderacion

3. Google Sheets:
   - usa Service Account
   - se comparte con `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - maneja invitados, mensajes y datos operativos
