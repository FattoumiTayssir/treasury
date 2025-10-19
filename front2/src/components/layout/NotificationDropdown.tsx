import { Bell, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useEffect } from 'react'
import { useDataStore } from '@/store/dataStore'

export function NotificationDropdown() {
  const { exceptions, selectedCompanies, fetchExceptions, isLoading } = useDataStore()

  useEffect(() => {
    // Fetch exceptions when component mounts
    console.log('NotificationDropdown mounted, exceptions count:', exceptions.length)
    if (exceptions.length === 0) {
      console.log('Fetching exceptions...')
      fetchExceptions()
    }
  }, [fetchExceptions, exceptions.length])

  const handleOpenOdooLink = (odooLink?: string) => {
    if (odooLink) {
      window.open(odooLink, '_blank', 'noopener,noreferrer')
    }
  }

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'Critique':
        return 'bg-red-500'
      case 'Majeure':
        return 'bg-orange-500'
      case 'Warning':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Only show exceptions if a company is selected
  // Filter by selected company and only active exceptions (state === 'Actif')
  const filteredExceptions = selectedCompanies.length > 0
    ? exceptions.filter(e => e.state === 'Actif' && selectedCompanies.includes(e.companyId))
    : []

  const notificationCount = filteredExceptions.length

  // Debug log
  console.log('NotificationDropdown render:', {
    totalExceptions: exceptions.length,
    selectedCompanies,
    filteredCount: filteredExceptions.length,
    firstException: exceptions[0]
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Exceptions ({notificationCount})</span>
          {isLoading && <span className="text-xs text-gray-500">Chargement...</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {selectedCompanies.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Veuillez sélectionner une compagnie
          </div>
        ) : filteredExceptions.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Aucune exception active
          </div>
        ) : (
          filteredExceptions.slice(0, 10).map((exception) => (
            <DropdownMenuItem
              key={exception.id}
              className="flex flex-col items-start gap-2 p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => handleOpenOdooLink(exception.odooLink)}
            >
              <div className="flex items-start justify-between w-full gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {exception.type}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${getCriticalityColor(exception.criticality)}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {exception.reference || 'Sans référence'}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                    {exception.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Montant: {exception.amount.toFixed(2)} TND
                  </p>
                </div>
                {exception.odooLink && (
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        {filteredExceptions.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center text-xs text-gray-500">
              +{filteredExceptions.length - 10} autres exceptions
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
