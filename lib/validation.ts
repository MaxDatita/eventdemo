const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isSafeId(value: unknown, options?: { minLength?: number; maxLength?: number }) {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  const minLength = options?.minLength ?? 1;
  const maxLength = options?.maxLength ?? 200;

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return false;
  }

  return SAFE_ID_PATTERN.test(trimmed);
}

export function isValidEmail(value: unknown, options?: { maxLength?: number }) {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  const maxLength = options?.maxLength ?? 254;

  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return false;
  }

  return BASIC_EMAIL_PATTERN.test(trimmed);
}

export function isPositiveIntegerArray(
  value: unknown,
  options?: { maxItems?: number; maxValue?: number }
) {
  if (!Array.isArray(value)) return false;

  const maxItems = options?.maxItems ?? 100;
  const maxValue = options?.maxValue ?? Number.MAX_SAFE_INTEGER;

  if (value.length === 0 || value.length > maxItems) {
    return false;
  }

  return value.every(
    (item) => Number.isInteger(item) && item > 0 && item <= maxValue
  );
}
