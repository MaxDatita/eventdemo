import { NextResponse } from 'next/server';
import { updateThemeFile, getThemeConfig } from '@/lib/theme-updater';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, updates } = body;

    // Verificar contraseña
    if (password !== 'admin123') {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Validar que updates tenga la estructura correcta
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Actualizaciones inválidas' },
        { status: 400 }
      );
    }

    // Actualizar el archivo theme.ts
    const result = updateThemeFile(updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al actualizar configuración' },
        { status: 500 }
      );
    }

    // Obtener la configuración actualizada
    const updatedConfig = getThemeConfig();

    return NextResponse.json({
      success: true,
      config: updatedConfig
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Verificar contraseña
    if (password !== 'admin123') {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Obtener la configuración actual
    const config = getThemeConfig();

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error getting theme config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}



