import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MockDailyReportService } from '../mockDailyReportService'
import type { CreateDailyReportRequest } from '../../types/dailyReport'

// モックデータをモック
vi.mock('../../types/dailyReport')

// fetch のモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('MockDailyReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // mockReports の初期化をリセット
    ;(MockDailyReportService as any).initialized = false
  })

  describe('createOrUpdate', () => {
    it('新しい日報を作成できる', async () => {
      // モックデータのfetchを設定
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ data: [] })
      })

      const testData: CreateDailyReportRequest = {
        reportDate: '2025-07-06',
        remarks: 'テスト日報',
        tasks: [
          {
            taskName: 'テストタスク',
            taskType: '新規開発',
            workHours: 2.0,
            memo: 'テストメモ'
          }
        ]
      }

      const result = await MockDailyReportService.createOrUpdate(testData)

      expect(result).toBeDefined()
      expect(result.reportDate).toBe('2025-07-06')
      expect(result.remarks).toBe('テスト日報')
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0].taskName).toBe('テストタスク')
    })

    it('既存の日報を更新できる', async () => {
      // 初期データをモック
      const initialData = {
        data: [{
          id: 'test-report-1',
          userId: 'user-123',
          reportDate: '2025-07-06',
          remarks: '既存の日報',
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      }

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(initialData)
      })

      const updateData: CreateDailyReportRequest = {
        reportDate: '2025-07-06',
        remarks: '更新された日報',
        tasks: []
      }

      const result = await MockDailyReportService.createOrUpdate(updateData)

      expect(result.remarks).toBe('更新された日報')
      expect(result.reportDate).toBe('2025-07-06')
    })
  })

  describe('getByDate', () => {
    it('指定した日付の日報を取得できる', async () => {
      const testData = {
        data: [{
          id: 'test-report-1',
          userId: 'user-123',
          reportDate: '2025-07-06',
          remarks: 'テスト日報',
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      }

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(testData)
      })

      const result = await MockDailyReportService.getByDate('2025-07-06')

      expect(result).toBeDefined()
      expect(result?.reportDate).toBe('2025-07-06')
    })

    it('存在しない日付の場合nullを返す', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ data: [] })
      })

      const result = await MockDailyReportService.getByDate('2025-01-01')

      expect(result).toBeNull()
    })
  })

  describe('getByDateRange', () => {
    it('期間指定で日報一覧を取得できる', async () => {
      const testData = {
        data: [
          {
            id: 'test-report-1',
            userId: 'user-123',
            reportDate: '2025-07-06',
            remarks: 'テスト日報1',
            tasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'test-report-2',
            userId: 'user-123',
            reportDate: '2025-07-05',
            remarks: 'テスト日報2',
            tasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(testData)
      })

      const result = await MockDailyReportService.getByDateRange('2025-07-01', '2025-07-31')

      expect(result).toHaveLength(2)
      expect(result[0].reportDate).toBe('2025-07-06') // 降順ソート
      expect(result[1].reportDate).toBe('2025-07-05')
    })
  })

  describe('delete', () => {
    it('日報を削除できる', async () => {
      const testData = {
        data: [{
          id: 'test-report-1',
          userId: 'user-123',
          reportDate: '2025-07-06',
          remarks: 'テスト日報',
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      }

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(testData)
      })

      await expect(MockDailyReportService.delete('test-report-1')).resolves.not.toThrow()
    })

    it('存在しないIDの場合エラーをスローする', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ data: [] })
      })

      await expect(MockDailyReportService.delete('non-existent-id'))
        .rejects.toThrow('削除対象の日報が見つかりません')
    })
  })
})