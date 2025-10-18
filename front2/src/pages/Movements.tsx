import { useEffect, useState } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDataStore } from '@/store/dataStore'
import { MovementFilters } from '@/types'
import { applyMovementFilters } from '@/utils/filters'
import { MovementsTable } from '@/components/movements/MovementsTable'
import { MovementsFilters } from '@/components/movements/MovementsFilters'
import { RefreshDialog } from '@/components/shared/RefreshDialog'
import { useToast } from '@/hooks/use-toast'

export function Movements() {
  const {
    movements,
    movementsLastRefresh,
    selectedCompanies,
    fetchMovements,
    refreshMovements,
    isLoading,
  } = useDataStore()
  
  const [filters, setFilters] = useState<MovementFilters>({
    logic: 'ET',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showRefreshDialog, setShowRefreshDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (movements.length === 0) {
      setShowRefreshDialog(true)
    }
  }, [])

  const handleRefresh = async () => {
    try {
      await refreshMovements()
      toast({
        title: 'Données rafraîchies',
        description: 'Les mouvements ont été mis à jour',
      })
      setShowRefreshDialog(false)
    } catch (error) {
      // Error handled in store
    }
  }

  // Filter by selected company first
  const companyFilteredMovements = selectedCompanies.length > 0
    ? movements.filter(m => selectedCompanies.includes(m.companyId))
    : movements
  
  const filteredMovements = applyMovementFilters(companyFilteredMovements, filters)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mouvements Financiers</h1>
          <p className="text-muted-foreground mt-1">
            Consultez les mouvements prévisionnels d'entrées et sorties
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          <Button onClick={() => setShowRefreshDialog(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-6">
          <MovementsFilters filters={filters} onFiltersChange={setFilters} />
        </Card>
      )}

      <MovementsTable
        movements={filteredMovements}
        isLoading={isLoading}
      />

      <RefreshDialog
        open={showRefreshDialog}
        onOpenChange={setShowRefreshDialog}
        onRefresh={handleRefresh}
        lastRefresh={movementsLastRefresh}
        isRefreshing={isLoading}
      />
    </div>
  )
}
