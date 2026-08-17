import { test as setup } from '@playwright/test';
import { AuthApiClient } from '../../src/api/clients/auth.client';
import { TokenStorage } from '../../src/utils/token.storage';
import { Logger } from '../../src/utils/logger';

setup('Reuse the stored API token, or obtain a new one', async ({ request }) => {
  // Same policy as the UI session: reuse locally, always fetch fresh on CI.
  if (!process.env.CI && !process.env.FORCE_AUTH && TokenStorage.isValid()) {
    Logger.info('Reused the stored API token');
    setup.info().annotations.push({ type: 'token', description: 'reused' });
    return;
  }

  setup.info().annotations.push({ type: 'token', description: 'fresh' });

  const { access_token, expires_in } = await new AuthApiClient(request).requestToken();

  // Stored in playwright/.auth/api-token.json, read later by the API helpers.
  TokenStorage.saveToken(access_token, expires_in);
});
