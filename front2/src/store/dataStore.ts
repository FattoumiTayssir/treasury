import { create } from 'zustand'
import type { FinancialMovement, ManualEntry, Exception, Company } from '@/types'
import {
  movementsApi,
  manualEntriesApi,
  exceptionsApi,
  companiesApi,
} from '@/services/api'

interface DataState {
  movements: FinancialMovement[]
  manualEntries: ManualEntry[]
  exceptions: Exception[]
  companies: Company[]
  movementsLastRefresh: string | null
  exceptionsLastRefresh: string | null
  selectedCompanies: string[]
  isLoading: boolean
  error: string | null
  
  fetchMovements: () => Promise<void>
  fetchManualEntries: () => Promise<void>
  fetchExceptions: () => Promise<void>
  fetchCompanies: () => Promise<void>
  refreshMovements: () => Promise<void>
  refreshExceptions: () => Promise<void>
  setSelectedCompanies: (companies: string[]) => void
  updateMovementsOptimistic: (ids: string[], exclude: boolean) => void
  clearError: () => void
}

export const useDataStore = create<DataState>((set) => ({
  movements: [],
  manualEntries: [],
  exceptions: [],
  companies: [],
  movementsLastRefresh: null,
  exceptionsLastRefresh: null,
  selectedCompanies: [],
  isLoading: false,
  error: null,

  fetchMovements: async () => {
    set({ isLoading: true, error: null })
    try {
      const [movementsRes, lastRefreshRes] = await Promise.all([
        movementsApi.getAll(),
        movementsApi.getLastRefresh(),
      ])
      set({
        movements: movementsRes.data,
        movementsLastRefresh: lastRefreshRes.data.lastRefresh,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors du chargement des mouvements',
        isLoading: false,
      })
    }
  },

  fetchManualEntries: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await manualEntriesApi.getAll()
      set({ manualEntries: response.data, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors du chargement des entrées manuelles',
        isLoading: false,
      })
    }
  },

  fetchExceptions: async () => {
    set({ isLoading: true, error: null })
    try {
      const [exceptionsRes, lastRefreshRes] = await Promise.all([
        exceptionsApi.getAll(),
        exceptionsApi.getLastRefresh(),
      ])
      set({
        exceptions: exceptionsRes.data,
        exceptionsLastRefresh: lastRefreshRes.data.lastRefresh,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors du chargement des exceptions',
        isLoading: false,
      })
    }
  },

  fetchCompanies: async () => {
    try {
      const response = await companiesApi.getAll()
      set({ companies: response.data })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors du chargement des entreprises',
      })
    }
  },

  refreshMovements: async () => {
    set({ isLoading: true, error: null })
    try {
      await movementsApi.refresh()
      const [movementsRes, lastRefreshRes] = await Promise.all([
        movementsApi.getAll(),
        movementsApi.getLastRefresh(),
      ])
      set({
        movements: movementsRes.data,
        movementsLastRefresh: lastRefreshRes.data.lastRefresh,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors du rafraîchissement',
        isLoading: false,
      })
    }
  },

  refreshExceptions: async () => {
    set({ isLoading: true, error: null })
    try {
      await exceptionsApi.refresh()
      const [exceptionsRes, lastRefreshRes] = await Promise.all([
        exceptionsApi.getAll(),
        exceptionsApi.getLastRefresh(),
      ])
      set({
        exceptions: exceptionsRes.data,
        exceptionsLastRefresh: lastRefreshRes.data.lastRefresh,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Erreur lors du rafraîchissement',
        isLoading: false,
      })
    }
  },

  setSelectedCompanies: (companies) => set({ selectedCompanies: companies }),
  
  updateMovementsOptimistic: (ids, exclude) => set((state) => ({
    movements: state.movements.map((movement) =>
      ids.includes(movement.id)
        ? { ...movement, excludeFromAnalytics: exclude }
        : movement
    ),
  })),
  
  clearError: () => set({ error: null }),
}))
