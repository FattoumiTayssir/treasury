import { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw, Info, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { treasuryApi } from '@/services/api'
import type { TreasuryBalance, TreasuryBalanceSource } from '@/types'
import { useDataStore } from '@/store/dataStore'

interface SourceInput {
  id: string
  sourceName: string
  amount: string
  sourceDate: string
  notes: string
}

export function TreasurySettings() {
  const { selectedCompanies, companies } = useDataStore()
  const selectedCompany = selectedCompanies[0] || ''
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [sources, setSources] = useState<SourceInput[]>([])
  const [currentBalance, setCurrentBalance] = useState<TreasuryBalance | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const loadCurrentBalance = useCallback(async () => {
    if (!selectedCompany) return
    
    setIsLoading(true)
    try {
      const response = await treasuryApi.getBalance(selectedCompany)
      setCurrentBalance(response.data)
      setReferenceDate(response.data.referenceDate)
      setNotes(response.data.notes || '')
      
      // Load sources or create default
      if (response.data.sources && response.data.sources.length > 0) {
        setSources(response.data.sources.map(s => ({
          id: s.sourceId?.toString() || Math.random().toString(),
          sourceName: s.sourceName,
          amount: s.amount.toString(),
          sourceDate: s.sourceDate,
          notes: s.notes || ''
        })))
      } else {
        // Create one empty source
        setSources([{
          id: Math.random().toString(),
          sourceName: '',
          amount: response.data.amount.toString(),
          sourceDate: response.data.referenceDate,
          notes: ''
        }])
      }
    } catch (error) {
      console.error('Failed to load balance:', error)
      setCurrentBalance(null)
      setNotes('')
      setSources([{
        id: Math.random().toString(),
        sourceName: '',
        amount: '0',
        sourceDate: new Date().toISOString().split('T')[0],
        notes: ''
      }])
    } finally {
      setIsLoading(false)
    }
  }, [selectedCompany])

  useEffect(() => {
    if (selectedCompany) {
      loadCurrentBalance()
    } else {
      setCurrentBalance(null)
      setNotes('')
      setSources([{
        id: Math.random().toString(),
        sourceName: '',
        amount: '0',
        sourceDate: new Date().toISOString().split('T')[0],
        notes: ''
      }])
    }
  }, [selectedCompany, loadCurrentBalance])

  const addSource = () => {
    setSources([...sources, {
      id: Math.random().toString(),
      sourceName: '',
      amount: '0',
      sourceDate: new Date().toISOString().split('T')[0],
      notes: ''
    }])
  }

  const removeSource = (id: string) => {
    if (sources.length > 1) {
      setSources(sources.filter(s => s.id !== id))
    }
  }

  const updateSource = (id: string, field: keyof SourceInput, value: string) => {
    setSources(sources.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const calculateTotalAmount = () => {
    return sources.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  }

  const isDateInPast = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getDateWarningMessage = () => {
    if (isDateInPast(referenceDate)) {
      const daysDiff = Math.floor((new Date().getTime() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24))
      return `Cette date de référence est dans le passé (il y a ${daysDiff} jour${daysDiff > 1 ? 's' : ''}). Les analyses utiliseront ce solde comme point de départ mais resteront constant depuis cette date jusqu'à aujourd'hui, car les analyses commencent toujours à partir d'aujourd'hui.`
    }
    return null
  }

  const handleSave = async () => {
    if (!selectedCompany) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner une entreprise',
      })
      return
    }

    // Validate sources
    for (const source of sources) {
      if (!source.sourceName.trim()) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Veuillez saisir un nom pour toutes les sources',
        })
        return
      }
      if (!source.amount || parseFloat(source.amount) < 0) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: `Montant invalide pour la source "${source.sourceName}"`,
        })
        return
      }
    }

    const totalAmount = calculateTotalAmount()
    if (totalAmount < 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le montant total ne peut pas être négatif',
      })
      return
    }

    setIsSaving(true)
    try {
      const sourcesData = sources.map(s => ({
        sourceName: s.sourceName,
        amount: parseFloat(s.amount),
        sourceDate: s.sourceDate,
        notes: s.notes || undefined
      }))

      await treasuryApi.updateBalance(
        selectedCompany,
        totalAmount,
        referenceDate,
        notes,
        sourcesData
      )
      
      toast({
        title: 'Trésorerie enregistrée',
        description: `Montant total: ${formatCurrency(totalAmount)} avec ${sources.length} source${sources.length > 1 ? 's' : ''}`,
      })
      
      // Reload to show updated info
      await loadCurrentBalance()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.detail || 'Impossible de mettre à jour la trésorerie',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
    }).format(value)
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Configuration de la trésorerie par entreprise
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Montant de Trésorerie</CardTitle>
          <CardDescription>
            Définissez le montant de trésorerie de référence (comptes bancaires + espèces).
            Ce montant est la base de tous les calculs de trésorerie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Balance Info */}
          {selectedCompany && companies.length > 0 && (
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700">
                Entreprise sélectionnée: {companies.find(c => c.id === selectedCompany)?.name}
              </Label>
            </div>
          )}

          {/* Balance Info Card */}
          {selectedCompany && currentBalance && currentBalance.amount > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Solde actuel</span>
              </div>
              <div className="ml-7 space-y-1">
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(currentBalance.amount)}
                </p>
                <p className="text-sm text-blue-700">
                  Date de référence: {new Date(currentBalance.referenceDate).toLocaleDateString('fr-FR')}
                </p>
                {currentBalance.updatedBy && (
                  <p className="text-xs text-blue-600">
                    Mis à jour par {currentBalance.updatedBy} le{' '}
                    {formatDateTime(currentBalance.updatedAt)}
                  </p>
                )}
                {currentBalance.notes && (
                  <p className="text-sm text-blue-600 italic">
                    Note: {currentBalance.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {selectedCompany && (
            <>
              {/* Date warning */}
              {getDateWarningMessage() && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-900 block">Date de référence dans le passé</span>
                      <p className="text-sm text-amber-800 mt-1">{getDateWarningMessage()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="referenceDate">Date de référence générale *</Label>
                <Input
                  id="referenceDate"
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Date générale de référence (peut être dans le passé, mais un avertissement sera affiché)
                </p>
              </div>

              {/* Sources Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Sources de Trésorerie *</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajoutez chaque compte bancaire ou source d'espèces séparément avec sa propre date
                    </p>
                  </div>
                  <Button type="button" onClick={addSource} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une source
                  </Button>
                </div>

                {/* Source List */}
                <div className="space-y-4">
                  {sources.map((source, index) => (
                    <div key={source.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Source {index + 1}</Label>
                        {sources.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSource(source.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`source-name-${source.id}`} className="text-xs">
                            Nom de la source *
                          </Label>
                          <Input
                            id={`source-name-${source.id}`}
                            type="text"
                            placeholder="Ex: Banque A, Caisse, Chèque, Traite"
                            value={source.sourceName}
                            onChange={(e) => updateSource(source.id, 'sourceName', e.target.value)}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`source-amount-${source.id}`} className="text-xs">
                            Montant (TND) *
                          </Label>
                          <Input
                            id={`source-amount-${source.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={source.amount}
                            onChange={(e) => updateSource(source.id, 'amount', e.target.value)}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`source-date-${source.id}`} className="text-xs">
                            Date du relevé *
                          </Label>
                          <Input
                            id={`source-date-${source.id}`}
                            type="date"
                            value={source.sourceDate}
                            onChange={(e) => updateSource(source.id, 'sourceDate', e.target.value)}
                            disabled={isLoading}
                          />
                          {isDateInPast(source.sourceDate) && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Date dans le passé
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`source-notes-${source.id}`} className="text-xs">
                            Notes (optionnel)
                          </Label>
                          <Input
                            id={`source-notes-${source.id}`}
                            type="text"
                            placeholder="Ex: Compte courant principal"
                            value={source.notes}
                            onChange={(e) => updateSource(source.id, 'notes', e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Display */}
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-900">Montant Total</span>
                    <span className="text-2xl font-bold text-indigo-900">
                      {formatCurrency(calculateTotalAmount())}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 mt-1">
                    Somme de toutes les sources ({sources.length} source{sources.length > 1 ? 's' : ''})
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes générales (optionnel)</Label>
                <Input
                  id="notes"
                  type="text"
                  placeholder="Ex: Relevé du trimestre"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Notes générales sur cette configuration de trésorerie
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadCurrentBalance} 
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </>
          )}

          {!selectedCompany && companies.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                Aucune entreprise disponible. Veuillez d'abord créer une entreprise.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
