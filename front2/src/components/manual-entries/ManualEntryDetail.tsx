import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ManualEntry } from '@/types'

interface ManualEntryDetailProps {
  open: boolean
  onClose: () => void
  entry: ManualEntry | null
}

export function ManualEntryDetail({ open, onClose, entry }: ManualEntryDetailProps) {
  if (!entry) return null
  
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
          <DialogTitle>Détails de l'entrée manuelle</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={entry.sign === 'Entrée' ? 'default' : 'destructive'}>
              {entry.sign}
            </Badge>
            <span className="text-2xl font-bold">{entry.type}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Catégorie</p>
              <p className="font-medium">{entry.category}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Montant</p>
              <p className="font-medium text-lg">{valueFormatter(entry.amount)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Fréquence</p>
              <p className="font-medium">{entry.frequency}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Visibilité</p>
              <p className="font-medium">{entry.visibility}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <Badge variant={entry.status === 'Actif' ? 'default' : 'secondary'}>
                {entry.status}
              </Badge>
            </div>
            
            {entry.reference && (
              <div>
                <p className="text-sm text-gray-500">Référence</p>
                <p className="font-medium">{entry.reference}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Date de début</p>
              <p className="font-medium">{new Date(entry.start_date).toLocaleDateString('fr-FR')}</p>
            </div>
            
            {entry.end_date && (
              <div>
                <p className="text-sm text-gray-500">Date de fin</p>
                <p className="font-medium">{new Date(entry.end_date).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Créé par</p>
              <p className="font-medium">{entry.createdBy}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Créé le</p>
              <p className="font-medium">{new Date(entry.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            
            {entry.updatedBy && (
              <div>
                <p className="text-sm text-gray-500">Modifié par</p>
                <p className="font-medium">{entry.updatedBy}</p>
              </div>
            )}
            
            {entry.updatedAt && (
              <div>
                <p className="text-sm text-gray-500">Modifié le</p>
                <p className="font-medium">{new Date(entry.updatedAt).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
          </div>
          
          {entry.note && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Note</p>
              <p className="text-sm bg-gray-50 p-3 rounded">{entry.note}</p>
            </div>
          )}
          
          {entry.custom_dates && entry.custom_dates.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Dates personnalisées ({entry.custom_dates.length})
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded">
                {entry.custom_dates.map((date) => (
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
