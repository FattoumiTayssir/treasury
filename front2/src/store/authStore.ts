import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { mockLogin, mockLogout } from '@/services/mockAuth'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
        // Using mock authentication
        const response = await mockLogin(email, password)
        set({ user: response.user, token: response.token })
        localStorage.setItem('auth_token', response.token)
      },
      logout: async () => {
        await mockLogout()
        set({ user: null, token: null })
        localStorage.removeItem('auth_token')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
