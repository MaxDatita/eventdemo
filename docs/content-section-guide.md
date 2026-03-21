# Seccion de Contenido

Esta guia documenta como funciona la seccion de contenido del evento, que carpetas de Google Drive intervienen, que datos hay que pedirle al cliente o al fotografo y que pasos seguir al clonar el proyecto para un evento nuevo.

## Objetivo

La seccion de contenido del evento cubre dos flujos distintos:

1. Contenido de invitados.
2. Contenido oficial.

Ambos flujos usan Google Drive, pero no siguen la misma logica.

## Flujo 1: Contenido de invitados

Este flujo corresponde a las fotos que suben los asistentes desde la app.

### Comportamiento

1. El invitado sube una foto.
2. La foto se guarda en la carpeta raiz de fotos del evento.
3. En moderacion se puede aprobar o rechazar.
4. Si se aprueba, la foto se mueve a la carpeta `aprobadas`.
5. Si se rechaza, la foto se mueve a la carpeta `rechazadas`.
6. La galeria de invitados y la proyeccion consumen las fotos aprobadas.

### Estructura esperada en Drive

Dentro de la carpeta `photos` del evento:

1. `photos/`
2. `photos/aprobadas/`
3. `photos/rechazadas/`
4. `photos/previa/` (opcional, solo si se usa ese flujo)

### Consideraciones

1. `aprobadas` y `rechazadas` se crean automaticamente cuando el sistema las necesita.
2. El sistema ya no reutiliza carpetas en papelera.
3. Cada proyecto queda atado al `GOOGLE_DRIVE_FOLDER_ID` actual. No debe mezclar carpetas de otro evento.

## Flujo 2: Contenido oficial

Este flujo corresponde a fotos y videos subidos por el cliente, los anfitriones o el fotografo.

### Comportamiento

1. No pasa por moderacion.
2. No usa la carpeta `aprobadas` de invitados.
3. La app lee directamente una carpeta de Google Drive configurada para contenido oficial.
4. Esa misma carpeta puede usarse para:
   - `Ver Fotos Previas`
   - `Contenido Oficial`

### Estructura recomendada en Drive

Opcion simple recomendada:

1. Crear una carpeta para contenido oficial del evento.
2. Compartirla con la cuenta de Google autenticada por OAuth del proyecto.
3. Cargar ahi fotos y videos.

Ejemplo:

1. `00-demo/photos/` para invitados
2. `00-demo/contenido-oficial/` para fotos y videos del cliente/fotografo

No es obligatorio que la carpeta oficial cuelgue de `photos`. Puede ser cualquier carpeta de Drive mientras:

1. el `folderId` sea correcto
2. la cuenta OAuth tenga acceso

### Consideraciones

1. Hoy `preview` y `live` pueden compartir la misma carpeta.
2. Si no se define carpeta `live`, el sistema usa la de `preview`.
3. El wall oficial soporta imagenes y videos.

## Variables de entorno

Estas son las variables relevantes para documentar y configurar en cada clonacion.

### Drive de invitados

1. `GOOGLE_DRIVE_FOLDER_ID`
   - Carpeta raiz de fotos del evento.
   - Dentro de esta carpeta se crean `aprobadas` y `rechazadas`.

### Drive de contenido oficial

1. `OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID`
   - Carpeta de fotos/videos oficiales.
   - Se usa para `Ver Fotos Previas`.
   - Si no se define `OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID`, tambien se usa para `Contenido Oficial`.

2. `OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID`
   - Opcional.
   - Solo usar si se quiere separar el contenido previo del contenido oficial del evento.

### OAuth

1. `GOOGLE_OAUTH_CLIENT_ID`
2. `GOOGLE_OAUTH_CLIENT_SECRET`
3. `GOOGLE_OAUTH_REFRESH_TOKEN`

Estas credenciales permiten que el backend acceda a las carpetas compartidas sin depender de una Shared Drive.

## Datos que hay que pedir para cada evento

### Minimo indispensable

1. `folderId` de la carpeta `photos` del evento.
2. `folderId` de la carpeta de contenido oficial.
3. Confirmacion de que ambas carpetas fueron compartidas con la cuenta OAuth correcta.

