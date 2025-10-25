export type Category = 'RH' | 'Achat' | 'Vente' | 'Compta' | 'Autre'
export type Sign = 'Entrée' | 'Sortie'
export type Source = 'Odoo' | 'Entrée manuelle'
export type Visibility = 'Public' | 'Simulation privée' | 'Tout'
export type Status = 'Actif' | 'Désactivé'
export type Frequency = 'Une seule fois' | 'Mensuel' | 'Annuel' | 'Dates personnalisées'
export type ReferenceType =
  | 'Facture de vente'
  | 'Avoir de vente'
  | 'Facture d\'achat'
  | 'Avoir d\'achat'
  | 'BL de vente'
  | 'Commande client'
  | 'Commande Fournisseur'
  | 'Paiement Fournisseur'
  | 'Paiement Client'
  | 'Ref de Paiement Client'
  | 'Ref de Paiement Fournisseur'

export type ExceptionType =
  | 'Mouvements ajoutés automatiquement'
  | 'Mouvements non traités à ajouter manuellement'
  | 'Mouvements partiellement ajoutés : à compléter'

export type Criticality = 'Critique' | 'Majeure' | 'Warning'
export type ExceptionState = 'Actif' | 'Désactivé'

export interface FinancialMovement {
  id: string
  companyId: string
  category: Category
  type: string
  amount: number
  sign: Sign
  date: string
  referenceType?: ReferenceType
  reference?: string
  referenceState?: string
  odooLink?: string
  source: Source
  note?: string
  visibility: Visibility
  status: Status
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
  deactivatedBy?: string
  deactivatedAt?: string
  deactivationReason?: string
  excludeFromAnalytics: boolean
}

export interface ManualEntry {
  id: string
  companyId: string
  category: Category
  type: string
  reference?: string
  referenceType?: ReferenceType
  amount: number
  sign: Sign
  frequency: Frequency
  start_date: string
  end_date?: string
  custom_dates?: string[]
  note?: string
  visibility: Visibility
  status: Status
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  referenceState?: string
}

export interface Exception {
  id: string
  companyId: string
  category: Category
  type: string
  exceptionType: ExceptionType
  criticality: Criticality
  description: string
  amount: number
  sign: Sign
  referenceType?: ReferenceType
  reference?: string
  referenceState?: string
  odooLink?: string
  state: ExceptionState
  excludeFromAnalytics: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Gestionnaire'
  companies: string[]
}

export interface Company {
  id: string
  name: string
}

export interface TreasuryBalanceSource {
  sourceId?: number
  sourceName: string
  amount: number
  sourceDate: string
  notes?: string
  createdAt?: string
}

export interface TreasuryBalance {
  companyId: string
  amount: number
  referenceDate: string
  updatedBy: string
  updatedAt: string
  notes?: string
  sources?: TreasuryBalanceSource[]
}

export interface FilterLogic {
  type: 'ET' | 'OU'
}

export interface MovementFilters {
  category?: Category[]
  type?: string[]
  dateMin?: string
  dateMax?: string
  sign?: Sign[]
  amountMin?: number
  amountMax?: number
  source?: Source[]
  referenceType?: ReferenceType[]
  reference?: string
  referenceState?: string[]
  visibility?: Visibility[]
  status?: Status[]
  logic: 'ET' | 'OU'
}

export interface ManualEntryFilters {
  user?: string[]
  updateDateMin?: string
  updateDateMax?: string
  category?: Category[]
  type?: string[]
  sign?: Sign[]
  amountMin?: number
  amountMax?: number
  frequency?: Frequency[]
  visibility?: Visibility[]
  referenceType?: ReferenceType[]
  reference?: string
  referenceState?: string[]
  noteSearch?: string
  logic: 'ET' | 'OU'
}

export interface ExceptionFilters {
  category?: Category[]
  type?: string[]
  exceptionType?: ExceptionType[]
  criticality?: Criticality[]
  referenceType?: ReferenceType[]
  reference?: string
  referenceState?: string[]
  amountMin?: number
  amountMax?: number
  sign?: Sign[]
  descriptionSearch?: string
  state?: ExceptionState[]
  logic: 'ET' | 'OU'
}

// Analytics Types
export interface TreasuryForecast {
  date: string
  actualBalance: number | null
  predictedBalance: number
  inflow: number
  outflow: number
  netChange: number
}

export interface CategoryBreakdown {
  category: Category
  amount: number
  percentage: number
  count: number
}

export interface CashFlowAnalysis {
  period: string
  inflow: number
  outflow: number
  netFlow: number
  avgDailyBalance: number
}

export interface TreasuryMetrics {
  currentBalance: number
  projectedBalance30d: number
  projectedBalance90d: number
  totalInflow30d: number
  totalOutflow30d: number
  netCashFlow30d: number
  avgDailyInflow: number
  avgDailyOutflow: number
  balanceChange30d: number
  balanceChangePercent30d: number
}

export interface AnalyticsFilters {
  dateFrom?: string
  dateTo?: string
  companyId?: string
  category?: Category[]
  forecastDays?: number
}
