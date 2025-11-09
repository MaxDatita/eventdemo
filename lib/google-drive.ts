import { google } from 'googleapis';
import { Readable } from 'stream';

// Cliente de Google Drive lazy (se crea solo cuando se necesita)
let driveClient: ReturnType<typeof google.drive> | null = null;

// Función para obtener cliente de Google Drive (con manejo de errores)
function getDriveClient() {
  if (driveClient) {
    return driveClient;
  }

  try {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY no están configurados');
    }

    // Validar formato básico de la clave privada
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.warn('ADVERTENCIA: La clave privada puede no estar en el formato correcto');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (error) {
    console.error('Error creando cliente de Google Drive:', error);
    throw error;
  }
}

export interface DrivePhoto {
  id: string;
  name: string;
  webViewLink: string;
  thumbnailLink: string;
  webContentLink: string;
  createdTime: string;
  owners: Array<{ displayName: string }>;
  mimeType?: string;
}

export class GoogleDriveService {
  private folderId: string;
  private approvedFolderId: string | null = null;
  private rejectedFolderId: string | null = null;
  private previaFolderId: string | null = null;
  // Promesas compartidas para evitar crear carpetas duplicadas en llamadas concurrentes
  private creatingApprovedFolder: Promise<string> | null = null;
  private creatingRejectedFolder: Promise<string> | null = null;

  constructor() {
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    if (!this.folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID no está configurado');
    }
  }

  // Crear o obtener carpeta de aprobadas
  async getOrCreateApprovedFolder(): Promise<string> {
    // Si ya tenemos el ID en cache, retornarlo inmediatamente
    if (this.approvedFolderId) return this.approvedFolderId;
    
    // Si hay una creación en curso, esperar a que termine en lugar de crear otra
    if (this.creatingApprovedFolder) {
      return await this.creatingApprovedFolder;
    }
    
    // Crear una Promise compartida para la creación
    this.creatingApprovedFolder = (async () => {
      try {
        // Buscar carpeta existente
        const response = await getDriveClient().files.list({
          q: `'${this.folderId}' in parents and name='aprobadas' and mimeType='application/vnd.google-apps.folder'`,
          fields: 'files(id,name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          corpora: 'allDrives',
        });

        if (response.data.files && response.data.files.length > 0) {
          // Si hay múltiples carpetas, usar la primera y eliminar las demás
          const folderId = response.data.files[0].id!;
          this.approvedFolderId = folderId;
          
          // Eliminar carpetas duplicadas si existen
          if (response.data.files.length > 1) {
            console.warn(`Se encontraron ${response.data.files.length} carpetas "aprobadas". Usando la primera y eliminando duplicados.`);
            for (let i = 1; i < response.data.files.length; i++) {
              try {
                await getDriveClient().files.delete({ 
                  fileId: response.data.files[i].id!,
                  supportsAllDrives: true,
                });
              } catch (e) {
                console.error(`Error eliminando carpeta duplicada ${response.data.files[i].id}:`, e);
              }
            }
          }
          
          this.creatingApprovedFolder = null; // Limpiar la Promise compartida
          return folderId;
        }

        // Crear carpeta si no existe
        const folderResponse = await getDriveClient().files.create({
          requestBody: {
            name: 'aprobadas',
            mimeType: 'application/vnd.google-apps.folder',
            parents: [this.folderId],
          },
          fields: 'id',
          supportsAllDrives: true,
          supportsTeamDrives: true,
        });

        const folderId = folderResponse.data.id!;
        this.approvedFolderId = folderId;
        this.creatingApprovedFolder = null; // Limpiar la Promise compartida
        return folderId;
      } catch (error) {
        this.creatingApprovedFolder = null; // Limpiar la Promise compartida en caso de error
        console.error('Error creating/getting approved folder:', error);
        throw new Error('Error al crear/obtener carpeta de aprobadas');
      }
    })();
    
    return await this.creatingApprovedFolder;
  }

