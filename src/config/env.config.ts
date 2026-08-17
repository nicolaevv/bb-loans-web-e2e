/**
 * Single entry point for reading environment variables.
 *
 * Every value fails loudly when missing: a silent fallback turns a broken .env
 * into a confusing UI/API failure several steps later instead of an obvious
 * configuration error at startup.
 */

export const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Missing required environment variable "${key}". Add it to your .env file (see .env.example).`
    );
  }

  return value;
};

/** For genuinely optional settings only. */
export const optionalEnv = (key: string, fallback: string): string =>
  process.env[key] || fallback;

export const URLS = {
  get base(): string {
    return requireEnv('BASE_URL');
  },
  get products(): string {
    return requireEnv('PRODUCTS_URL');
  },
  get loanApplication(): string {
    return requireEnv('LOAN_APPLICATION_URL');
  },
  get loanOriginationApi(): string {
    return requireEnv('LOAN_ORIGINATION_API_URL');
  },
  /** Shell BFF — backs the app shell; used here to validate a browser session. */
  get shellBff(): string {
    return requireEnv('SHELL_BFF_URL');
  },
} as const;

export const UI_CREDENTIALS = {
  get username(): string {
    return requireEnv('UI_USERNAME');
  },
  get password(): string {
    return requireEnv('UI_PASSWORD');
  },
} as const;

export const API_CREDENTIALS = {
  get clientId(): string {
    return requireEnv('API_CLIENT_ID');
  },
  get clientSecret(): string {
    return requireEnv('API_CLIENT_SECRET');
  },
  get tokenUrl(): string {
    return requireEnv('API_TOKEN_URL');
  },
} as const;
