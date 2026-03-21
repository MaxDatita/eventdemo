# Configuración de Google Drive para Photo Wall

## Pasos para configurar Google Drive API

### 1. Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el ID del proyecto

### 2. Habilitar Google Drive API
1. Ve a "APIs & Services" > "Library"
2. Busca "Google Drive API"
3. Haz clic en "Enable"

### 3. Crear Service Account
1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "Service Account"
3. Completa los datos:
   - **Name**: `photo-wall-service`
   - **Description**: `Service account for Photo Wall feature`
4. Haz clic en "Create and Continue"
5. En "Grant this service account access to project":
   - **Role**: `Editor` (o `Storage Admin` si solo quieres acceso a Drive)
6. Haz clic en "Continue" y luego "Done"

### 4. Generar clave de Service Account
1. En la lista de Service Accounts, haz clic en el que acabas de crear
2. Ve a la pestaña "Keys"
3. Haz clic en "Add Key" > "Create new key"
4. Selecciona "JSON" y haz clic en "Create"
5. Se descargará un archivo JSON con las credenciales

### 5. Crear carpeta en Google Drive y compartirla con el Service Account
**⚠️ IMPORTANTE: Este paso es CRÍTICO. Sin esto, las subidas fallarán con error 403.**

1. Ve a [Google Drive](https://drive.google.com/)
2. Crea una nueva carpeta llamada "Photo Wall" (o usa una carpeta existente)
3. Abre el archivo JSON que descargaste en el paso 4
4. Busca el campo `client_email` (se ve algo como: `tu-service-account@tu-proyecto.iam.gserviceaccount.com`)
5. Haz clic derecho en la carpeta > **"Share"** (Compartir)
6. En el campo "Agregar personas y grupos", pega el email del Service Account (`client_email`)
7. **Selecciona el permiso "Editor" o "Colaborador"** (NO uses "Viewer" porque no puede escribir)
8. Haz clic en "Enviar" (puedes desmarcar "Notificar a las personas" si quieres)
9. **Obtén el ID de la carpeta:**
   - Abre la carpeta en Google Drive
   - Mira la URL: `https://drive.google.com/drive/folders/1ABC123DEF456GHI789JKL`
   - El ID es la parte después de `/folders/`: `1ABC123DEF456GHI789JKL`

### 6. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID=1ABC123DEF456GHI789JKL
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Photo Wall Configuration
PHOTO_WALL_MODE=moderation
MODERATION_PASSWORD=admin123
```

### 7. Obtener la clave privada
Del archivo JSON descargado, copia el valor de `private_key` y:
- Mantén las `\n` como están
- Envuelve todo el valor entre comillas dobles
- Ejemplo: `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"`

## Modos de funcionamiento

### Modo Moderación (`PHOTO_WALL_MODE=moderation`)
- Las fotos subidas requieren aprobación
- El moderador debe aprobar/rechazar desde `/moderacion`
- Solo las fotos aprobadas aparecen en la galería

### Modo Fotógrafo (`PHOTO_WALL_MODE=photographer`)
- Las fotos se muestran automáticamente
- No requiere moderación
- Ideal para eventos donde solo el fotógrafo sube fotos

## Verificación
Una vez configurado, reinicia el servidor de desarrollo:
```bash
npm run dev
```

Las fotos se subirán automáticamente a tu carpeta de Google Drive y aparecerán en la Photo Wall.

## Solución de problemas

### Error: "Service Accounts do not have storage quota" (⚠️ LIMITACIÓN IMPORTANTE)
**Causa:** Los Service Accounts de Google Drive **NO PUEDEN crear archivos directamente**, incluso si la carpeta está compartida. Esta es una limitación de Google Drive:
- ✅ Pueden crear **carpetas** (no ocupan almacenamiento)
- ✅ Pueden **mover** archivos existentes
- ✅ Pueden **leer** archivos
- ❌ **NO pueden crear archivos nuevos**

**Soluciones:**

**Opción 1: Usar Shared Drive (Recomendado si tienes Google Workspace)**
1. Crea una **Shared Drive** (Unidad compartida) en Google Workspace
2. Agrega el Service Account como miembro con rol **"Content Manager"** o **"Manager"**
3. Crea una carpeta dentro de la Shared Drive
4. Usa el ID de esa carpeta como `GOOGLE_DRIVE_FOLDER_ID`
5. **En Shared Drives, los Service Accounts SÍ pueden crear archivos**

**Opción 2: Domain-Wide Delegation (OAuth) - Avanzado**
Requiere configuración de OAuth para que el Service Account actúe en nombre de un usuario. Consulta: https://developers.google.com/identity/protocols/oauth2/service-account

**Opción 3: Workaround temporal**
1. Sube algunas fotos manualmente a la carpeta compartida (como plantillas)
2. El Service Account puede mover las fotos a carpetas de aprobadas/rechazadas
3. Para nuevas fotos, usa otro método (ej: formulario de Google Drive)

### Error: "Permission denied" o "403 Forbidden"
**Causa:** El Service Account no tiene permisos suficientes en la carpeta.

**Solución:**
1. Ve a Google Drive y verifica que la carpeta esté compartida correctamente
2. Asegúrate de que el email del Service Account tenga permisos de "Editor"
3. Si usas una carpeta existente, puede que esté en un Shared Drive. En ese caso, agrega el Service Account como miembro del Shared Drive

### Error: "Folder not found" o "404"
**Causa:** El `GOOGLE_DRIVE_FOLDER_ID` es incorrecto o la carpeta fue eliminada.

**Solución:**
1. Verifica que el ID de la carpeta en `.env.local` sea correcto
2. Verifica que la carpeta exista en Google Drive

