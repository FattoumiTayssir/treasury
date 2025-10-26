import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { authApi } from '@/services/api'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (tabName: string, requireModify?: boolean) => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token })
        if (token) {
          localStorage.setItem('auth_token', token)
        } else {
          localStorage.removeItem('auth_token')
        }
      },
      login: async (email: string, password: string) => {
        const response = await authApi.login(email, password)
        set({ user: response.data.user, token: response.data.token })
        localStorage.setItem('auth_token', response.data.token)
      },
      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout error:', error)
        }
        set({ user: null, token: null })
        localStorage.removeItem('auth_token')
      },
      hasPermission: (tabName: string, requireModify: boolean = false) => {
        const { user } = get()
        if (!user) return false
        
        // Admins have all permissions
        if (user.role === 'Admin') return true
        
        // Check specific permission
        const permission = user.permissions?.find(p => p.tabName === tabName)
        if (!permission) return false
        
        if (requireModify) {
          return permission.canModify
        }
        return permission.canView
      },
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'Admin' || false
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
