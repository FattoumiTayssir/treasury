import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utils/formatters'
import { RefreshCw } from 'lucide-react'

interface RefreshDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
  lastRefresh: string | null
  isRefreshing: boolean
}

export function RefreshDialog({
  open,
  onOpenChange,
  onRefresh,
  lastRefresh,
  isRefreshing,
}: RefreshDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rafraîchir les données</DialogTitle>
          <DialogDescription>
            {lastRefresh ? (
              <>
                Dernière mise à jour : <strong>{formatDateTime(lastRefresh)}</strong>
              </>
            ) : (
              'Aucune donnée disponible'
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
