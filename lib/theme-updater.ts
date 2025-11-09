import fs from 'fs';
import path from 'path';

/**
 * Lee el archivo theme.ts de forma segura
 */
export function readThemeFile(): string {
  const themePath = path.join(process.cwd(), 'config', 'theme.ts');
  return fs.readFileSync(themePath, 'utf-8');
}

/**
 * Actualiza el archivo theme.ts de forma segura
 * Preserva el formato y comentarios existentes
 */
export function updateThemeFile(updates: {
  lotes?: {
    enabled?: boolean;
    maxTicketsPerLot?: number;
    currentLot?: number;
    soldOutMessage?: string;
    nextLotMessage?: string;
  };
  ticketTypes?: Array<{
    id: string;
    name: string;
    maxPerLot?: number;
  }>;
  rsvpButton?: {
    mode?: 'tickets' | 'rsvp' | 'both';
  };
}): { success: boolean; error?: string } {
  try {
    const themePath = path.join(process.cwd(), 'config', 'theme.ts');
    const content = fs.readFileSync(themePath, 'utf-8');

    let updatedContent = content;

    // Actualizar configuración de lotes dentro del bloque lotes
    if (updates.lotes) {
      // Buscar el bloque lotes dentro de tickets - más específico
      const lotesBlockRegex = /lotes:\s*\{([\s\S]*?)\n\s*\},/;
      const match = content.match(lotesBlockRegex);
      
      if (match) {
        let lotesContent = match[1];
        
        if (updates.lotes.enabled !== undefined) {
          lotesContent = lotesContent.replace(
            /enabled:\s*(true|false)/,
            `enabled: ${updates.lotes.enabled}`
          );
        }
        if (updates.lotes.maxTicketsPerLot !== undefined) {
          lotesContent = lotesContent.replace(
            /maxTicketsPerLot:\s*\d+/,
            `maxTicketsPerLot: ${updates.lotes.maxTicketsPerLot}`
          );
        }
        if (updates.lotes.currentLot !== undefined) {
          lotesContent = lotesContent.replace(
            /currentLot:\s*\d+/,
            `currentLot: ${updates.lotes.currentLot}`
          );
        }
        if (updates.lotes.soldOutMessage !== undefined) {
          // Escapar comillas dobles en el mensaje
          const escapedMessage = updates.lotes.soldOutMessage.replace(/"/g, '\\"');
          lotesContent = lotesContent.replace(
            /soldOutMessage:\s*"[^"]*"/,
            `soldOutMessage: "${escapedMessage}"`
          );
        }
        if (updates.lotes.nextLotMessage !== undefined) {
          // Escapar comillas dobles en el mensaje
          const escapedMessage = updates.lotes.nextLotMessage.replace(/"/g, '\\"');
          lotesContent = lotesContent.replace(
            /nextLotMessage:\s*"[^"]*"/,
            `nextLotMessage: "${escapedMessage}"`
          );
        }
        
        updatedContent = updatedContent.replace(
          lotesBlockRegex,
          `lotes: {${lotesContent}\n    },`
        );
      }
    }

    // Actualizar tipos de tickets
    if (updates.ticketTypes) {
      // Construir el nuevo array de tipos de tickets
      const typesArray = updates.ticketTypes.map(type => {
        const maxPerLot = type.maxPerLot !== undefined ? `maxPerLot: ${type.maxPerLot}` : '';
        return `      {
        id: '${type.id}',
        name: '${type.name}',
        ${maxPerLot ? `${maxPerLot},` : ''} // ${maxPerLot ? 'sin límite específico' : '0 para sin límite específico para este tipo'}
      }`;
      }).join(',\n');

      // Reemplazar el array completo de types
      const typesRegex = /types:\s*\[[\s\S]*?\],/;
      updatedContent = updatedContent.replace(
        typesRegex,
        `types: [\n${typesArray}\n    ]`
      );
    }

    // Actualizar rsvpButton.mode
    if (updates.rsvpButton?.mode !== undefined) {
      const modeValue = updates.rsvpButton.mode;
      // Buscar y reemplazar el mode dentro de rsvpButton
      // El regex busca rsvpButton: { ... }
      const rsvpButtonRegex = /rsvpButton:\s*\{([\s\S]*?)\n\s*\},/;
      const rsvpMatch = updatedContent.match(rsvpButtonRegex);
      
      if (rsvpMatch) {
        let rsvpContent = rsvpMatch[1];
        // Reemplazar el mode, buscando el patrón: mode: 'tickets' o mode: 'rsvp' o mode: 'both'
        rsvpContent = rsvpContent.replace(
          /mode:\s*['"](tickets|rsvp|both)['"]([^,]*)/,
          `mode: '${modeValue}'$2`
        );
        
        updatedContent = updatedContent.replace(
          rsvpButtonRegex,
          `rsvpButton: {${rsvpContent}\n  },`
        );
      }
    }

    // Crear backup antes de escribir
    const backupPath = `${themePath}.backup`;
    fs.writeFileSync(backupPath, content);

    // Escribir el archivo actualizado
    fs.writeFileSync(themePath, updatedContent, 'utf-8');

    return { success: true };
  } catch (error) {
    console.error('Error updating theme file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene la configuración actual de theme.ts
 */
export async function getThemeConfig() {
  try {
    // Importar dinámicamente el theme usando import dinámico
    const themeModule = await import('@/config/theme');
    return themeModule.theme;
  } catch (error) {
    console.error('Error reading theme config:', error);
    return null;
  }
}

