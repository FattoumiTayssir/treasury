import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface ExcludeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isExcluding: boolean
  itemCount: number
  itemReference?: string
  action: 'exclude' | 'include'
}

export function ExcludeConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isExcluding,
  itemCount,
  itemReference,
  action,
}: ExcludeConfirmDialogProps) {
  const isExclude = action === 'exclude'
  
  const title = isExclude 
    ? 'Exclure des analyses' 
    : 'Inclure dans les analyses'
  
  const getDescription = () => {
    if (itemCount === 1 && itemReference) {
      const baseText = isExclude
        ? `Voulez-vous exclure le mouvement "${itemReference}" des analyses ?`
        : `Voulez-vous inclure le mouvement "${itemReference}" dans les analyses ?`
      
      const explanation = isExclude
        ? '\n\nCe mouvement ne sera plus compté dans les calculs d\'analyses.'
        : '\n\nCe mouvement sera à nouveau compté dans les calculs d\'analyses.'
      
      return baseText + explanation
    }
    
    const baseText = isExclude
      ? `Voulez-vous exclure ${itemCount} mouvement${itemCount > 1 ? 's' : ''} des analyses ?`
      : `Voulez-vous inclure ${itemCount} mouvement${itemCount > 1 ? 's' : ''} dans les analyses ?`
    
    const explanation = isExclude
      ? '\n\nCes mouvements ne seront plus comptés dans les calculs d\'analyses.'
      : '\n\nCes mouvements seront à nouveau comptés dans les calculs d\'analyses.'
    
    return baseText + explanation
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={getDescription()}
      confirmText="Confirmer"
      cancelText="Annuler"
      onConfirm={onConfirm}
      variant="default"
      isLoading={isExcluding}
    />
  )
}
