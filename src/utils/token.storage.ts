import * as fs from 'fs';
import * as path from 'path';
import { StoredApiToken } from '../api/models/auth.types';
import { Logger } from './logger';

const AUTH_DIR = 'playwright/.auth';
const TOKEN_FILE = path.join(AUTH_DIR, 'api-token.json');

export class TokenStorage {
  static saveToken(token: string, bearerToken: string): void {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      console.log("сохраняем токен в папку " + AUTH_DIR)
    }

    const payload: StoredApiToken = { token, bearerToken };
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(payload, null, 2));
  }

  static getStoredToken(): StoredApiToken | null {
    if (!fs.existsSync(TOKEN_FILE)) {
          Logger.error('There is no stored token')  
      return null;
    }
    const content = fs.readFileSync(TOKEN_FILE, 'utf-8');
    return JSON.parse(content) as StoredApiToken;
  }

  static getBearerToken(): string {
    const stored = this.getStoredToken();
    if (!stored || !stored.bearerToken) {
      return '';
    }
    
    // Если токен уже со словом Bearer — возвращаем как есть, иначе добавляем префикс
    return stored.bearerToken.startsWith('Bearer ') 
      ? stored.bearerToken 
      : `Bearer ${stored.bearerToken}`;
  }
}