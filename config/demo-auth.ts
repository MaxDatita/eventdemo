export type DemoUserRole = 'admin' | 'viewer';

type AllowedUser = {
  email: string;
  role: DemoUserRole;
};

const VIEWER_PATHS = [
  '/',
  '/mensajes',
  '/mensajesevent',
  '/proyeccion',
  '/api/photos/upload',
];

const ADMIN_PATHS = [
  '/dashboard',
  '/invitados',
  '/moderacion',
  '/scanner',
  '/api/dashboard',
  '/api/invitados',
  '/api/photos/all',
  '/api/photos/moderate',
  '/api/photos/pending',
  '/api/photos/rejected',
  '/api/verify-pin-scanner',
];

export function isDemoAuthEnabled() {
  return process.env.DEMO_AUTH_ENABLED === 'true';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAllowedDemoUsers(): AllowedUser[] {
  const raw = process.env.DEMO_AUTH_USERS || '';

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [emailPart, rolePart] = entry.split(':');
      const email = normalizeEmail(emailPart || '');
      const role: DemoUserRole = rolePart?.trim() === 'admin' ? 'admin' : 'viewer';
      return email ? { email, role } : null;
    })
    .filter((entry): entry is AllowedUser => entry !== null);
}

export function getRoleForDemoEmail(email: string) {
  const normalized = normalizeEmail(email);
  return getAllowedDemoUsers().find((user) => user.email === normalized)?.role || null;
}

export function hasDemoRoleAccess(role: DemoUserRole, requiredRole: DemoUserRole) {
  if (role === 'admin') return true;
  return requiredRole === 'viewer' && role === 'viewer';
}

export function getRequiredDemoRole(pathname: string): DemoUserRole | null {
  if (ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return 'admin';
  }

  if (VIEWER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return 'viewer';
  }

  return null;
}

export function isDemoAuthPublicPath(pathname: string) {
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/public')
  ) {
    return true;
  }

  if (pathname === '/login') return true;
  if (pathname.startsWith('/api/auth/')) return true;

  return false;
}
