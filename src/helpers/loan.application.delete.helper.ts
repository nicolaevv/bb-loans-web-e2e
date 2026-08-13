import { request as playwrightRequest } from '@playwright/test';
import { TokenStorage } from '../../src/utils/token.storage';

// Список статусов, которые НЕ нужно трогать
const EXCLUDED_STATUSES = ['BACK_OFFICE_PROCESSING', 'DISBURSED', 'WITHDRAWN'];

interface LoanApplication {
  applicationId: string;
  amount: number;
  currency: string;
  applicationStatus: string;
  applicationType: string;
}

export async function cleanupClientApplications(companyId: string): Promise<void> {
  // 1. Вызываем функцию со скобками ()
  const token = TokenStorage.getBearerToken(); 
  const baseUrl = 'https://loan-origination-service.tstback.maib.md';

  const apiContext = await playwrightRequest.newContext({
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Authorization': token,
      'x-company-id': companyId,
      'Content-Type': 'application/json',
    },
  });

  try {
    // 1. Получаем список всех заявок клиента
    const response = await apiContext.get(`${baseUrl}/api/v1/loans/applications`);

    if (!response.ok()) {
      console.error(`⚠️ Не удалось получить список заявок: ${response.status()}`);
      return;
    }

const responseJson = await response.json();
    console.log('📦 Ответ сервера со списком заявок:', responseJson);

    // Безопасно извлекаем массив (подставьте нужное свойство, если массив лежит внутри объекта)
const applications: LoanApplication[] = Array.isArray(responseJson) 
      ? responseJson 
      : responseJson.loanApplications || [];

      const uniqueStatuses = [...new Set(applications.map(a => a.applicationStatus))];
console.log('📌 Уникальные статусы в ответе:', uniqueStatuses);

    // Защита, если сервер все равно вернул не массив
    if (!Array.isArray(applications)) {
      console.error('❌ Ошибка: Сервер не вернул массив заявок!', responseJson);
      return;
    }

    // 2. Фильтруем заявки
    const appsToCancel = applications.filter(
      (app) => !EXCLUDED_STATUSES.includes(app.applicationStatus)
    );

    console.log(`🔍 Найдено заявок для очистки: ${appsToCancel.length}`);

    // 3. Отменяем/удаляем каждую найденную заявку с использованием applicationId
    for (const app of appsToCancel) {
      console.log(`🗑️ Удаление/отмена заявки ID: ${app.applicationId} (Текущий статус: ${app.applicationStatus})`);
      
      const deleteResponse = await apiContext.delete(`${baseUrl}/api/v1/loans/applications/${app.applicationId}`);

      if (deleteResponse.ok()) {
        console.log(`✅ Заявка ${app.applicationId} успешно отменена.`);
      } else {
        console.error(`❌ Ошибка отмены заявки ${app.applicationId}: ${deleteResponse.status()}`);
      }
    }
  } finally {
    await apiContext.dispose();
  }
}