import { test, expect } from '@playwright/test';
import { cleanupClientApplications } from '../../src/helpers/loan.application.delete.helper';

// ID компании, для которой проводим очистку и тестирование
const TEST_COMPANY_ID = '1378697'; 

test.describe('Подача заявки на кредитную линию', () => {

  // Выполняется перед каждым тестом в этой группе
  test.beforeEach(async () => {
    console.log('🧹 Запуск подготовки тестового окружения...');
    
    // Вызываем нашу функцию очистки
    await cleanupClientApplications(TEST_COMPANY_ID);
    
    console.log('✨ Окружение успешно очищено!');
  });

  test('Успешное создание новой заявки на кредит', async ({ page }) => {

    await test.step('Client open tranche page and fill up it with valid data', async() =>{
      await page.goto('/loans/applications');
    })
  
  });
    test('Verify presence of web elements on the tranche application form', async ({ page }) => {

    await test.step('Client open tranche page and fill up it with valid data', async() =>{
      await page.goto('/loans/applications');
    })
  
  
  });

});