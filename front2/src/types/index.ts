export type Category = 'RH' | 'Achat' | 'Vente' | 'Compta' | 'Autre'
export type Sign = 'Entrée' | 'Sortie'
export type Source = 'Odoo' | 'Entrée manuelle'
export type Visibility = 'Public' | 'Simulation privée' | 'Tout'
export type Status = 'Actif' | 'Désactivé'
export type Frequency = 'Une seule fois' | 'Mensuel' | 'Annuel'
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
export type ExceptionState = 'Visible' | 'Cachée'

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

export interface TreasuryBalance {
  companyId: string
  amount: number
  referenceDate: string
  updatedBy: string
  updatedAt: string
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
