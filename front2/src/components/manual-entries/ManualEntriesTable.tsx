import { useState } from 'react'
import { ManualEntry } from '@/types'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Edit, Trash2, Trash } from 'lucide-react'
import { manualEntriesApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useDataStore } from '@/store/dataStore'
import { ManualEntryForm } from './ManualEntryForm'

interface ManualEntriesTableProps {
  entries: ManualEntry[]
  isLoading: boolean
}

export function ManualEntriesTable({ entries, isLoading }: ManualEntriesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingEntry, setEditingEntry] = useState<ManualEntry | null>(null)
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { fetchManualEntries, fetchMovements } = useDataStore()

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === entries.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(entries.map(e => e.id))
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await manualEntriesApi.delete(deletingIds)
      toast({
        title: 'Suppression réussie',
        description: `${deletingIds.length} entrée(s) supprimée(s) avec succès`,
      })
      // Refresh both manual entries and movements
      await fetchManualEntries()
      await fetchMovements()
      setShowDeleteConfirm(false)
      setDeletingIds([])
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      await manualEntriesApi.delete(selectedIds)
      toast({
        title: 'Suppression réussie',
        description: `${selectedIds.length} entrée(s) supprimée(s) avec succès`,
      })
      // Refresh both manual entries and movements
      await fetchManualEntries()
      await fetchMovements()
      setShowBulkDeleteConfirm(false)
      setSelectedIds([])
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (id: string) => {
    setDeletingIds([id])
    setShowDeleteConfirm(true)
  }

  const openBulkDeleteDialog = () => {
    if (selectedIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Aucune sélection',
        description: 'Veuillez sélectionner au moins une entrée',
      })
      return
    }
    setShowBulkDeleteConfirm(true)
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    )
  }

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={openBulkDeleteDialog}
          >
            <Trash className="w-4 h-4 mr-2" />
            Supprimer {selectedIds.length} entrée(s)
          </Button>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedIds.length === entries.length && entries.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
              <th className="p-4 text-left font-semibold">Catégorie</th>
              <th className="p-4 text-left font-semibold">Type</th>
              <th className="p-4 text-right font-semibold">Montant</th>
              <th className="p-4 text-left font-semibold">Fréquence</th>
              <th className="p-4 text-left font-semibold">Dates</th>
              <th className="p-4 text-left font-semibold">Créé par</th>
              <th className="p-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Aucune entrée manuelle trouvée
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-muted/20">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.includes(entry.id)}
                      onCheckedChange={() => toggleSelection(entry.id)}
                    />
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{entry.category}</Badge>
                  </td>
                  <td className="p-4">{entry.type}</td>
                  <td className="p-4 text-right font-semibold">
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="p-4">
                    <Badge>{entry.frequency}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {entry.frequency === 'Une seule fois' ? (
                        <div>{formatDate(entry.start_date)}</div>
                      ) : entry.frequency === 'Dates personnalisées' && entry.custom_dates ? (
                        <span 
                          className="cursor-help underline decoration-dotted" 
                          title={entry.custom_dates.map(d => formatDate(d)).join(', ')}
                        >
                          {entry.custom_dates.length} date{entry.custom_dates.length > 1 ? 's' : ''} personnalisée{entry.custom_dates.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <>
                          <div>{formatDate(entry.start_date)} → {entry.end_date ? formatDate(entry.end_date) : '-'}</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm">{entry.createdBy}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingEntry(entry)}
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(entry.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>

    {/* Edit Dialog */}
    <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'entrée manuelle</DialogTitle>
        </DialogHeader>
        {editingEntry && (
          <ManualEntryForm
            entry={editingEntry}
            onClose={() => setEditingEntry(null)}
          />
        )}
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation */}
    <ConfirmationDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Confirmer la suppression"
      description="Êtes-vous sûr de vouloir supprimer cette entrée ? Tous les mouvements associés seront également supprimés. Cette action est irréversible."
      confirmText="Supprimer"
      variant="destructive"
      onConfirm={handleDelete}
      isLoading={isDeleting}
    />

    {/* Bulk Delete Confirmation */}
    <ConfirmationDialog
      open={showBulkDeleteConfirm}
      onOpenChange={setShowBulkDeleteConfirm}
      title="Confirmer la suppression multiple"
      description={`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} entrée(s) ? Tous les mouvements associés seront également supprimés. Cette action est irréversible.`}
      confirmText="Supprimer tout"
      variant="destructive"
      onConfirm={handleBulkDelete}
      isLoading={isDeleting}
    />
  </>
  )
}
