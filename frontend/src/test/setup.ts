import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock environment variables for tests
vi.mock('../../services/dailyReportService', async () => {
  const actual = await vi.importActual('../../services/dailyReportService') as any
  return {
    ...actual,
    DailyReportService: {
      createOrUpdate: vi.fn(),
      getToday: vi.fn(),
      getByDate: vi.fn(),
      getByDateRange: vi.fn(),
      delete: vi.fn(),
      getStats: vi.fn(),
    }
  }
})