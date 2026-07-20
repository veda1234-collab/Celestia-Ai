'use client';

/**
 * The app was renamed from Celestia to Vedastra, which changed the localStorage
 * keys the persisted stores read from. Without this, everyone who had used the
 * app would silently lose their saved chart and conversation and be bounced back
 * through onboarding.
 *
 * Copies each old key to its new name once, then drops the old one. Safe to call
 * repeatedly: it never overwrites data already stored under the new key.
 */
const RENAMED_KEYS: [from: string, to: string][] = [
  ['celestia-profile', 'vedastra-profile'],
  ['celestia-chat', 'vedastra-chat'],
];

export function migrateRebrandedStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const [from, to] of RENAMED_KEYS) {
      const legacy = window.localStorage.getItem(from);
      if (legacy === null) continue;
      if (window.localStorage.getItem(to) === null) window.localStorage.setItem(to, legacy);
      window.localStorage.removeItem(from);
    }
  } catch {
    // Private mode or a disabled store — the app still works, just without the
    // carried-over state.
  }
}

// Must run before the persisted stores hydrate, so importing this module is
// enough to apply it.
migrateRebrandedStorage();
