import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { manualEntriesApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useDataStore } from '@/store/dataStore'
import { Category, Sign, Frequency, ManualEntry } from '@/types'
import { AlertCircle } from 'lucide-react'

interface ManualEntryFormProps {
  entry?: ManualEntry
  onClose: () => void
}

const categories: Category[] = ['RH', 'Achat', 'Vente', 'Compta', 'Autre']
const types = ['Salaire', 'Charges sociales', 'Achat Local', 'Achat Importation', 'Vente Local', 'Vente Export', 'TVA', 'IS', 'Autre']
const signs: Sign[] = ['Entrée', 'Sortie']
const frequencies: Frequency[] = ['Une seule fois', 'Mensuel', 'Annuel', 'Dates personnalisées']

export function ManualEntryForm({ entry, onClose }: ManualEntryFormProps) {
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
  })
  const [customDates, setCustomDates] = useState<string[]>([])
  const [newDate, setNewDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false)
  
  // Validation errors
  const [errors, setErrors] = useState({
    category: '',
    type: '',
    amount: '',
    sign: '',
    frequency: '',
    startDate: '',
    endDate: '',
    customDates: '',
    reference: '',
    note: ''
  })
  const { toast } = useToast()
  const { fetchManualEntries, fetchMovements, selectedCompanies } = useDataStore()
  const isEditMode = !!entry

  // Initialize form with entry data when editing
  useEffect(() => {
    if (entry) {
      setFormData({
        category: entry.category,
        type: entry.type,
        amount: entry.amount.toString(),
        sign: entry.sign,
        frequency: entry.frequency,
        startDate: entry.start_date,
        endDate: entry.end_date || '',
        reference: entry.reference || '',
        note: entry.note || '',
      })
      // Initialize custom dates if frequency is custom
      if (entry.frequency === 'Dates personnalisées' && entry.custom_dates) {
        setCustomDates(entry.custom_dates)
      }
    }
  }, [entry])

  const addCustomDate = () => {
    if (newDate && !customDates.includes(newDate)) {
      setCustomDates([...customDates, newDate].sort())
      setNewDate('')
    }
  }

  const removeCustomDate = (dateToRemove: string) => {
    setCustomDates(customDates.filter(d => d !== dateToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({
      category: '',
      type: '',
      amount: '',
      sign: '',
      frequency: '',
      startDate: '',
      endDate: '',
      customDates: '',
      reference: '',
      note: '',
      visibility: ''
    })

    // Validate all fields
    let hasError = false
    const newErrors = { ...errors }

    if (!formData.category) {
      newErrors.category = 'La catégorie est requise'
      hasError = true
    }

    if (!formData.type) {
      newErrors.type = 'Le type est requis'
      hasError = true
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0'
      hasError = true
    }

    if (!formData.sign) {
      newErrors.sign = 'Le signe est requis'
      hasError = true
    }

    if (!formData.frequency) {
      newErrors.frequency = 'La fréquence est requise'
      hasError = true
    }

    if (formData.frequency === 'Dates personnalisées') {
      if (customDates.length === 0) {
        newErrors.customDates = 'Veuillez ajouter au moins une date'
        hasError = true
      }
    } else if (formData.frequency === 'Une seule fois') {
      if (!formData.startDate) {
        newErrors.startDate = 'La date est requise'
        hasError = true
      }
    } else {
      if (!formData.startDate) {
        newErrors.startDate = 'La date de début est requise'
        hasError = true
      }
      if (!formData.endDate) {
        newErrors.endDate = 'La date de fin est requise'
        hasError = true
      } else if (formData.startDate && formData.endDate < formData.startDate) {
        newErrors.endDate = 'La date de fin doit être après la date de début'
        hasError = true
      }
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }
    
    // Show confirmation dialog for updates
    if (isEditMode) {
      setShowUpdateConfirm(true)
      return
    }

    // For creation, proceed directly
    await saveEntry()
  }

  const saveEntry = async () => {
    // Validate that a company is selected
    const companyId = entry?.companyId || selectedCompanies[0]
    if (!companyId) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner une compagnie dans le header',
      })
      return
    }
    
    setIsSubmitting(true)

    try {
      if (isEditMode) {
        // Use delete + insert approach for updates
        // First delete the old entry and its movements
        await manualEntriesApi.delete([entry.id])
        
        // Then create a new entry with updated data
        await manualEntriesApi.create({
          companyId: companyId,
          company_id: parseInt(companyId),
          category: formData.category,
          type: formData.type,
          amount: parseFloat(formData.amount),
          sign: formData.sign,
          frequency: formData.frequency,
          start_date: formData.frequency === 'Dates personnalisées' ? customDates[0] : formData.startDate,
          end_date: formData.frequency === 'Une seule fois' || formData.frequency === 'Dates personnalisées' ? undefined : formData.endDate,
          custom_dates: formData.frequency === 'Dates personnalisées' ? customDates : undefined,
          reference: formData.reference || undefined,
          note: formData.note || undefined,
          status: 'Actif',
        } as any)

        toast({
          title: 'Entrée modifiée',
          description: 'L\'entrée manuelle a été mise à jour avec succès',
        })
      } else {
        // Create new entry
        await manualEntriesApi.create({
          companyId: companyId,
          company_id: parseInt(companyId),
          category: formData.category,
          type: formData.type,
          amount: parseFloat(formData.amount),
          sign: formData.sign,
          frequency: formData.frequency,
          start_date: formData.frequency === 'Dates personnalisées' ? customDates[0] : formData.startDate,
          end_date: formData.frequency === 'Une seule fois' || formData.frequency === 'Dates personnalisées' ? undefined : formData.endDate,
          custom_dates: formData.frequency === 'Dates personnalisées' ? customDates : undefined,
          reference: formData.reference || undefined,
          note: formData.note || undefined,
          status: 'Actif',
        } as any)

        toast({
          title: 'Entrée créée',
          description: 'L\'entrée manuelle a été ajoutée avec succès',
        })
      }
      
      // Refresh both manual entries and movements
      await fetchManualEntries()
      await fetchMovements()
      setShowUpdateConfirm(false)
      onClose()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.message || `Impossible de ${isEditMode ? 'modifier' : 'créer'} l\'entrée`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Catégorie *</Label>
          <Select
            value={formData.category}
            onValueChange={(value: Category) => {
              setFormData({ ...formData, category: value })
              setErrors({ ...errors, category: '' })
            }}
          >
            <SelectTrigger className={errors.category ? 'border-red-500 focus-visible:ring-red-500' : ''}>
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
          {errors.category && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.category}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => {
              setFormData({ ...formData, type: value })
              setErrors({ ...errors, type: '' })
            }}
          >
            <SelectTrigger className={errors.type ? 'border-red-500 focus-visible:ring-red-500' : ''}>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.type}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Montant *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => {
              setFormData({ ...formData, amount: e.target.value })
              setErrors({ ...errors, amount: '' })
            }}
            placeholder="0.00"
            className={errors.amount ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.amount && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.amount}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Signe *</Label>
          <Select
            value={formData.sign}
            onValueChange={(value: Sign) => {
              setFormData({ ...formData, sign: value })
              setErrors({ ...errors, sign: '' })
            }}
          >
            <SelectTrigger className={errors.sign ? 'border-red-500 focus-visible:ring-red-500' : ''}>
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
          {errors.sign && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.sign}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Fréquence *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value: Frequency) => {
              setFormData({ ...formData, frequency: value })
              setErrors({ ...errors, frequency: '' })
            }}
          >
            <SelectTrigger className={errors.frequency ? 'border-red-500 focus-visible:ring-red-500' : ''}>
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
          {errors.frequency && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.frequency}</span>
            </div>
          )}
        </div>

        {formData.frequency === 'Une seule fois' ? (
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => {
                setFormData({ ...formData, startDate: e.target.value })
                setErrors({ ...errors, startDate: '' })
              }}
              className={errors.startDate ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.startDate && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.startDate}</span>
              </div>
            )}
          </div>
        ) : formData.frequency === 'Dates personnalisées' ? (
          <div className="col-span-2 space-y-2">
            <Label>Dates personnalisées *</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                placeholder="Sélectionner une date"
                className={errors.customDates ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              <Button type="button" onClick={addCustomDate} disabled={!newDate}>
                Ajouter
              </Button>
            </div>
            {customDates.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">{customDates.length} date(s) ajoutée(s):</p>
                <div className="flex flex-wrap gap-2">
                  {customDates.map((date) => (
                    <div
                      key={date}
                      className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm"
                    >
                      <span>{new Date(date).toLocaleDateString('fr-FR')}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomDate(date)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errors.customDates && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.customDates}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Ajoutez une ou plusieurs dates pour créer des mouvements à ces dates spécifiques
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value })
                  setErrors({ ...errors, startDate: '' })
                }}
                className={errors.startDate ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.startDate && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.startDate}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date de fin *</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value })
                  setErrors({ ...errors, endDate: '' })
                }}
                min={formData.startDate}
                className={errors.endDate ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.endDate ? (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.endDate}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {formData.frequency === 'Mensuel' && 'Les mouvements seront générés mensuellement dans cette plage'}
                  {formData.frequency === 'Annuel' && 'Les mouvements seront générés annuellement dans cette plage'}
                </p>
              )}
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Référence</Label>
          <Input
            value={formData.reference}
            onChange={(e) => {
              setFormData({ ...formData, reference: e.target.value })
              setErrors({ ...errors, reference: '' })
            }}
            placeholder="Optionnel"
            className={errors.reference ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.reference && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.reference}</span>
            </div>
          )}
        </div>

      </div>

      <div className="space-y-2">
        <Label>Note</Label>
        <Input
          value={formData.note}
          onChange={(e) => {
            setFormData({ ...formData, note: e.target.value })
            setErrors({ ...errors, note: '' })
          }}
          placeholder="Description optionnelle"
          className={errors.note ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.note && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.note}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditMode ? 'Modification...' : 'Création...') : (isEditMode ? 'Modifier' : 'Créer')}
        </Button>
      </div>
    </form>

    {/* Update Confirmation Dialog */}
    <ConfirmationDialog
      open={showUpdateConfirm}
      onOpenChange={setShowUpdateConfirm}
      title="Confirmer la modification"
      description="La modification d'une entrée manuelle supprimera les anciens mouvements et en créera de nouveaux. Êtes-vous sûr de vouloir continuer ?"
      confirmText="Confirmer"
      onConfirm={saveEntry}
      isLoading={isSubmitting}
    />
  </>
  )
}
