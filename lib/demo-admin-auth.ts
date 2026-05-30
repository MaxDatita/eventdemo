import { requireServerEnv } from '@/lib/required-env';

export function getDemoAdminPassword() {
  return requireServerEnv('DEMO_ADMIN_PASSWORD');
}

export function isDemoAdminPasswordValid(password: string | null | undefined) {
  return typeof password === 'string' && password === getDemoAdminPassword();
}
