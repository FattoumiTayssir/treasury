import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, X } from 'lucide-react'
import type { Category, Sign, Frequency } from '@/types'
import type { SimulationMovement } from '@/store/simulationStore'

interface SimulationMovementFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (movement: Omit<SimulationMovement, 'id' | 'generatedDates'>) => void
  movement?: SimulationMovement | null
  onUpdate?: (id: string, movement: Omit<SimulationMovement, 'id' | 'generatedDates'>) => void
}

const categories: Category[] = ['RH', 'Achat', 'Vente', 'Compta', 'Autre']
const types = ['Salaire', 'Charges sociales', 'Achat Local', 'Achat Importation', 'Vente Local', 'Vente Export', 'TVA', 'IS', 'Autre']
const signs: Sign[] = ['Entrée', 'Sortie']
const frequencies: Frequency[] = ['Une seule fois', 'Mensuel', 'Annuel', 'Dates personnalisées']

export function SimulationMovementForm({ open, onClose, onSubmit, movement, onUpdate }: SimulationMovementFormProps) {
  const isEditMode = !!movement
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }
  const [formData, setFormData] = useState({
    category: 'Autre' as Category,
    type: '',
    amount: 0,
    sign: 'Entrée' as Sign,
    frequency: 'Une seule fois' as Frequency,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    note: '',
  })
  
  const [customDates, setCustomDates] = useState<string[]>([])
  const [newDate, setNewDate] = useState('')
  
  // Populate form when editing
  useEffect(() => {
    if (movement) {
      setFormData({
        category: movement.category,
        type: movement.type,
        amount: movement.amount,
        sign: movement.sign,
        frequency: movement.frequency,
        startDate: movement.startDate,
        endDate: movement.endDate || '',
        note: movement.note || '',
      })
      if (movement.customDates) {
        setCustomDates(movement.customDates)
      }
    }
  }, [movement])
  
  const addCustomDate = () => {
    if (newDate && !customDates.includes(newDate)) {
      setCustomDates([...customDates, newDate].sort())
      setNewDate('')
    }
  }
  
  const removeCustomDate = (date: string) => {
    setCustomDates(customDates.filter(d => d !== date))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const movementData = {
      ...formData,
      customDates: formData.frequency === 'Dates personnalisées' ? customDates : undefined,
    }
    
    if (isEditMode && movement && onUpdate) {
      onUpdate(movement.id, movementData)
    } else {
      onSubmit(movementData)
    }
    
    // Reset form
    setFormData({
      category: 'Autre',
      type: '',
      amount: 0,
      sign: 'Entrée',
      frequency: 'Une seule fois',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      note: '',
    })
    setCustomDates([])
    onClose()
  }
  
  const requiresEndDate = formData.frequency === 'Mensuel' || formData.frequency === 'Annuel'
  const showCustomDates = formData.frequency === 'Dates personnalisées'
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifier le mouvement' : 'Ajouter un mouvement'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifiez les détails du mouvement de simulation' : 'Ajoutez un nouveau mouvement à votre simulation'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: Category) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (DT) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sign">Signe *</Label>
              <Select
                value={formData.sign}
                onValueChange={(value: Sign) => setFormData({ ...formData, sign: value })}
              >
                <SelectTrigger id="sign">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {signs.map((sign) => (
                    <SelectItem key={sign} value={sign}>{sign}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence *</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: Frequency) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            
            {requiresEndDate && (
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  required
                />
              </div>
            )}
          </div>
          
          {showCustomDates && (
            <div className="space-y-2">
              <Label>Dates personnalisées</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="Ajouter une date"
                />
                <Button type="button" onClick={addCustomDate} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {customDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customDates.map((date) => (
                    <div
                      key={date}
                      className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                    >
                      <span>{new Date(date).toLocaleDateString('fr-FR')}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomDate(date)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Note optionnelle"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!formData.type || formData.amount <= 0}>
              {isEditMode ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
