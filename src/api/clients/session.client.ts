import { request as playwrightRequest } from '@playwright/test';
import { ApiClient } from './api.client';
import { URLS } from '../../config/env.config';
import { SessionStorage } from '../../utils/session.storage';

/**
 * Endpoint that answers "who is this session?". It is the cheapest honest
 * session check available: 200 with valid cookies, 401 without them (the
 * `/loans` page itself returns 200 either way, because the redirect to the
 * login screen happens client-side).
 */
const USERINFO_PATH = '/api/v1/auth/userinfo';

export class SessionApiClient extends ApiClient {
  /**
   * Ask the app whether the stored browser session is still accepted.
   *
   * Deliberately an HTTP call rather than a browser probe: this runs before
   * every suite, and opening a browser window just to check would defeat the
   * point of keeping the whole run in a single window.
   */
  async isStoredSessionAlive(): Promise<boolean> {
    if (!SessionStorage.exists()) {
      return false;
    }

    const context = await playwrightRequest.newContext({
      storageState: SessionStorage.FILE,
      ignoreHTTPSErrors: true,
    });

    try {
      const response = await context.get(`${URLS.shellBff}${USERINFO_PATH}`);

      if (!response.ok()) {
        return false;
      }

      // The call above moved the app's sliding activity window; persist the
      // refreshed cookies so the stored session does not look stale later.
      SessionStorage.refreshCookies(await context.storageState());
      return true;
    } catch {
      return false;
    } finally {
      await context.dispose();
    }
  }
}
