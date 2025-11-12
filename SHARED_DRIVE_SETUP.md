# Configuración de Shared Drive (Unidad Compartida) - Google Workspace

Esta guía te ayudará a configurar una **Shared Drive** (Unidad Compartida) en Google Workspace para que el Service Account pueda crear archivos automáticamente.

## ⚠️ Por qué Shared Drive?

Los Service Accounts de Google Drive **NO pueden crear archivos** en carpetas compartidas normales (error "storage quota"). Sin embargo, **SÍ pueden crear archivos** en **Shared Drives** de Google Workspace.

---

## Paso 1: Crear Shared Drive (Unidad Compartida)

1. Ve a [Google Drive](https://drive.google.com/)
2. En el menú lateral izquierdo, haz clic en **"Unidades compartidas"** (Shared drives)
3. Haz clic en el botón **"+ Nueva"** (o **"Crear unidad compartida"**)
4. Completa el formulario:
   - **Nombre**: `Photo Wall Eventos` (o el nombre que prefieras)
   - **Tipo de acceso** (opcional): Deja el predeterminado
5. Haz clic en **"Crear"**

✅ Ya tienes tu Shared Drive creado.

---

## Paso 2: Agregar Service Account como Miembro

1. Abre tu **Shared Drive** recién creado
2. Haz clic en el nombre de la unidad compartida (arriba a la izquierda)
3. Haz clic en **"Gestionar miembros"** o en el ícono de **"Compartir"** (👥)
4. En el campo **"Agregar personas y grupos"**, pega el email de tu Service Account:
   - Ejemplo: `invitacionprueba@proyect-invitacion.iam.gserviceaccount.com`
   - **Nota**: Este email está en tu archivo JSON de credenciales (campo `client_email`)
5. En el menú desplegable de permisos, selecciona:
   - **"Gestor de contenido"** (Content Manager) ✅ **RECOMENDADO**
   - O **"Gestor"** (Manager) si no aparece la opción anterior
6. **Deselecciona** "Enviar notificación por correo electrónico" (no es necesario)
7. Haz clic en **"Enviar"** o **"Listo"**

✅ El Service Account ya es miembro de la Shared Drive con permisos de escritura.

---

## Paso 3: Crear Carpeta Dentro de la Shared Drive

1. Dentro de tu **Shared Drive**, haz clic en **"+ Nuevo"** > **"Carpeta"**
2. Nombra la carpeta: `Fotos del Evento` (o el nombre que prefieras)
3. Haz clic en **"Crear"**
4. **Abre la carpeta** haciendo doble clic

✅ Ya tienes una carpeta dentro de la Shared Drive.

---

## Paso 4: Obtener el ID de la Carpeta

1. Con la carpeta abierta dentro de la Shared Drive, mira la **URL en el navegador**
2. La URL se verá así:
   ```
   https://drive.google.com/drive/folders/1ABC123DEF456GHI789JKL
   ```
3. **Copia solo la parte después de `/folders/`**: `1ABC123DEF456GHI789JKL`
4. Este es tu **`GOOGLE_DRIVE_FOLDER_ID`**

✅ Ya tienes el ID de la carpeta.

---

## Paso 5: Actualizar Variables de Entorno

1. Abre tu archivo `.env.local` en la raíz del proyecto
2. Actualiza o verifica estas variables:

```env
# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_ID=1ABC123DEF456GHI789JKL  # ← El ID que copiaste en el paso 4
GOOGLE_SERVICE_ACCOUNT_EMAIL=invitacionprueba@proyect-invitacion.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Photo Wall Configuration
PHOTO_WALL_MODE=moderation
MODERATION_PASSWORD=admin123
```

**Importante**: 
- El `GOOGLE_DRIVE_FOLDER_ID` debe ser el ID de la **carpeta dentro de la Shared Drive**, NO el ID de la Shared Drive misma
- El `GOOGLE_PRIVATE_KEY` debe estar entre comillas dobles y mantener los `\n`

✅ Variables actualizadas.

---

## Paso 6: Verificar Configuración

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Prueba subir una foto** desde la aplicación:
   - Abre la app en tu navegador
   - Ve a "Contenido del Evento"
   - Haz clic en "Tomar Foto"
   - Toma una foto y súbela

3. **Verifica en Google Drive**:
   - Ve a tu Shared Drive
   - Abre la carpeta que creaste
   - Deberías ver la foto que acabas de subir

✅ ¡Todo configurado! Las fotos ahora se subirán automáticamente.

---

## Solución de Problemas

### Error: "Folder not found" (404)
- Verifica que el `GOOGLE_DRIVE_FOLDER_ID` sea el ID de la **carpeta dentro de la Shared Drive**, no el ID de la Shared Drive
- Asegúrate de que la carpeta esté dentro de la Shared Drive

### Error: "Permission denied" (403)
- Verifica que el Service Account sea **miembro de la Shared Drive** (no solo compartido)
- Asegúrate de que el rol sea **"Gestor de contenido"** (Content Manager) o **"Gestor"** (Manager)
- El Service Account debe estar agregado **directamente a la Shared Drive**, no solo a la carpeta

### Error: "Service Accounts do not have storage quota"
- Si sigues viendo este error, verifica que:
  1. La carpeta esté **dentro de una Shared Drive** (no en "Mi unidad")
  2. El Service Account sea **miembro de la Shared Drive** (no solo compartido)
  3. El rol del Service Account sea **"Gestor de contenido"** o superior

### ¿Cómo verificar que la carpeta está en una Shared Drive?
- En Google Drive, la carpeta debe aparecer cuando estás dentro de "Unidades compartidas"
- Si la carpeta aparece en "Mi unidad", está en el lugar incorrecto

---

## Estructura Recomendada

```
Shared Drive: "Photo Wall Eventos"
├── Carpeta: "Fotos del Evento" ← Usa el ID de esta carpeta
│   ├── Fotos subidas por usuarios...
│   ├── carpeta "aprobadas" (creada automáticamente)
│   └── carpeta "rechazadas" (creada automáticamente)
```

---

## Próximos Pasos

Una vez configurado:
1. Las fotos se subirán automáticamente a la Shared Drive
2. Si usas modo `moderation`, las fotos pendientes estarán en la carpeta principal
3. Las fotos aprobadas se moverán a la subcarpeta "aprobadas"
4. Las fotos rechazadas se moverán a la subcarpeta "rechazadas"

¡Listo para usar! 🎉








