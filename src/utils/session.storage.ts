import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR = 'playwright/.auth';

/**
 * Cookie carrying the app session's expiry, in epoch milliseconds. The app
 * keeps a sliding 2h window: this value is always ~2h past the last activity.
 */
const EXPIRY_COOKIE = '__Host-bbapp-exp';

type StorageStateCookie = { name: string; value: string };
type StorageState = { cookies?: StorageStateCookie[]; origins?: unknown[] };

/**
 * Owns playwright/.auth/user.json — the browser session shared by the test
 * projects. Reusing it across runs skips the ~12s UI login and keeps the tests
 * on the same server-side session.
 */
export class SessionStorage {
  static readonly FILE = path.join(AUTH_DIR, 'user.json');

  static exists(): boolean {
    return fs.existsSync(SessionStorage.FILE);
  }

  /**
   * Reuse is off on CI — a clean run is worth more there than 12 saved seconds
   * — and can be switched off by hand with FORCE_AUTH=1.
   */
  static shouldTryReuse(): boolean {
    return !process.env.CI && !process.env.FORCE_AUTH && SessionStorage.exists();
  }

  /**
   * Fast negative check, used only to skip a pointless browser probe when the
   * session is known to be dead (the common "ran it again next morning" case).
   *
   * Note the deliberate asymmetry: a `false` here means "not provably dead",
   * NOT "alive". Whether the session actually works is decided by asking the
   * app, never by trusting this timestamp — the server can drop a session long
   * before the cookie says so.
   */
  static isDefinitelyExpired(): boolean {
    const expiresAt = SessionStorage.readExpiry();
    return expiresAt !== null && expiresAt <= Date.now();
  }

  /**
   * Replace the stored cookies, keeping `origins` untouched.
   *
   * The refreshed cookies come from an APIRequestContext, which has no
   * localStorage — overwriting the whole file with its state would drop
   * `companyId` and send the next run back to the company chooser.
   */
  static refreshCookies(fresh: StorageState): void {
    if (!fresh.cookies?.length || !SessionStorage.exists()) {
      return;
    }

    try {
      const stored = JSON.parse(fs.readFileSync(SessionStorage.FILE, 'utf-8')) as StorageState;
      stored.cookies = fresh.cookies;
      fs.writeFileSync(SessionStorage.FILE, JSON.stringify(stored, null, 2));
    } catch {
      // A stale timestamp only costs an extra login later — not worth failing.
    }
  }

  private static readExpiry(): number | null {
    try {
      const state = JSON.parse(fs.readFileSync(SessionStorage.FILE, 'utf-8')) as StorageState;
      const raw = state.cookies?.find((cookie) => cookie.name === EXPIRY_COOKIE)?.value;
      const expiresAt = Number(raw);

      return Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null;
    } catch {
      // Unreadable or malformed file — let the browser probe decide.
      return null;
    }
  }
}
