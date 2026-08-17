export const COMPANY_ID = {
    TRANCHE_COMPANY_ID: process.env.TRANCHE_COMPANY_ID || 'fallback_tranche_id',
    LOAN_COMPANY_ID: process.env.LOAN_COMPANY_ID || 'fallback_loan_id',
    ORDYNARY_GUARANTY_COMPANY_ID: process.env.ORDYNARY_GUARANTY_COMPANY_ID || 'fallback_ordinary_id',
    LINE_GUARANTY_COMPANY_ID: process.env.LINE_GUARANTY_COMPANY_ID || 'fallback_line_id',
} as const;

export type CompanyIdKey = keyof typeof COMPANY_ID;

/**
 * Безопасное получение ID с выбросом понятной ошибки, если переменной нет в .env
 */
export const getCompanyId = (key: CompanyIdKey): string => {
  const companyId = COMPANY_ID[key];
  
  if (!companyId || companyId.startsWith('fallback_')) {
    console.warn(`[Config Warning]: Переменная для ${key} не задана в .env!`);
  }
  
  return companyId;
};