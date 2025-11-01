import { useEffect, useState } from 'react'
import { Plus, List, Grid, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { ManualEntriesTable } from '@/components/manual-entries/ManualEntriesTable'
import { ManualEntryForm } from '@/components/manual-entries/ManualEntryForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { manualEntriesApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

export function ManualEntries() {
  const { manualEntries, selectedCompanies, fetchManualEntries, fetchMovements, isLoading } = useDataStore()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchManualEntries()
  }, [])

  // Filter by selected company - show nothing if no company selected
  let filteredManualEntries = selectedCompanies.length > 0
    ? manualEntries.filter(entry => selectedCompanies.includes(entry.companyId))
    : []

  // Filter by own data only if permission is set
  const entryPerm = user?.permissions.find(p => p.tabName === 'manual-entries')
  if (entryPerm?.ownDataOnly && user) {
    filteredManualEntries = filteredManualEntries.filter(entry => 
      entry.createdBy === user.name
    )
  }

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      await manualEntriesApi.deleteAll()
      toast({
        title: 'Suppression réussie',
        description: 'Toutes les entrées manuelles ont été supprimées',
      })
      await fetchManualEntries()
      await fetchMovements()
      setShowDeleteAllConfirm(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de supprimer les entrées',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entrées Manuelles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les mouvements financiers manuels
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={manualEntries.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer tout
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle entrée
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">
            <List className="w-4 h-4 mr-2" />
            Vue liste
          </TabsTrigger>
          <TabsTrigger value="movements">
            <Grid className="w-4 h-4 mr-2" />
            Vue mouvements éclatés
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <ManualEntriesTable
            entries={filteredManualEntries}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="movements" className="mt-6">
          <p className="text-muted-foreground text-center py-8">
            Vue des mouvements éclatés à implémenter
          </p>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle entrée manuelle</DialogTitle>
          </DialogHeader>
          <ManualEntryForm onClose={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showDeleteAllConfirm}
        onOpenChange={setShowDeleteAllConfirm}
        title="Supprimer toutes les entrées manuelles"
        description="Êtes-vous sûr de vouloir supprimer toutes les entrées manuelles ? Cette action supprimera également tous les mouvements associés et ne peut pas être annulée."
        confirmText="Supprimer tout"
        onConfirm={handleDeleteAll}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
}
