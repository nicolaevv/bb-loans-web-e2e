export interface ProgramProduct {
  lineType?: string;
  productCode: string;
  productName: string;
  lineTypeName?: string;
  productGroup?: string;
  productGroupName?: string;
  refinanceType: boolean;
}

export interface Charge {
  amount: number;
  code: string;
  date: string;
  description: string;
}

export interface AgreementCharge {
  currency: string;
  code: string;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
  description: string;
}

export interface GuaranteeType {
  id: string;
  name: string;
}

export interface GuaranteeDepositInfo {
  accountAnalytic: string;
}

export interface GuaranteeAccount {
  accountId: string;
  categoryT24: string;
  currency: string;
  termMonths: string;
  productType?: string;
  status: string;
  topUpOption?: string;
  principalRepaymentAccount: string;
  programProduct: ProgramProduct;
  receivedCharges?: Charge[];
  agreementCharges?: AgreementCharge[];
  loanContractNumber: string;
  createdAt: string;
  maturityDate: string;
  principalAmount: number;
  totalWithdrawnAmount: number;
  nextPayAmount?: number;
  commitmentNo?: string;
  interestRate: number;
  contractSigningDate: string;
  nextPayDate?: string;
  beneficiaryName: string;
  guaranteeType: GuaranteeType;
  guaranteeIssueBank: string;
  guaranteeIssueBankName: string;
  holderType: string;
  
  // Дополнительные поля, встречающиеся в некоторых объектах массива
  signedContractAmount?: number;
  signedContractCurrency?: string;
  guaranteeChargePaymentMethod?: string;
  guaranteeInitialAmount?: number;
  guaranteeBeneficiaryIdno?: string;
  guaranteeBeneficiaryId?: string;
  guaranteeDepositInfo?: GuaranteeDepositInfo[];
}

// Тип ответа от API (массив гарантийных аккаунтов)
export type GuaranteeListResponse = GuaranteeAccount[];