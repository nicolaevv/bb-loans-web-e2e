import { test as setup } from '@playwright/test';
import { AuthClient } from '../../src/api/clients/auth.client';
import { TokenStorage } from '../../src/utils/token.storage';
import { Logger } from '../../src/utils/logger';

setup('Reuse the stored API token, or obtain a new one', async ({ request }) => {
  if (TokenStorage.shouldTryReuse()) {
    Logger.info('Reused the stored API token');
    setup.info().annotations.push({ type: 'token', description: 'reused' });
    return;
  }

  setup.info().annotations.push({ type: 'token', description: 'fresh' });

  const { access_token, expires_in } = await AuthClient.requestToken(request);

  TokenStorage.saveToken(access_token, expires_in);
});
