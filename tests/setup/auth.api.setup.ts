import { test as setup } from '@playwright/test';
import { AuthApiClient } from '../../src/api/clients/auth.client';
import { TokenStorage } from '../../src/utils/token.storage';

setup('Авторизация API и сохранение токена', async ({ request }) => {
  const authClient = new AuthApiClient(request);
  
  // 1. Receiving token
  const bearerToken = await authClient.getBearerToken();
  
  // Store token to the playwright/.auth/api-token.json
  TokenStorage.saveToken('token', bearerToken);
});