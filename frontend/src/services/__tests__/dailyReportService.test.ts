import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DailyReportService } from '../dailyReportService'
import { MockDailyReportService } from '../mockDailyReportService'
import type { CreateDailyReportRequest } from '../../types/dailyReport'

// MockDailyReportServiceをモック
vi.mock('../mockDailyReportService')

// fetch のモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DailyReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // 環境変数をリセット
    delete (import.meta.env as any).VITE_USE_MOCK_SERVICE
  })

  describe('環境変数によるサービス切り替え', () => {
    it('VITE_USE_MOCK_SERVICE=trueの場合、MockDailyReportServiceを使用する', async () => {
      // 環境変数を設定
      (import.meta.env as any).VITE_USE_MOCK_SERVICE = 'true'
      
      const mockCreateOrUpdate = vi.mocked(MockDailyReportService.createOrUpdate)
      mockCreateOrUpdate.mockResolvedValue({
        id: 'mock-id',
        userId: 'user-123',
        reportDate: '2025-07-06',
        remarks: 'モックテスト',
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const testData: CreateDailyReportRequest = {
        reportDate: '2025-07-06',
        remarks: 'テスト日報',
        tasks: []
      }

      await DailyReportService.createOrUpdate(testData)

      expect(mockCreateOrUpdate).toHaveBeenCalledWith(testData)
    })

    it('VITE_USE_MOCK_SERVICE=falseの場合、実際のAPIを呼び出す', async () => {
      // 環境変数を設定
      (import.meta.env as any).VITE_USE_MOCK_SERVICE = 'false'
      ;(import.meta.env as any).VITE_API_URL = 'http://localhost:3001'

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: {
            id: 'api-id',
            userId: 'user-123',
            reportDate: '2025-07-06',
            remarks: 'APIテスト',
            tasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const testData: CreateDailyReportRequest = {
        reportDate: '2025-07-06',
        remarks: 'テスト日報',
        tasks: []
      }

      const result = await DailyReportService.createOrUpdate(testData)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/daily-reports',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(testData)
        })
      )
      expect(result.id).toBe('api-id')
    })
  })

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      (import.meta.env as any).VITE_USE_MOCK_SERVICE = 'false'
      ;(import.meta.env as any).VITE_API_URL = 'http://localhost:3001'
    })

    it('APIエラー時に適切にエラーをスローする', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('{"error": "サーバーエラー"}')
      }

      mockFetch.mockResolvedValue(errorResponse)

      const testData: CreateDailyReportRequest = {
        reportDate: '2025-07-06',
        remarks: 'テスト日報',
        tasks: []
      }

      await expect(DailyReportService.createOrUpdate(testData))
        .rejects.toThrow('サーバーエラー')
    })

    it('ネットワークエラー時に適切にエラーをスローする', async () => {
      mockFetch.mockRejectedValue(new Error('Network Error'))

      const testData: CreateDailyReportRequest = {
        reportDate: '2025-07-06',
        remarks: 'テスト日報',
        tasks: []
      }

      await expect(DailyReportService.createOrUpdate(testData))
        .rejects.toThrow('Network Error')
    })
  })

  describe('getByDateRange', () => {
    beforeEach(() => {
      (import.meta.env as any).VITE_USE_MOCK_SERVICE = 'false'
      ;(import.meta.env as any).VITE_API_URL = 'http://localhost:3001'
    })

    it('期間指定で日報一覧を正しく取得する', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: [
            {
              id: 'report-1',
              userId: 'user-123',
              reportDate: '2025-07-06',
              remarks: '日報1',
              tasks: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          count: 1
        })
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await DailyReportService.getByDateRange('2025-07-01', '2025-07-31')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/daily-reports?startDate=2025-07-01&endDate=2025-07-31',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('report-1')
    })
  })

  describe('delete', () => {
    beforeEach(() => {
      (import.meta.env as any).VITE_USE_MOCK_SERVICE = 'false'
      ;(import.meta.env as any).VITE_API_URL = 'http://localhost:3001'
    })

    it('日報を正しく削除する', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ message: '削除完了' })
      }

      mockFetch.mockResolvedValue(mockResponse)

      await DailyReportService.delete('test-id')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/daily-reports/test-id',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })
})