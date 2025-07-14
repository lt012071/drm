import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  const baseURL = 'http://localhost:3001';

  test('should get daily reports via API', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/daily-reports/test`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('data');
  });

  test('should create and retrieve daily report via API', async ({ request }) => {
    const reportData = {
      reportDate: '2025-07-10',
      remarks: 'API E2Eテスト用日報',
      tasks: [
        {
          taskName: 'APIテスト',
          taskType: '新規開発',
          workHours: 1.5,
          memo: 'Playwright APIテスト'
        }
      ]
    };

    // 日報を作成
    const createResponse = await request.post(`${baseURL}/api/daily-reports`, {
      data: reportData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(createResponse.ok()).toBeTruthy();
    
    const createData = await createResponse.json();
    expect(createData).toHaveProperty('message');
    expect(createData).toHaveProperty('data');
    expect(createData.data.reportDate).toBe('2025-07-10');

    // 作成した日報を取得
    const getResponse = await request.get(`${baseURL}/api/daily-reports/2025-07-10`);
    
    if (getResponse.ok()) {
      const getData = await getResponse.json();
      expect(getData.data.reportDate).toBe('2025-07-10');
      expect(getData.data.remarks).toBe('API E2Eテスト用日報');
    }
  });

  test('should get daily reports by date range via API', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/daily-reports`, {
      params: {
        startDate: '2025-07-01',
        endDate: '2025-07-31'
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('count');
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('should get today report via API', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/daily-reports/today`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('date');
  });

  test('should get statistics via API', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/daily-reports/stats`, {
      params: {
        startDate: '2025-07-01',
        endDate: '2025-07-31'
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('totalReports');
    expect(data.data).toHaveProperty('totalHours');
    expect(data.data).toHaveProperty('totalTasks');
  });

  test('should handle API errors gracefully', async ({ request }) => {
    // 無効な日付でリクエスト
    const response = await request.get(`${baseURL}/api/daily-reports/invalid-date`);
    
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should validate request data', async ({ request }) => {
    // 無効なデータで日報作成を試行
    const invalidData = {
      reportDate: 'invalid-date',
      remarks: '',
      tasks: []
    };

    const response = await request.post(`${baseURL}/api/daily-reports`, {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // バリデーションエラーが返されることを期待
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should handle concurrent requests', async ({ request }) => {
    // 複数の同時リクエストを送信
    const promises = Array.from({ length: 5 }, (_, i) =>
      request.post(`${baseURL}/api/daily-reports`, {
        data: {
          reportDate: `2025-07-${15 + i}`,
          remarks: `並行テスト ${i + 1}`,
          tasks: []
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );

    const responses = await Promise.all(promises);
    
    // すべてのリクエストが成功することを確認
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
  });
});