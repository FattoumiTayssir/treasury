import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SimulationMovement } from '@/store/simulationStore'

interface SimulationMovementDetailProps {
  open: boolean
  onClose: () => void
  movement: SimulationMovement | null
}

export function SimulationMovementDetail({ open, onClose, movement }: SimulationMovementDetailProps) {
  if (!movement) return null
  
  const valueFormatter = (value: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(value)
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du mouvement</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={movement.sign === 'Entrée' ? 'success' : 'destructive'}>
              {movement.sign}
            </Badge>
            <span className="text-2xl font-bold">{movement.type}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Catégorie</p>
              <p className="font-medium">{movement.category}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Montant</p>
              <p className="font-medium text-lg">{valueFormatter(movement.amount)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Fréquence</p>
              <p className="font-medium">{movement.frequency}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Date de début</p>
              <p className="font-medium">{new Date(movement.startDate).toLocaleDateString('fr-FR')}</p>
            </div>
            
            {movement.endDate && (
              <div>
                <p className="text-sm text-gray-500">Date de fin</p>
                <p className="font-medium">{new Date(movement.endDate).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </div>
          
          {movement.note && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Note</p>
              <p className="text-sm bg-gray-50 p-3 rounded">{movement.note}</p>
            </div>
          )}
          
          {movement.generatedDates && movement.generatedDates.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Dates générées ({movement.generatedDates.length})
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded">
                {movement.generatedDates.map((date) => (
                  <div key={date} className="text-sm bg-white px-2 py-1 rounded border">
                    {new Date(date).toLocaleDateString('fr-FR')}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
