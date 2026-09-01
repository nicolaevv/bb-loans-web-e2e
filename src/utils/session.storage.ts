import { ENV } from '../config/env.config';
import { AUTH_FILES, AuthFile } from './auth.file';

type StorageStateCookie = { name: string; value: string };

type StorageState = { cookies?: StorageStateCookie[]; origins?: unknown[] };

const EXPIRY_COOKIE = '__Host-bbapp-exp';

class SessionState extends AuthFile {
  constructor() {
    super(AUTH_FILES.session);
  }

  shouldTryReuse(): boolean {
    return !ENV.flags.isCi && !ENV.flags.forceAuth && this.exists();
  }

  isDefinitelyExpired(): boolean {
    const expiresAt = this.readExpiry();
    return expiresAt !== null && expiresAt <= Date.now();
  }

  refreshCookies(fresh: StorageState): boolean {
    const stored = fresh.cookies?.length ? this.read<StorageState>() : null;

    if (!stored) {
      return false;
    }

    stored.cookies = fresh.cookies;
    return this.write(stored);
  }

  private readExpiry(): number | null {
    const raw = this.read<StorageState>()?.cookies?.find(
      (cookie) => cookie.name === EXPIRY_COOKIE
    )?.value;
    const expiresAt = Number(raw);

    return Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null;
  }
}

export const SessionStorage = new SessionState();
