import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { manualEntriesApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useDataStore } from '@/store/dataStore'
import { Category, Sign, Frequency, Visibility } from '@/types'

interface ManualEntryFormProps {
  onClose: () => void
}

const categories: Category[] = ['RH', 'Achat', 'Vente', 'Compta', 'Autre']
const signs: Sign[] = ['Entrée', 'Sortie']
const frequencies: Frequency[] = ['Une seule fois', 'Mensuel', 'Annuel']
const visibilities: Visibility[] = ['Public', 'Simulation privée']

export function ManualEntryForm({ onClose }: ManualEntryFormProps) {
  const [formData, setFormData] = useState({
    category: '' as Category,
    type: '',
    amount: '',
    sign: '' as Sign,
    frequency: '' as Frequency,
    startDate: '',
    endDate: '',
    reference: '',
    note: '',
    visibility: 'Public' as Visibility,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { fetchManualEntries, selectedCompanies } = useDataStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that a company is selected
    if (!selectedCompanies || selectedCompanies.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner une compagnie dans le header',
      })
      return
    }
    
    setIsSubmitting(true)

    try {
      await manualEntriesApi.create({
        companyId: selectedCompanies[0],
        company_id: parseInt(selectedCompanies[0]),
        category: formData.category,
        type: formData.type,
        amount: parseFloat(formData.amount),
        sign: formData.sign,
        frequency: formData.frequency,
        start_date: formData.startDate,
        end_date: formData.frequency === 'Une seule fois' ? formData.startDate : formData.endDate,
        reference: formData.reference || undefined,
        note: formData.note || undefined,
        visibility: formData.visibility,
        status: 'Actif',
      } as any)

      toast({
        title: 'Entrée créée',
        description: 'L\'entrée manuelle a été ajoutée avec succès',
      })
      
      fetchManualEntries()
      onClose()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de créer l\'entrée',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Catégorie *</Label>
          <Select
            value={formData.category}
            onValueChange={(value: Category) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Type *</Label>
          <Input
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="Ex: Salaires, TVA..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Montant *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Signe *</Label>
          <Select
            value={formData.sign}
            onValueChange={(value: Sign) =>
              setFormData({ ...formData, sign: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {signs.map((sign) => (
                <SelectItem key={sign} value={sign}>
                  {sign}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fréquence *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value: Frequency) =>
              setFormData({ ...formData, frequency: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.frequency === 'Une seule fois' ? (
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date de fin *</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
                min={formData.startDate}
              />
              <p className="text-xs text-muted-foreground">
                {formData.frequency === 'Mensuel' && 'Les mouvements seront générés mensuellement dans cette plage'}
                {formData.frequency === 'Annuel' && 'Les mouvements seront générés annuellement dans cette plage'}
              </p>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Référence</Label>
          <Input
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder="Optionnel"
          />
        </div>

        <div className="space-y-2">
          <Label>Visibilité</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value: Visibility) =>
              setFormData({ ...formData, visibility: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilities.map((vis) => (
                <SelectItem key={vis} value={vis}>
                  {vis}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Note</Label>
        <Input
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="Description optionnelle"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
