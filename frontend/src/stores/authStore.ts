import { create } from 'zustand'
import { AuthState, User } from '../types/auth'
import { AuthService } from '../services/auth'

interface AuthStore extends AuthState {
  login: () => void
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string) => void
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: () => {
    AuthService.loginWithGoogle()
  },

  logout: async () => {
    try {
      await AuthService.logout()
      set({ user: null, isAuthenticated: false })
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  setUser: (user: User | null) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false
    })
  },

  setToken: (token: string) => {
    AuthService.saveToken(token)
    // トークンが設定されたら、ユーザー情報を取得
    get().initializeAuth()
  },

  initializeAuth: async () => {
    try {
      // 開発モードで認証をスキップする場合
      if (import.meta.env.VITE_SKIP_AUTH === 'true') {
        const devUser: User = {
          id: 'dev-user-123',
          googleId: 'dev-google-id',
          email: 'developer@example.com',
          name: '開発ユーザー',
          role: 'developer',
          avatar: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set({ 
          user: devUser, 
          isAuthenticated: true,
          isLoading: false
        })
        return
      }

      if (AuthService.isAuthenticated()) {
        const user = await AuthService.getCurrentUser()
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false
        })
      } else {
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false
      })
    }
  }
}))