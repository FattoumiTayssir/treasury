import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Movements } from '@/pages/Movements'
import { ManualEntries } from '@/pages/ManualEntries'
import { Exceptions } from '@/pages/Exceptions'
import { TreasurySettings } from '@/pages/TreasurySettings'
import { Login } from '@/pages/Login'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/toaster'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/movements" element={<Movements />} />
                  <Route path="/manual-entries" element={<ManualEntries />} />
                  <Route path="/exceptions" element={<Exceptions />} />
                  <Route path="/settings" element={<TreasurySettings />} />
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
