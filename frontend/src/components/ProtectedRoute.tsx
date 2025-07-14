import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoadingOverlay } from '@mantine/core'
import { useAuthStore } from '../stores/authStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 認証をスキップする設定の場合は認証をスキップ
  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return <>{children}</>
  }
  
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingOverlay visible={true} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}