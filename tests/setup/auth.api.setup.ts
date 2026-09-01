import { test as setup } from '@playwright/test';
import { AuthClient } from '../../src/api/clients/auth.client';
import { TokenStorage } from '../../src/utils/token.storage';
import { Logger } from '../../src/utils/logger';
import { ENV } from '../../src/config/env.config';

setup('Reuse the stored API token, or obtain a new one', async ({ request }) => {
  // Same policy as the UI session: reuse locally, always fetch fresh on CI.
  if (!ENV.flags.isCi && !ENV.flags.forceAuth && TokenStorage.isValid()) {
    Logger.info('Reused the stored API token');
    setup.info().annotations.push({ type: 'token', description: 'reused' });
    return;
  }

  setup.info().annotations.push({ type: 'token', description: 'fresh' });

  const { access_token, expires_in } = await AuthClient.requestToken(request);

  // Stored in playwright/.auth/api-token.json, read later by the API helpers.
  TokenStorage.saveToken(access_token, expires_in);
});
