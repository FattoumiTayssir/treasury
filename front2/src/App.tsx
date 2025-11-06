import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import AnalyticsRecharts from '@/pages/AnalyticsRecharts'
import SimulationAnalytics from '@/pages/SimulationAnalytics'
import { Movements } from '@/pages/Movements'
import { ManualEntries } from '@/pages/ManualEntries'
import { Exceptions } from '@/pages/Exceptions'
import { TreasurySettings } from '@/pages/TreasurySettings'
import { UserManagement } from '@/pages/UserManagement'
import { PasswordChange } from '@/pages/Settings/PasswordChange'
import DataRefresh from '@/pages/DataRefresh'
import { Login } from '@/pages/Login'
import { Supervision } from '@/pages/Supervision'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/toaster'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

interface PermissionRouteProps {
  children: React.ReactNode
  tabName?: string
  requireModify?: boolean
  adminOnly?: boolean
}

function PermissionRoute({ children, tabName, requireModify = false, adminOnly = false }: PermissionRouteProps) {
  const { hasPermission, isAdmin } = useAuthStore()

  // Admin-only routes
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/analytics" replace />
  }

  // Tab permission check
  if (tabName && !isAdmin() && !hasPermission(tabName, requireModify)) {
    return <Navigate to="/analytics" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/settings/password" 
          element={
            <ProtectedRoute>
              <PasswordChange />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/analytics" replace />} />
                  <Route 
                    path="/analytics" 
                    element={
                      <PermissionRoute tabName="analytics">
                        <AnalyticsRecharts />
                      </PermissionRoute>
                    } 
                  />
                  <Route 
                    path="/simulation" 
                    element={
                      <PermissionRoute tabName="analytics">
                        <SimulationAnalytics />
                      </PermissionRoute>
                    } 
                  />
                  <Route 
                    path="/movements" 
                    element={
                      <PermissionRoute tabName="movements">
                        <Movements />
                      </PermissionRoute>
                    } 
                  />
                  <Route 
                    path="/manual-entries" 
                    element={
                      <PermissionRoute tabName="manual-entries">
                        <ManualEntries />
                      </PermissionRoute>
                    } 
                  />
                  <Route 
                    path="/exceptions" 
                    element={
                      <PermissionRoute tabName="exceptions">
                        <Exceptions />
                      </PermissionRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <PermissionRoute tabName="settings">
                        <TreasurySettings />
                      </PermissionRoute>
                    } 
                  />
                  <Route 
                    path="/users" 
                    element={
                      <PermissionRoute adminOnly>
                        <UserManagement />
                      </PermissionRoute>
                    } 
                  />
                  <Route 
                    path="/data-refresh" 
                    element={
                      <PermissionRoute adminOnly>
                        <DataRefresh />
                      </PermissionRoute>
                    } 
                  />
                  <Route 
                    path="/supervision" 
                    element={
                      <PermissionRoute adminOnly>
                        <Supervision />
                      </PermissionRoute>
                    } 
                  />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
