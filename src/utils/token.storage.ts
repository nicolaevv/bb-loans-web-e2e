import * as fs from 'fs';
import * as path from 'path';
import { StoredApiToken } from '../api/models/auth.types';
import { Logger } from './logger';

const AUTH_DIR = 'playwright/.auth';
const TOKEN_FILE = path.join(AUTH_DIR, 'api-token.json');

/** Refresh this long before the real expiry, so a token cannot die mid-run. */
const EXPIRY_MARGIN_MS = 2 * 60 * 1000;

export class TokenStorage {
  static saveToken(bearerToken: string, expiresInSeconds: number): void {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      Logger.info(`Created ${AUTH_DIR} for the stored token`);
    }

    const payload: StoredApiToken = {
      bearerToken,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(payload, null, 2));
  }

  static getStoredToken(): StoredApiToken | null {
    if (!fs.existsSync(TOKEN_FILE)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')) as StoredApiToken;
    } catch {
      return null;
    }
  }

  /** True when the stored token is good for at least the safety margin. */
  static isValid(): boolean {
    const stored = TokenStorage.getStoredToken();

    if (!stored?.bearerToken) {
      return false;
    }

    return stored.expiresAt - EXPIRY_MARGIN_MS > Date.now();
  }

  static getBearerToken(): string {
    const stored = TokenStorage.getStoredToken();

    if (!stored?.bearerToken) {
      Logger.error('There is no stored API token — has the setup:api project run?');
      return '';
    }

    // Return as-is when the prefix is already there.
    return stored.bearerToken.startsWith('Bearer ')
      ? stored.bearerToken
      : `Bearer ${stored.bearerToken}`;
  }
}
