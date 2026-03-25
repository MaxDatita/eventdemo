export function getDemoAdminPassword() {
  return process.env.DEMO_ADMIN_PASSWORD || 'admin123';
}

export function isDemoAdminPasswordValid(password: string | null | undefined) {
  return typeof password === 'string' && password === getDemoAdminPassword();
}
