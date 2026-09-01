import { request as playwrightRequest } from '@playwright/test';
import { ENV } from '../../config/env.config';
import { SessionStorage } from '../../utils/session.storage';

const USERINFO_PATH = '/api/v1/auth/userinfo';

class SessionApi {
  async isStoredSessionAlive(): Promise<boolean> {
    if (!SessionStorage.exists()) {
      return false;
    }

    const context = await playwrightRequest.newContext({
      storageState: SessionStorage.file,
      ignoreHTTPSErrors: true,
    });

    try {
      const response = await context.get(`${ENV.urls.shellBff}${USERINFO_PATH}`);

      if (!response.ok()) {
        return false;
      }

      SessionStorage.refreshCookies(await context.storageState());
      return true;
    } catch {
      return false;
    } finally {
      await context.dispose();
    }
  }
}

export const SessionClient = new SessionApi();
