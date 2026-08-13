import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { ApiClient } from '../clients/api.client';

export class AuthApiClient extends ApiClient{

  constructor(request?: APIRequestContext) {
    super(request);
  }
  async getGuaranteeProducts(){
        const enrichmentBaseUrl = process.env.PRODUCTS_URL;

  }
  
}