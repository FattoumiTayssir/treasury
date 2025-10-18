import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { treasuryApi } from '@/services/api'

export function TreasurySettings() {
  const [amount, setAmount] = useState('')
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await treasuryApi.updateBalance('default', parseFloat(amount), referenceDate)
      toast({
        title: 'Montant enregistré',
        description: 'Le montant de trésorerie a été mis à jour',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de mettre à jour le montant',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Configuration de la trésorerie
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Montant de Trésorerie</CardTitle>
          <CardDescription>
            Définissez le montant de trésorerie actuel (comptes bancaires + espèces)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referenceDate">Date de référence</Label>
            <Input
              id="referenceDate"
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (EUR)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
