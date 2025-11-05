import { create } from 'zustand'
import type { Category, Sign, Frequency } from '@/types'

export interface SimulationMovement {
  id: string
  category: Category
  type: string
  amount: number
  sign: Sign
  frequency: Frequency
  startDate: string
  endDate?: string
  customDates?: string[]
  reference?: string
  referenceType?: string
  note?: string
  visibility?: string  // Optional for simulation
  // Generated dates for display
  generatedDates?: string[]
}

export interface SimulationState {
  name: string
  description: string
  movements: SimulationMovement[]
  createdAt: string
  updatedAt: string
  createdBy: string  // User ID who created the simulation
}

interface SimulationStore {
  simulations: Record<string, SimulationState>
  activeSimulationId: string | null
  currentUserId: string | null  // Track current user
  
  // Actions
  setCurrentUser: (userId: string | null) => void
  clearAllData: () => void  // Clear all simulations
  getUserSimulations: () => Record<string, SimulationState>  // Get simulations for current user
  createSimulation: (name: string, description?: string) => void
  deleteSimulation: (id: string) => void
  setActiveSimulation: (id: string) => void
  getActiveSimulation: () => SimulationState | null
  getActiveMovements: () => SimulationMovement[]
  addMovement: (movement: Omit<SimulationMovement, 'id' | 'generatedDates'>) => void
  updateMovement: (id: string, movement: Partial<SimulationMovement>) => void
  deleteMovement: (id: string) => void
  exportSimulation: (id: string) => void
  importSimulation: (data: SimulationState) => void
  getAllGeneratedMovements: () => { date: string; amount: number; sign: Sign; category: Category; type: string }[]
}

// Helper function to generate dates based on frequency
function generateDates(movement: Omit<SimulationMovement, 'id' | 'generatedDates'>): string[] {
  const dates: string[] = []
  
  if (movement.frequency === 'Une seule fois') {
    dates.push(movement.startDate)
  } else if (movement.frequency === 'Mensuel' && movement.endDate) {
    const start = new Date(movement.startDate)
    const end = new Date(movement.endDate)
    let current = new Date(start)
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setMonth(current.getMonth() + 1)
    }
  } else if (movement.frequency === 'Annuel' && movement.endDate) {
    const start = new Date(movement.startDate)
    const end = new Date(movement.endDate)
    let current = new Date(start)
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setFullYear(current.getFullYear() + 1)
    }
  } else if (movement.frequency === 'Dates personnalisées' && movement.customDates) {
    dates.push(...movement.customDates)
  }
  
  return dates.sort()
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simulations: {},
  activeSimulationId: null,
  currentUserId: null,
  
  setCurrentUser: (userId: string | null) => {
    set({ currentUserId: userId })
  },
  
  clearAllData: () => {
    set({ simulations: {}, activeSimulationId: null })
  },
  
  getUserSimulations: () => {
    const { simulations, currentUserId } = get()
    if (!currentUserId) return {}
    
    // Filter simulations to only show ones created by current user
    return Object.fromEntries(
      Object.entries(simulations).filter(([_, sim]) => sim.createdBy === currentUserId)
    )
  },
  
  createSimulation: (name: string, description = '') => {
    const { currentUserId } = get()
    if (!currentUserId) {
      console.error('Cannot create simulation: no user logged in')
      return
    }
    
    const id = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newSimulation: SimulationState = {
      name,
      description,
      movements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUserId,
    }
    
    set((state) => ({
      simulations: {
        ...state.simulations,
        [id]: newSimulation,
      },
      activeSimulationId: id,
    }))
  },
  
  deleteSimulation: (id: string) => {
    set((state) => {
      const { [id]: _, ...rest } = state.simulations
      return {
        simulations: rest,
        activeSimulationId: state.activeSimulationId === id ? null : state.activeSimulationId,
      }
    })
  },
  
  setActiveSimulation: (id: string) => {
    const { simulations, currentUserId } = get()
    const simulation = simulations[id]
    
    // Only allow setting active simulation if it belongs to current user
    if (simulation && simulation.createdBy === currentUserId) {
      set({ activeSimulationId: id })
    } else {
      console.warn('Cannot access simulation: not owned by current user')
    }
  },
  
  getActiveSimulation: () => {
    const { simulations, activeSimulationId } = get()
    return activeSimulationId ? simulations[activeSimulationId] || null : null
  },
  
  getActiveMovements: () => {
    const simulation = get().getActiveSimulation()
    return simulation ? simulation.movements : []
  },
  
  addMovement: (movement: Omit<SimulationMovement, 'id' | 'generatedDates'>) => {
    const { activeSimulationId, simulations } = get()
    if (!activeSimulationId) return
    
    const simulation = simulations[activeSimulationId]
    if (!simulation) return
    
    const id = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const generatedDates = generateDates(movement)
    
    const newMovement: SimulationMovement = {
      ...movement,
      id,
      generatedDates,
    }
    
    set((state) => ({
      simulations: {
        ...state.simulations,
        [activeSimulationId]: {
          ...simulation,
          movements: [...simulation.movements, newMovement],
          updatedAt: new Date().toISOString(),
        },
      },
    }))
  },
  
  updateMovement: (id: string, movement: Partial<SimulationMovement>) => {
    const { activeSimulationId, simulations } = get()
    if (!activeSimulationId) return
    
    const simulation = simulations[activeSimulationId]
    if (!simulation) return
    
    set((state) => {
      const updatedMovements = simulation.movements.map((m) => {
        if (m.id === id) {
          const updated = { ...m, ...movement }
          // Regenerate dates if frequency-related fields changed
          const generatedDates = generateDates(updated)
          return { ...updated, generatedDates }
        }
        return m
      })
      
      return {
        simulations: {
          ...state.simulations,
          [activeSimulationId]: {
            ...simulation,
            movements: updatedMovements,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    })
  },
  
  deleteMovement: (id: string) => {
    const { activeSimulationId, simulations } = get()
    if (!activeSimulationId) return
    
    const simulation = simulations[activeSimulationId]
    if (!simulation) return
    
    set((state) => ({
      simulations: {
        ...state.simulations,
        [activeSimulationId]: {
          ...simulation,
          movements: simulation.movements.filter((m) => m.id !== id),
          updatedAt: new Date().toISOString(),
        },
      },
    }))
  },
  
  exportSimulation: (id: string) => {
    const simulation = get().simulations[id]
    if (!simulation) return
    
    const dataStr = JSON.stringify(simulation, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${simulation.name.replace(/\s+/g, '_')}_${Date.now()}.tabtre`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
  
  importSimulation: (data: SimulationState) => {
    const { currentUserId } = get()
    if (!currentUserId) {
      console.error('Cannot import simulation: no user logged in')
      return
    }
    
    const id = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    set((state) => ({
      simulations: {
        ...state.simulations,
        [id]: {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: currentUserId,  // Assign to current user
        },
      },
      activeSimulationId: id,
    }))
  },
  
  getAllGeneratedMovements: () => {
    const simulation = get().getActiveSimulation()
    if (!simulation) return []
    
    const allMovements: { date: string; amount: number; sign: Sign; category: Category; type: string }[] = []
    
    simulation.movements.forEach((movement) => {
      const dates = movement.generatedDates || []
      dates.forEach((date) => {
        allMovements.push({
          date,
          amount: movement.amount,
          sign: movement.sign,
          category: movement.category,
          type: movement.type,
        })
      })
    })
    
    return allMovements.sort((a, b) => a.date.localeCompare(b.date))
  },
}))
