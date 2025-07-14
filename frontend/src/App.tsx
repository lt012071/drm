import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import { useAuthStore } from './stores/authStore'
import { useEffect } from 'react'

import { Header } from './components/Header'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { ReportsPage } from './pages/ReportsPage'
import { DailyReportListPage } from './pages/DailyReportListPage'
import { DailyReportInputPage } from './pages/DailyReportInputPage'
import { DailyReportViewPage } from './pages/DailyReportViewPage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/list"
            element={
              <ProtectedRoute>
                <DailyReportListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/new"
            element={
              <ProtectedRoute>
                <DailyReportInputPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:date/edit"
            element={
              <ProtectedRoute>
                <DailyReportInputPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:date/view"
            element={
              <ProtectedRoute>
                <DailyReportViewPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App