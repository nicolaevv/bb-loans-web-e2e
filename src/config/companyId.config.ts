import { requireEnv } from './env.config';

/**
 * Test companies, one per product flow. Values live in .env because they differ
 * between environments and between developers' own test data.
 */
const COMPANY_ID_ENV_KEYS = {
  TRANCHE: 'TRANCHE_COMPANY_ID',
  LOAN: 'LOAN_COMPANY_ID',
  ORDINARY_GUARANTY: 'ORDYNARY_GUARANTY_COMPANY_ID',
  LINE_GUARANTY: 'LINE_GUARANTY_COMPANY_ID',
} as const;

export type CompanyIdKey = keyof typeof COMPANY_ID_ENV_KEYS;

export const getCompanyId = (key: CompanyIdKey): string =>
  requireEnv(COMPANY_ID_ENV_KEYS[key]);
