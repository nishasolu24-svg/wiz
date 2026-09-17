/**
 * Master Administrator Configuration
 * Authorized administrator accounts with global oversight, platform controls,
 * and unlimited generation privileges.
 */

export const MASTER_ADMIN_EMAILS: readonly string[] = [
  'solu24@gmail.com',
  'alferniya.nisha@gmail.com',
  'nishasolu24@gmail.com',
] as const;

/**
 * Checks if a given email address belongs to one of the master administrators.
 */
export function isMasterAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return MASTER_ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalized);
}

/**
 * Global platform settings default state
 */
export interface PlatformSystemSettings {
  freeDailyLimit: number;
  maintenanceMode: boolean;
  systemBannerMessage: string;
  allowNewRegistrations: boolean;
}

export const DEFAULT_SYSTEM_SETTINGS: PlatformSystemSettings = {
  freeDailyLimit: 5,
  maintenanceMode: false,
  systemBannerMessage: '',
  allowNewRegistrations: true,
};
