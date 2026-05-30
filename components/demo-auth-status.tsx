import Image from 'next/image';
import { getDemoSessionFromCookieStore } from '@/lib/demo-auth';
import { isDemoAuthEnabled } from '@/config/demo-auth';

export async function DemoAuthStatus() {
  if (!isDemoAuthEnabled()) return null;

  const session = await getDemoSessionFromCookieStore();
  if (!session) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
        {session.picture ? (
          <Image
            src={session.picture}
            alt={session.name}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
            {session.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
          <p className="truncate text-xs uppercase tracking-wide text-slate-500">{session.role}</p>
        </div>
        <a
          href="/api/auth/logout?next=/login"
          className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
        >
          Salir
        </a>
      </div>
    </div>
  );
}