  // Obtener carpeta de previa (sin crear)
  async getPreviaFolder(): Promise<string | null> {
    // Si ya tenemos el ID en cache, retornarlo inmediatamente
    if (this.previaFolderId) return this.previaFolderId;
    
    try {
      // Buscar carpeta existente
      const response = await getDriveClient().files.list({
        q: `'${this.folderId}' in parents and name='previa' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id,name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });

      if (response.data.files && response.data.files.length > 0) {
        // Si hay múltiples carpetas, usar la primera
        const folderId = response.data.files[0].id!;
        this.previaFolderId = folderId;
        return folderId;
      }

      // Si no existe, retornar null (no se crea automáticamente)
      return null;
    } catch (error) {
      console.error('Error getting previa folder:', error);
      return null;
    }
  }

  // Crear o obtener carpeta de rechazadas
  async getOrCreateRejectedFolder(): Promise<string> {
    // Si ya tenemos el ID en cache, retornarlo inmediatamente
    if (this.rejectedFolderId) return this.rejectedFolderId;
    
    // Si hay una creación en curso, esperar a que termine en lugar de crear otra
    if (this.creatingRejectedFolder) {
      return await this.creatingRejectedFolder;
    }
    
    // Crear una Promise compartida para la creación
    this.creatingRejectedFolder = (async () => {
      try {
        // Buscar carpeta existente
        const response = await getDriveClient().files.list({
          q: `'${this.folderId}' in parents and name='rechazadas' and mimeType='application/vnd.google-apps.folder'`,
          fields: 'files(id,name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          corpora: 'allDrives',
        });

        if (response.data.files && response.data.files.length > 0) {
          // Si hay múltiples carpetas, usar la primera y eliminar las demás
          const folderId = response.data.files[0].id!;
          this.rejectedFolderId = folderId;
          
          // Eliminar carpetas duplicadas si existen
          if (response.data.files.length > 1) {
            console.warn(`Se encontraron ${response.data.files.length} carpetas "rechazadas". Usando la primera y eliminando duplicados.`);
            for (let i = 1; i < response.data.files.length; i++) {
              try {
                await getDriveClient().files.delete({ 
                  fileId: response.data.files[i].id!,
                  supportsAllDrives: true,
                });
              } catch (e) {
                console.error(`Error eliminando carpeta duplicada ${response.data.files[i].id}:`, e);
              }
            }
          }
          
          this.creatingRejectedFolder = null; // Limpiar la Promise compartida
          return folderId;
        }

        // Crear carpeta si no existe
        const folderResponse = await getDriveClient().files.create({
          requestBody: {
            name: 'rechazadas',
            mimeType: 'application/vnd.google-apps.folder',
            parents: [this.folderId],
          },
          fields: 'id',
          supportsAllDrives: true,
          supportsTeamDrives: true,
        });

        const folderId = folderResponse.data.id!;
        this.rejectedFolderId = folderId;
        this.creatingRejectedFolder = null; // Limpiar la Promise compartida
        return folderId;
      } catch (error) {
        this.creatingRejectedFolder = null; // Limpiar la Promise compartida en caso de error
        console.error('Error creating/getting rejected folder:', error);
        throw new Error('Error al crear/obtener carpeta de rechazadas');
      }
    })();
    
    return await this.creatingRejectedFolder;
  }

  // Mover archivo a otra carpeta
  async moveFile(fileId: string, targetFolderId: string): Promise<void> {
    try {
      // Obtener las carpetas actuales del archivo
      const file = await getDriveClient().files.get({
        fileId: fileId,
        fields: 'parents',
        supportsAllDrives: true,
      });

      const previousParents = file.data.parents?.join(',') || '';

      // Mover el archivo
      await getDriveClient().files.update({
        fileId: fileId,
        addParents: targetFolderId,
        removeParents: previousParents,
        fields: 'id, parents',
        supportsAllDrives: true,
        supportsTeamDrives: true,
      });
    } catch (error) {
      console.error('Error moving file:', error);
      throw new Error('Error al mover el archivo');
    }
  }

  // Subir foto a Google Drive
  async uploadPhoto(file: Buffer, filename: string, username: string): Promise<DrivePhoto> {
    try {
      // Crear el archivo directamente en la carpeta compartida (igual que las carpetas)
      const fileMetadata = {
        name: `${username}_${Date.now()}_${filename}`,
        parents: [this.folderId], // Mismo approach que crear carpetas
      };

      // Convertir Buffer a Stream
      const stream = Readable.from(file);

      const media = {
        mimeType: 'image/jpeg',
        body: stream,
      };

      console.log('Subiendo foto a Google Drive...', { filename, folderId: this.folderId });

      const drive = getDriveClient();
      
      // Crear directamente en la carpeta compartida o Shared Drive
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,thumbnailLink,createdTime,owners,webContentLink',
        supportsAllDrives: true, // Necesario para Shared Drives
        supportsTeamDrives: true, // Necesario para Shared Drives (legacy)
      });

      if (!response.data.id) {
        throw new Error('No se recibió el ID del archivo subido');
      }

      const fileId = response.data.id;
      console.log('Foto subida exitosamente:', fileId);

      // Hacer la imagen pública para lectura
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
          supportsAllDrives: true, // Necesario para Shared Drives
          supportsTeamDrives: true, // Necesario para Shared Drives (legacy)
        });
        console.log('Permisos públicos configurados para:', fileId);
      } catch (permError) {
        console.warn('No se pudieron configurar permisos públicos (puede que ya existan):', permError);
      }

      return {
        id: fileId,
        name: response.data.name || fileMetadata.name,
        webViewLink: response.data.webViewLink || '',
        thumbnailLink: response.data.thumbnailLink || '',
        webContentLink: response.data.webContentLink || '',
        createdTime: response.data.createdTime || new Date().toISOString(),
        owners: (response.data.owners || []).map(owner => ({
          displayName: owner.displayName || 'Unknown'
        })),
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('storage quota')) {
          const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
          throw new Error(`La carpeta debe estar compartida con el Service Account (${serviceAccountEmail}) con permisos de Editor. Los Service Accounts no tienen almacenamiento propio, por lo que necesitan que la carpeta esté compartida.`);
        }
        if (error.message.includes('Google Drive') || error.message.includes('carpeta')) {
          throw error;
        }
        throw new Error(`Error al subir la foto a Google Drive: ${error.message}`);
      }
      
      throw new Error('Error al subir la foto a Google Drive: Error desconocido');
    }
  }

  // Obtener todas las fotos de la carpeta principal (pendientes)
  // Excluye las que están en carpetas de aprobadas o rechazadas
  async getPhotos(): Promise<DrivePhoto[]> {
    try {
      const approvedFolderId = await this.getOrCreateApprovedFolder();
      const rejectedFolderId = await this.getOrCreateRejectedFolder();
      
      // Obtener SOLO fotos que están DIRECTAMENTE en la carpeta principal
      const response = await getDriveClient().files.list({
        q: `'${this.folderId}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: 'files(id,name,webViewLink,thumbnailLink,webContentLink,createdTime,owners,parents)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });

      // Filtrar para excluir las que están en carpetas aprobadas/rechazadas
      const photos = response.data.files?.filter(file => {
        const parents = file.parents || [];
        const isInMainFolder = parents.includes(this.folderId);
        const isInApprovedFolder = parents.includes(approvedFolderId);
        const isInRejectedFolder = parents.includes(rejectedFolderId);
        
        return isInMainFolder && !isInApprovedFolder && !isInRejectedFolder;
      }).map(file => ({
        id: file.id!,
        name: file.name!,
        webViewLink: file.webViewLink!,
        thumbnailLink: file.thumbnailLink!,
        webContentLink: file.webContentLink!,
        createdTime: file.createdTime!,
        owners: (file.owners || []).map(owner => ({
          displayName: owner.displayName || 'Unknown'
        })),
      })) || [];

      return photos;
    } catch (error) {
      console.error('Error fetching photos from Google Drive:', error);
      throw new Error('Error al obtener fotos de Google Drive');
    }
  }

