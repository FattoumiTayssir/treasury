import { useEffect, useState } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDataStore } from '@/store/dataStore'
import { ExceptionFilters } from '@/types'
import { applyExceptionFilters } from '@/utils/filters'
import { ExceptionsTable } from '@/components/exceptions/ExceptionsTable'
import { ExceptionsFilters } from '@/components/exceptions/ExceptionsFilters'
import { RefreshDialog } from '@/components/shared/RefreshDialog'
import { useToast } from '@/hooks/use-toast'

export function Exceptions() {
  const {
    exceptions,
    exceptionsLastRefresh,
    selectedCompanies,
    fetchExceptions,
    refreshExceptions,
    isLoading,
  } = useDataStore()
  
  const [filters, setFilters] = useState<ExceptionFilters>({
    logic: 'ET',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showRefreshDialog, setShowRefreshDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (exceptions.length === 0) {
      setShowRefreshDialog(true)
    }
  }, [])

  const handleRefresh = async () => {
    try {
      await refreshExceptions()
      toast({
        title: 'Données rafraîchies',
        description: 'Les exceptions ont été mises à jour',
      })
      setShowRefreshDialog(false)
    } catch (error) {
      // Error handled in store
    }
  }

  // Filter by selected company first - show nothing if no company selected
  const companyFilteredExceptions = selectedCompanies.length > 0
    ? exceptions.filter(e => selectedCompanies.includes(e.companyId))
    : []
  
  const filteredExceptions = applyExceptionFilters(companyFilteredExceptions, filters)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exceptions</h1>
          <p className="text-muted-foreground mt-1">
            Consultez les exceptions détectées lors du traitement
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
          <ExceptionsFilters filters={filters} onFiltersChange={setFilters} />
        </Card>
      )}

      <ExceptionsTable
        exceptions={filteredExceptions}
        isLoading={isLoading}
      />

      <RefreshDialog
        open={showRefreshDialog}
        onOpenChange={setShowRefreshDialog}
        onRefresh={handleRefresh}
        lastRefresh={exceptionsLastRefresh}
        isRefreshing={isLoading}
      />
    </div>
  )
}
