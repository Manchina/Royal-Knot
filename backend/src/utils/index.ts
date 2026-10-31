/**
 * Common Utilities for Royal Knot Backend
 */

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks whether a given string is a valid RFC 4122 UUID.
 * Useful for branching database lookups between UUID primary keys and human-readable codes (e.g. RW-2026-001, ENQ-2026-105).
 */
export function isUUID(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return UUID_REGEX.test(value.trim());
}

export * from './formatters';