  // Obtener fotos aprobadas
  async getApprovedPhotos(): Promise<DrivePhoto[]> {
    try {
      const approvedFolderId = await this.getOrCreateApprovedFolder();
      
      const response = await getDriveClient().files.list({
        q: `'${approvedFolderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
        fields: 'files(id,name,webViewLink,thumbnailLink,webContentLink,createdTime,owners,mimeType)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });

      const files = response.data.files || [];
      
      // Para videos, asegurarse de que sean públicos para poder usar webContentLink
      const filesWithPublicAccess = await Promise.all(
        files.map(async (file) => {
          // Si es un video y no tiene webContentLink, intentar hacerlo público
          if (file.mimeType?.includes('video/') && !file.webContentLink) {
            try {
              // Verificar permisos actuales
              const permissions = await getDriveClient().permissions.list({
                fileId: file.id!,
                supportsAllDrives: true,
              });
              
              const isPublic = permissions.data.permissions?.some(
                (p) => p.type === 'anyone' && p.role === 'reader'
              );
              
              if (!isPublic) {
                // Hacer el archivo público
                await getDriveClient().permissions.create({
                  fileId: file.id!,
                  requestBody: {
                    role: 'reader',
                    type: 'anyone',
                  },
                  supportsAllDrives: true,
                });
                console.log(`Video ${file.id} made public`);
                
                // Re-obtener el archivo para tener webContentLink
                const updatedFile = await getDriveClient().files.get({
                  fileId: file.id!,
                  fields: 'id,name,webViewLink,thumbnailLink,webContentLink,createdTime,owners,mimeType',
                  supportsAllDrives: true,
                });
                
                return {
                  id: updatedFile.data.id!,
                  name: updatedFile.data.name!,
                  webViewLink: updatedFile.data.webViewLink!,
                  thumbnailLink: updatedFile.data.thumbnailLink!,
                  webContentLink: updatedFile.data.webContentLink!,
                  createdTime: updatedFile.data.createdTime!,
                  mimeType: updatedFile.data.mimeType || '',
                  owners: (updatedFile.data.owners || []).map(owner => ({
                    displayName: owner.displayName || 'Unknown'
                  })),
                };
              }
            } catch (error) {
              console.warn(`Could not make video ${file.id} public:`, error);
            }
          }
          
          return {
            id: file.id!,
            name: file.name!,
            webViewLink: file.webViewLink!,
            thumbnailLink: file.thumbnailLink!,
            webContentLink: file.webContentLink!,
            createdTime: file.createdTime!,
            mimeType: file.mimeType || '',
            owners: (file.owners || []).map(owner => ({
              displayName: owner.displayName || 'Unknown'
            })),
          };
        })
      );
      
      return filesWithPublicAccess;
    } catch (error) {
      console.error('Error fetching approved photos from Google Drive:', error);
      throw new Error('Error al obtener fotos aprobadas');
    }
  }

  // Obtener fotos rechazadas
  async getRejectedPhotos(): Promise<DrivePhoto[]> {
    try {
      const rejectedFolderId = await this.getOrCreateRejectedFolder();
      
      const response = await getDriveClient().files.list({
        q: `'${rejectedFolderId}' in parents and mimeType contains 'image/'`,
        fields: 'files(id,name,webViewLink,thumbnailLink,webContentLink,createdTime,owners)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });

      return response.data.files?.map(file => ({
        id: file.id!,
        name: file.name!,
        webViewLink: file.webViewLink!,
        thumbnailLink: file.thumbnailLink!,
        webContentLink: file.webContentLink!,
        createdTime: file.createdTime!,
        owners: (file.owners || []).map(owner => ({
          displayName: owner.displayName || 'Unknown'
        })),
      })) || [];
    } catch (error) {
      console.error('Error fetching rejected photos from Google Drive:', error);
      throw new Error('Error al obtener fotos rechazadas');
    }
  }

  // Obtener fotos y videos de previa
  async getPreviaPhotos(): Promise<DrivePhoto[]> {
    try {
      const previaFolderId = await this.getPreviaFolder();
      
      // Si no existe la carpeta, retornar array vacío
      if (!previaFolderId) {
        return [];
      }
      
      // Buscar tanto imágenes como videos
      const response = await getDriveClient().files.list({
        q: `'${previaFolderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/')`,
        fields: 'files(id,name,webViewLink,thumbnailLink,webContentLink,createdTime,owners,mimeType)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
      });

      const files = response.data.files || [];
      
      // Para videos, asegurarse de que sean públicos para poder usar webContentLink
      const filesWithPublicAccess = await Promise.all(
        files.map(async (file) => {
          // Si es un video y no tiene webContentLink, intentar hacerlo público
          if (file.mimeType?.includes('video/') && !file.webContentLink) {
            try {
              // Verificar permisos actuales
              const permissions = await getDriveClient().permissions.list({
                fileId: file.id!,
                supportsAllDrives: true,
              });
              
              const isPublic = permissions.data.permissions?.some(
                (p) => p.type === 'anyone' && p.role === 'reader'
              );
              
              if (!isPublic) {
                // Hacer el archivo público
                await getDriveClient().permissions.create({
                  fileId: file.id!,
                  requestBody: {
                    role: 'reader',
                    type: 'anyone',
                  },
                  supportsAllDrives: true,
                });
                console.log(`Video ${file.id} made public`);
                
                // Re-obtener el archivo para tener webContentLink
                const updatedFile = await getDriveClient().files.get({
                  fileId: file.id!,
                  fields: 'id,name,webViewLink,thumbnailLink,webContentLink,createdTime,owners,mimeType',
                  supportsAllDrives: true,
                });
                
                return {
                  id: updatedFile.data.id!,
                  name: updatedFile.data.name!,
                  webViewLink: updatedFile.data.webViewLink!,
                  thumbnailLink: updatedFile.data.thumbnailLink!,
                  webContentLink: updatedFile.data.webContentLink!,
                  createdTime: updatedFile.data.createdTime!,
                  mimeType: updatedFile.data.mimeType || '',
                  owners: (updatedFile.data.owners || []).map(owner => ({
                    displayName: owner.displayName || 'Unknown'
                  })),
                };
              }
            } catch (error) {
              console.warn(`Could not make video ${file.id} public:`, error);
            }
          }
          
          return {
            id: file.id!,
            name: file.name!,
            webViewLink: file.webViewLink!,
            thumbnailLink: file.thumbnailLink!,
            webContentLink: file.webContentLink!,
            createdTime: file.createdTime!,
            mimeType: file.mimeType || '',
            owners: (file.owners || []).map(owner => ({
              displayName: owner.displayName || 'Unknown'
            })),
          };
        })
      );
      
      return filesWithPublicAccess;
    } catch (error) {
      console.error('Error fetching previa photos from Google Drive:', error);
      // Retornar array vacío en caso de error en lugar de lanzar excepción
      return [];
    }
  }

  // Eliminar foto
  async deletePhoto(fileId: string): Promise<void> {
    try {
      await getDriveClient().files.delete({
        fileId: fileId,
        supportsAllDrives: true,
      });
    } catch (error) {
      console.error('Error deleting photo from Google Drive:', error);
      throw new Error('Error al eliminar la foto de Google Drive');
    }
  }

  // Hacer todas las imágenes existentes públicas
  async makeAllPhotosPublic(): Promise<void> {
    try {
      const photos = await this.getPhotos();
      
      for (const photo of photos) {
        try {
          await getDriveClient().permissions.create({
            fileId: photo.id,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
            supportsAllDrives: true,
            supportsTeamDrives: true,
          });
        } catch (error) {
          console.warn(`No se pudo hacer pública la imagen ${photo.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error making photos public:', error);
      throw new Error('Error al hacer públicas las fotos');
    }
  }

  // Verificar si la carpeta existe y es accesible
  async verifyFolder(): Promise<boolean> {
    try {
      const drive = getDriveClient();
      const response = await drive.files.get({
        fileId: this.folderId,
        fields: 'id,name,capabilities',
        supportsAllDrives: true,
      });
      
      if (!response.data.id) {
        throw new Error('La carpeta no existe');
      }

      const capabilities = response.data.capabilities;
      if (capabilities && !capabilities.canEdit && !capabilities.canAddChildren) {
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        throw new Error(`No tienes permisos de escritura en esta carpeta. Por favor, comparte la carpeta "${response.data.name}" con el Service Account: ${serviceAccountEmail} y dale permisos de "Editor" o "Colaborador".`);
      }

      return true;
    } catch (error) {
      console.error('Error verifying Google Drive folder:', error);
      
      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase();
        if (errorStr.includes('permission') || errorStr.includes('403') || errorStr.includes('storage quota')) {
          const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
          throw new Error(`La carpeta de Google Drive debe estar compartida con el Service Account. Comparte la carpeta con: ${serviceAccountEmail} y dale permisos de "Editor" o "Colaborador". Más información: https://developers.google.com/workspace/drive/api/guides/about-shareddrives`);
        }
      }
      
      throw error;
    }
  }
}

// Función para convertir URL de Google Drive a URL directa de imagen
export function getDirectImageUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

// Función para obtener thumbnail optimizado
export function getThumbnailUrl(fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const sizeMap = {
    small: 'w150-h150',
    medium: 'w200-h200',
    large: 'w300-h300'
  };
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${sizeMap[size]}`;
}

// Función para obtener imagen directa usando la URL final de Google Drive
export function getDirectDownloadUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
}

// Función para obtener URL de video de Google Drive (para reproducir en <video> tag)
export function getVideoUrl(fileId: string): string {
  // Usar la URL de visualización de Google Drive que funciona mejor con <video> tags
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Función para obtener thumbnail de video de Google Drive
export function getVideoThumbnailUrl(fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const sizeMap = {
    small: 'w150-h150',
    medium: 'w400-h300',
    large: 'w800-h600'
  };
  // Google Drive genera thumbnails automáticamente para videos
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${sizeMap[size]}`;
}

// Instancia singleton con manejo de errores
let googleDriveServiceInstance: GoogleDriveService | null = null;

export function getGoogleDriveService(): GoogleDriveService | null {
  // Solo inicializar si las variables de entorno están configuradas
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID || 
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 
      !process.env.GOOGLE_PRIVATE_KEY) {
    return null;
  }

  if (!googleDriveServiceInstance) {
    try {
      googleDriveServiceInstance = new GoogleDriveService();
    } catch (error) {
      console.error('Error inicializando GoogleDriveService:', error);
      return null;
    }
  }
  return googleDriveServiceInstance;
}

