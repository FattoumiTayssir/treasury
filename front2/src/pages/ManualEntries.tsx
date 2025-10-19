import { useEffect, useState } from 'react'
import { Plus, List, Grid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataStore } from '@/store/dataStore'
import { ManualEntriesTable } from '@/components/manual-entries/ManualEntriesTable'
import { ManualEntryForm } from '@/components/manual-entries/ManualEntryForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function ManualEntries() {
  const { manualEntries, selectedCompanies, fetchManualEntries, isLoading } = useDataStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchManualEntries()
  }, [])

  // Filter by selected company - show nothing if no company selected
  const filteredManualEntries = selectedCompanies.length > 0
    ? manualEntries.filter(entry => selectedCompanies.includes(entry.companyId))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entrées Manuelles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les mouvements financiers manuels
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle entrée
        </Button>
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
    </div>
  )
}
