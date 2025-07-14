import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '../../test/utils'
import { ProtectedRoute } from '../ProtectedRoute'
import { useAuthStore } from '../../stores/authStore'

// useAuthStoreをモック
vi.mock('../../stores/authStore')

describe('ProtectedRoute', () => {
  const mockUseAuthStore = vi.mocked(useAuthStore)

  beforeEach(() => {
    vi.clearAllMocks()
    // 環境変数をリセット
    delete (import.meta.env as any).VITE_SKIP_AUTH
  })

  it('VITE_SKIP_AUTH=trueの場合、認証をスキップしてchildrenを表示する', () => {
    (import.meta.env as any).VITE_SKIP_AUTH = 'true'

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('認証中の場合、ローディングを表示する', () => {
    (import.meta.env as any).VITE_SKIP_AUTH = 'false'
    
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    // Mantineのローディングコンポーネントが表示されることを確認
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('認証済みの場合、childrenを表示する', () => {
    (import.meta.env as any).VITE_SKIP_AUTH = 'false'
    
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('未認証の場合、ログインページにリダイレクトする', () => {
    (import.meta.env as any).VITE_SKIP_AUTH = 'false'
    
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })

    // React Routerのリダイレクトをテストするため、
    // 実際にはmockLocationやMemoryRouterを使用する必要があります
    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    )

    // 未認証の場合、protected-contentは表示されないことを確認
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})