import { useEffect, useState } from 'react'
import { RefreshCw, Clock, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDataStore } from '@/store/dataStore'
import { MovementFilters } from '@/types'
import { applyMovementFilters } from '@/utils/filters'
import { MovementsTableAdvanced } from '@/components/movements/MovementsTableAdvanced'
import { MovementsFilters } from '@/components/movements/MovementsFilters'
import { RefreshDialog } from '@/components/shared/RefreshDialog'
import { useToast } from '@/hooks/use-toast'
import { movementsApi } from '@/services/api'

export function Movements() {
  const {
    movements,
    movementsLastRefresh,
    selectedCompanies,
    fetchMovements,
    refreshMovements,
    updateMovementsOptimistic,
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

  const handleExcludeFromAnalytics = async (ids: string[], exclude: boolean) => {
    // Optimistically update UI immediately
    updateMovementsOptimistic(ids, exclude)
    
    // Show toast immediately
    toast({
      title: exclude ? 'Mouvements exclus' : 'Mouvements inclus',
      description: `${ids.length} mouvement(s) ${exclude ? 'exclu(s)' : 'inclus'} des analyses`,
    })
    
    try {
      // Call API in background
      await movementsApi.excludeFromAnalytics(ids, exclude)
    } catch (error: any) {
      // Revert optimistic update on error
      updateMovementsOptimistic(ids, !exclude)
      
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.detail || 'Impossible de modifier les mouvements',
      })
      throw error
    }
  }

  const formatLastRefresh = (dateStr: string) => {
    if (!dateStr) return 'Jamais'
    const date = new Date(dateStr)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter by selected company first - show nothing if no company selected
  const companyFilteredMovements = selectedCompanies.length > 0
    ? movements.filter(m => selectedCompanies.includes(m.companyId))
    : []
  
  // Apply additional filters from the filter panel
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

      {/* ETL Timestamp Display */}
      {movementsLastRefresh && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">Dernière synchronisation Odoo:</span>
            <span>{formatLastRefresh(movementsLastRefresh)}</span>
          </div>
        </Card>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-6">
          <MovementsFilters filters={filters} onFiltersChange={setFilters} />
        </Card>
      )}

      <MovementsTableAdvanced
        movements={filteredMovements}
        isLoading={isLoading}
        onExcludeFromAnalytics={handleExcludeFromAnalytics}
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
