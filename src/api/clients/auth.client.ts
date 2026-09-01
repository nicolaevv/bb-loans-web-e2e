import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { TokenResponse } from '../models/auth.types';
import { ENV } from '../../config/env.config';
import { Logger } from '../../utils/logger';

const FORM_CONTENT_TYPE = 'application/x-www-form-urlencoded';

class AuthApi {
  async requestToken(injected?: APIRequestContext): Promise<TokenResponse> {
    const context = injected ?? (await playwrightRequest.newContext({ ignoreHTTPSErrors: true }));

    try {
      const response = await context.post(ENV.api.tokenUrl, {
        headers: { 'Content-Type': FORM_CONTENT_TYPE },
        form: {
          client_id: ENV.api.clientId,
          client_secret: ENV.api.clientSecret,
          grant_type: 'client_credentials',
        },
      });

      if (!response.ok()) {
        const reason = `Failed to obtain bearer token from ${ENV.api.tokenUrl}: ${response.status()} ${response.statusText()}`;

        Logger.error(reason);
        throw new Error(reason);
      }

      return (await response.json()) as TokenResponse;
    } finally {
      if (!injected) {
        await context.dispose();
      }
    }
  }
}

export const AuthClient = new AuthApi();