### Si hay fotografo externo

1. Nombre del responsable.
2. Mail o cuenta Google desde la que comparte la carpeta.
3. Confirmacion de si va a subir:
   - solo fotos
   - fotos y videos
4. Fecha limite para tener cargado el contenido previo.
5. Si el contenido oficial va a estar en una unica carpeta o separado en dos.

## Pasos al clonar el proyecto para un cliente nuevo

### Paso 1: Crear o recibir las carpetas

1. Crear o identificar la carpeta `photos` del evento.
2. Crear o identificar la carpeta de contenido oficial.
3. Confirmar que ambas pertenecen al evento correcto.

### Paso 2: Compartir carpetas

1. Compartir la carpeta `photos` con la cuenta OAuth del proyecto.
2. Compartir la carpeta de contenido oficial con la misma cuenta OAuth.
3. Validar permisos de lectura y escritura en `photos`.
4. Validar permisos de lectura en contenido oficial.

Nota:

Para invitados conviene dar permisos de escritura.
Para contenido oficial alcanza con lectura si el sistema solo va a consumir el contenido.

### Paso 3: Configurar `.env`

Completar como minimo:

```env
GOOGLE_DRIVE_FOLDER_ID=ID_CARPETA_PHOTOS
OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID=ID_CARPETA_CONTENIDO_OFICIAL
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...
```

Si se quiere separar preview y live:

```env
OFFICIAL_LIVE_GOOGLE_DRIVE_FOLDER_ID=ID_CARPETA_CONTENIDO_OFICIAL_LIVE
```

### Paso 4: Reiniciar entorno

1. Reiniciar `npm run dev` o redeployar si esta en hosting.
2. Verificar que el proyecto tome las variables nuevas.

### Paso 5: Validar funcionamiento

1. Subir una foto de invitado.
2. Aprobarla desde moderacion.
3. Confirmar que se creo `aprobadas` dentro de la carpeta `photos` correcta.
4. Rechazar otra foto.
5. Confirmar que se creo o uso `rechazadas` dentro de la misma carpeta `photos`.
6. Abrir `Ver Fotos Previas`.
7. Confirmar que muestra contenido de la carpeta oficial.
8. Abrir `Contenido Oficial`.
9. Confirmar que muestra la misma carpeta si no se definio una segunda.

## Checklist operativo con cliente o fotografo

Enviar este checklist antes del evento:

1. Crear carpeta de contenido oficial.
2. Compartir carpeta con la cuenta de Google indicada por Eventechy.
3. Cargar ahi fotos horizontales y verticales del evento o previa.
4. Si hay videos, subir archivos cortos y optimizados.
5. No renombrar ni mover la carpeta una vez configurada sin avisar.
6. No eliminar la carpeta durante el evento.

## Buenas practicas para el contenido oficial

1. Preferir imagenes JPG o WEBP.
2. Para videos, preferir MP4.
3. Evitar archivos extremadamente pesados.
4. Mantener nombres simples de archivo.
5. No usar carpetas compartidas equivocadas entre eventos.

## Riesgos a evitar

1. Reutilizar `folderId` de otro cliente.
2. Pegar el ID de un archivo en vez del ID de una carpeta.
3. Apuntar a una carpeta en papelera.
4. No reiniciar el proyecto despues de cambiar `.env`.
5. Compartir la carpeta equivocada con la cuenta OAuth.

## Diagnostico rapido

Si algo falla, revisar en este orden:

1. El `folderId` cargado en `.env` corresponde a la carpeta correcta.
2. La carpeta esta compartida con la cuenta OAuth correcta.
3. Se reinicio el server o el deploy.
4. La carpeta no esta en papelera.
5. El contenido oficial realmente esta dentro de esa carpeta y no dentro de una subcarpeta no contemplada.

## Resumen operativo

1. Invitados:
   - usan `GOOGLE_DRIVE_FOLDER_ID`
   - crean `aprobadas` y `rechazadas`
   - pasan por moderacion

2. Oficial:
   - usa `OFFICIAL_PREVIEW_GOOGLE_DRIVE_FOLDER_ID`
   - no pasa por moderacion
   - puede mostrar fotos y videos
   - puede compartir la misma carpeta para preview y live
