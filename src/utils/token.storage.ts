import { StoredApiToken } from '../api/models/auth.types';
import { AUTH_FILES, AuthFile } from './auth.file';
import { Logger } from './logger';

const EXPIRY_MARGIN_MS = 2 * 60 * 1000;

class ApiTokenState extends AuthFile {
  constructor() {
    super(AUTH_FILES.token);
  }

  shouldTryReuse(): boolean {
    return this.reuseAllowed() && this.isValid();
  }

  saveToken(bearerToken: string, expiresInSeconds: number): boolean {
    return this.write({
      bearerToken,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    } satisfies StoredApiToken);
  }

  isValid(): boolean {
    const stored = this.read<StoredApiToken>();

    if (!stored?.bearerToken) {
      return false;
    }

    return stored.expiresAt - EXPIRY_MARGIN_MS > Date.now();
  }

  getBearerToken(): string {
    const stored = this.read<StoredApiToken>();

    if (!stored?.bearerToken) {
      Logger.error('There is no stored API token — has the setup:api project run?');
      return '';
    }

    return stored.bearerToken.startsWith('Bearer ')
      ? stored.bearerToken
      : `Bearer ${stored.bearerToken}`;
  }
}

export const TokenStorage = new ApiTokenState();
