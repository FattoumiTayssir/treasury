import { MovementFilters, Category, Sign, Source, Status } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface MovementsFiltersProps {
  filters: MovementFilters
  onFiltersChange: (filters: MovementFilters) => void
}

const categories: Category[] = ['RH', 'Achat', 'Vente', 'Compta', 'Autre']
const signs: Sign[] = ['Entrée', 'Sortie']
const sources: Source[] = ['Odoo', 'Entrée manuelle']
const statuses: Status[] = ['Actif', 'Désactivé']

export function MovementsFilters({ filters, onFiltersChange }: MovementsFiltersProps) {
  const handleReset = () => {
    onFiltersChange({ logic: 'ET' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtres</h3>
        <div className="flex items-center gap-4">
          <Select
            value={filters.logic}
            onValueChange={(value: 'ET' | 'OU') =>
              onFiltersChange({ ...filters, logic: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ET">Logique ET</SelectItem>
              <SelectItem value="OU">Logique OU</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <X className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Date min</Label>
          <Input
            type="date"
            value={filters.dateMin || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateMin: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Date max</Label>
          <Input
            type="date"
            value={filters.dateMax || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateMax: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Référence</Label>
          <Input
            placeholder="Rechercher..."
            value={filters.reference || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, reference: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Montant min</Label>
          <Input
            type="number"
            placeholder="0"
            value={filters.amountMin || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                amountMin: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Montant max</Label>
          <Input
            type="number"
            placeholder="0"
            value={filters.amountMax || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                amountMax: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
