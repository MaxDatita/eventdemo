import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isDemoAuthEnabled } from '@/config/demo-auth';
import { getDemoSessionFromCookieStore, getSafeNextPath } from '@/lib/demo-auth';

const ERROR_MESSAGES: Record<string, string> = {
  callback_failed: 'No se pudo completar el inicio de sesión con Google.',
  config: 'Falta configuración para habilitar el acceso con Google.',
  invalid_state: 'La sesión de login expiró. Volvé a intentarlo.',
  missing_code: 'Google no devolvió el código esperado.',
  not_allowed: 'Tu correo no está autorizado para ingresar a esta demo.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const session = await getDemoSessionFromCookieStore();
  const nextPath = getSafeNextPath(
    typeof params?.next === 'string' ? params.next : Array.isArray(params?.next) ? params?.next[0] : '/'
  );

  if (!isDemoAuthEnabled()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-lg rounded-3xl p-8 bg-white/90 border-white/80">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Login de demo no habilitado</h1>
            <p className="text-sm text-slate-600">
              Activá <code>DEMO_AUTH_ENABLED=true</code> y configurá las credenciales de Google para probar esta rama.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (session) {
    redirect(nextPath);
  }

  const rawError = typeof params?.error === 'string' ? params.error : Array.isArray(params?.error) ? params?.error[0] : '';
  const errorMessage = rawError ? ERROR_MESSAGES[rawError] || 'No se pudo iniciar sesión.' : '';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <Card className="w-full max-w-lg rounded-3xl p-8 bg-white/90 border-white/80 shadow-2xl">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Demo privada
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Ingresá con Google</h1>
            <p className="text-sm text-slate-600">
              Solo pueden entrar los correos previamente autorizados para esta demo.
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <a href={`/api/auth/google/start?next=${encodeURIComponent(nextPath)}`} className="block">
            <Button
              variant="invitation"
              className="w-full rounded-2xl text-base h-12"
            >
              Continuar con Google
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
