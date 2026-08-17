
export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
  scope: string;
}

export interface StoredApiToken {
  bearerToken: string;
  /** Epoch milliseconds, derived from the response's `expires_in`. */
  expiresAt: number;
}