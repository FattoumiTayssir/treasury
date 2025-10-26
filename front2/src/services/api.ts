import axios from 'axios'
import type {
  FinancialMovement,
  ManualEntry,
  Exception,
  User,
  Company,
  TabDefinition,
  TreasuryBalance,
  TreasuryForecast,
  CategoryBreakdown,
  CashFlowAnalysis,
  TreasuryMetrics,
  AnalyticsFilters,
} from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Financial Movements
export const movementsApi = {
  getAll: () => api.get<FinancialMovement[]>('/movements'),
  getById: (id: string) => api.get<FinancialMovement>(`/movements/${id}`),
  deactivate: (ids: string[], reason: string) =>
    api.post('/movements/deactivate', { ids, reason }),
  activate: (ids: string[]) => api.post('/movements/activate', { ids }),
  excludeFromAnalytics: (ids: string[], exclude: boolean) =>
    api.post('/movements/exclude-from-analytics', { ids, exclude }),
  includeInAnalytics: (ids: string[]) => api.post('/movements/include-in-analytics', { ids }),
  refresh: () => api.post('/movements/refresh'),
  getLastRefresh: () => api.get<{ lastRefresh: string }>('/movements/last-refresh'),
}

// Manual Entries
export const manualEntriesApi = {
  getAll: () => api.get<ManualEntry[]>('/manual-entries'),
  getById: (id: string) => api.get<ManualEntry>(`/manual-entries/${id}`),
  create: (entry: Omit<ManualEntry, 'id' | 'createdBy' | 'createdAt'>) =>
    api.post<ManualEntry>('/manual-entries', entry),
  update: (id: string, entry: Partial<ManualEntry>) =>
    api.put<ManualEntry>(`/manual-entries/${id}`, entry),
  delete: (ids: string[]) => api.post('/manual-entries/delete', { ids }),
  getMovements: (id: string) => api.get<FinancialMovement[]>(`/manual-entries/${id}/movements`),
}

// Exceptions
export const exceptionsApi = {
  getAll: () => api.get<Exception[]>('/exceptions'),
  getById: (id: string) => api.get<Exception>(`/exceptions/${id}`),
  updateState: (ids: string[], state: string) => api.post('/exceptions/update-state', { ids, state }),
  excludeFromAnalytics: (ids: string[], exclude: boolean) => 
    api.post('/exceptions/exclude-from-analytics', { ids, exclude }),
  refresh: () => api.post('/exceptions/refresh'),
  getLastRefresh: () => api.get<{ lastRefresh: string }>('/exceptions/last-refresh'),
}

// Dashboard
export const dashboardApi = {
  refresh: () => api.post('/dashboard/refresh'),
  getData: () => api.get('/dashboard/data'),
}

// Odoo Integration
export const odooApi = {
  getReferenceState: (referenceType: string, reference: string) =>
    api.get<{ state: string }>('/odoo/reference-state', {
      params: { referenceType, reference },
    }),
  checkReference: (reference: string) =>
    api.get<{ exists: boolean; type?: string; state?: string }>('/odoo/check-reference', {
      params: { reference },
    }),
}

// Treasury
export const treasuryApi = {
  getBalance: (companyId: string) => api.get<TreasuryBalance>(`/treasury/balance/${companyId}`),
  updateBalance: (companyId: string, amount: number, referenceDate: string, notes?: string, sources?: Array<{sourceName: string, amount: number, sourceDate: string, notes?: string}>) =>
    api.post<TreasuryBalance>('/treasury/balance', { companyId, amount, referenceDate, notes, sources: sources || [] }),
}

// Users
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getTabs: () => api.get<TabDefinition[]>('/users/tabs'),
  create: (data: { display_name: string; email: string; role: string; password: string }) => 
    api.post<User>('/users', data),
  update: (id: string, data: {
    display_name?: string
    email?: string
    role?: string
    password?: string
    companies?: number[]
    permissions?: Array<{ tabName: string; canView: boolean; canModify: boolean }>
  }) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

// Companies
export const companiesApi = {
  getAll: () => api.get<Company[]>('/companies'),
  getById: (id: string) => api.get<Company>(`/companies/${id}`),
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post<{ token: string }>('/auth/refresh'),
}

// Analytics
export const analyticsApi = {
  getForecast: (filters?: AnalyticsFilters) =>
    api.get<TreasuryForecast[]>('/analytics/forecast', { params: filters }),
  getCategoryBreakdown: (filters?: AnalyticsFilters) =>
    api.get<CategoryBreakdown[]>('/analytics/category-breakdown', { params: filters }),
  getCashFlowAnalysis: (filters?: AnalyticsFilters) =>
    api.get<CashFlowAnalysis[]>('/analytics/cash-flow', { params: filters }),
  getMetrics: (companyId: string) =>
    api.get<TreasuryMetrics>(`/analytics/metrics/${companyId}`),
}

export default api
