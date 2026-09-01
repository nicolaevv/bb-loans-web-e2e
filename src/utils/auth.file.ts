import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from './logger';

export const AUTH_DIR = 'playwright/.auth';

export const AUTH_FILES = {
  session: 'user.json',
  token: 'api-token.json',
} as const;

export class AuthFile {
  readonly file: string;

  constructor(name: string) {
    this.file = path.join(AUTH_DIR, name);
  }

  exists(): boolean {
    return fs.existsSync(this.file);
  }

  protected read<T>(): T | null {
    if (!this.exists()) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf-8')) as T;
    } catch {
      Logger.error(`Could not read ${this.file} — ignoring the stored state`);
      return null;
    }
  }

  protected write(content: unknown): boolean {
    try {
      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
        Logger.info(`Created ${AUTH_DIR}`);
      }

      fs.writeFileSync(this.file, JSON.stringify(content, null, 2));
      return true;
    } catch {
      return false;
    }
  }
}
