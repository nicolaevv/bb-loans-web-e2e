import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { TokenResponse } from '../models/auth.types';
import { ApiClient } from '../clients/api.client';

export class AuthApiClient extends ApiClient{

  constructor(request?: APIRequestContext) {
    super(request);
  }

  async getBearerToken(): Promise<string> {
    const tokenUrl = process.env.API_TOKEN_URL || 'https://tkc.maib.test/realms/test/protocol/openid-connect/token';

    // Используем переданный контекст или создаем локальный
    const context = this.request || await playwrightRequest.newContext({ ignoreHTTPSErrors: true });

    try {
      const response = await context.post(tokenUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
          client_id: process.env.API_CLIENT_ID || 'bblending-client',
          client_secret: process.env.API_CLIENT_SECRET || 'Og2nQaf1nImO1ndZMantiHJR7jDZQ0bK',
          grant_type: 'client_credentials',
        },
      });

      if (!response.ok()) {
        throw new Error(`Failed to obtain bearer token: ${response.status()} ${response.statusText()}`);
      }

      const data: TokenResponse = await response.json();
      return data.access_token;
    } finally {
      // Очищаем только если контекст был создан локально
      if (!this.request) {
        await context.dispose();
      }
    }
  }
}