import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { TokenResponse } from '../models/auth.types';
import { ApiClient } from '../clients/api.client';
import { API_CREDENTIALS } from '../../config/env.config';

export class AuthApiClient extends ApiClient{

  constructor(request?: APIRequestContext) {
    super(request);
  }

  /** Full token response — callers that need `expires_in` use this one. */
  async requestToken(): Promise<TokenResponse> {
    // Reuse the injected context when there is one, otherwise create a throwaway
    // one and dispose of it in `finally`.
    const context = this.request || await playwrightRequest.newContext({ ignoreHTTPSErrors: true });

    try {
      const response = await context.post(API_CREDENTIALS.tokenUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
          client_id: API_CREDENTIALS.clientId,
          client_secret: API_CREDENTIALS.clientSecret,
          grant_type: 'client_credentials',
        },
      });

      if (!response.ok()) {
        throw new Error(`Failed to obtain bearer token: ${response.status()} ${response.statusText()}`);
      }

      return (await response.json()) as TokenResponse;
    } finally {
      // Dispose only the context we created ourselves.
      if (!this.request) {
        await context.dispose();
      }
    }
  }

  async getBearerToken(): Promise<string> {
    const { access_token } = await this.requestToken();
    return access_token;
  }
}