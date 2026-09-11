export const URL_ENV_KEYS = {
  base: 'BASE_URL',
  products: 'PRODUCTS_URL',
  loanApplication: 'LOAN_APPLICATION_URL',
  loanOriginationApi: 'LOAN_ORIGINATION_API_URL',
  shellBff: 'SHELL_BFF_URL',
} as const;

export const UI_CREDENTIAL_ENV_KEYS = {
  username: 'UI_USERNAME',
  password: 'UI_PASSWORD',
} as const;

export const BNPL_UI_PREFIX = 'BNPL_';

export const API_CREDENTIAL_ENV_KEYS = {
  clientId: 'API_CLIENT_ID',
  clientSecret: 'API_CLIENT_SECRET',
  tokenUrl: 'API_TOKEN_URL',
} as const;

export const COMPANY_ID_ENV_KEYS = {
  TRANCHE: 'TRANCHE_COMPANY_ID',
  LOAN: 'LOAN_COMPANY_ID',
  ORDINARY_GUARANTY: 'ORDYNARY_GUARANTY_COMPANY_ID',
  LINE_GUARANTY: 'LINE_GUARANTY_COMPANY_ID',
} as const;

export const RUN_FLAG_ENV_KEYS = {
  isCi: 'CI',
  forceAuth: 'FORCE_AUTH',
} as const;
