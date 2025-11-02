import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts'
import { 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Edit2, 
  Eye
} from 'lucide-react'
import { useSimulationStore, type SimulationMovement } from '@/store/simulationStore'
import { SimulationMovementForm } from '@/components/simulation/SimulationMovementForm'
import { SimulationMovementDetail } from '@/components/simulation/SimulationMovementDetail'
import { analyticsApi, treasuryApi } from '@/services/api'
import { useDataStore } from '@/store/dataStore'
import type { TreasuryBalance } from '@/types'

const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  gray: '#6b7280',
}

export default function SimulationAnalytics() {
  const { selectedCompanies } = useDataStore()
  const selectedCompany = selectedCompanies[0] || ''
  const [treasuryBalance, setTreasuryBalance] = useState<TreasuryBalance | null>(null)
  const { 
    simulations, 
    activeSimulationId,
    createSimulation,
    deleteSimulation,
    setActiveSimulation,
    addMovement,
    updateMovement,
    deleteMovement,
    importSimulation,
    getActiveSimulation,
    getActiveMovements,
    getAllGeneratedMovements,
  } = useSimulationStore()
  
  const [forecastData, setForecastData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Simulation info
  const [simulationName, setSimulationName] = useState('')
  const [simulationDescription, setSimulationDescription] = useState('')
  
  const activeSimulation = getActiveSimulation()
  // Get movements and memoize based on array content, not reference
  const rawMovements = getActiveMovements()
  const simulationMovements = useMemo(() => rawMovements, [rawMovements.length, activeSimulationId, activeSimulation?.updatedAt])
  
  const [showMovementDialog, setShowMovementDialog] = useState(false)
  const [editingMovement, setEditingMovement] = useState<SimulationMovement | null>(null)
  const [detailMovement, setDetailMovement] = useState<SimulationMovement | null>(null)
  // Date filter state - default to today to 6 months future
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState<string>(today)
  const [dateTo, setDateTo] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 6)
    return date.toISOString().split('T')[0]
  })
  
  // Filter forecast data by date range
  const filteredForecastData = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return []
    if (!dateFrom && !dateTo) return forecastData
    
    return forecastData.filter((item) => {
      const itemDate = new Date(item.date)
      const fromDate = dateFrom ? new Date(dateFrom) : null
      const toDate = dateTo ? new Date(dateTo) : null
      
      if (fromDate && itemDate < fromDate) return false
      if (toDate && itemDate > toDate) return false
      return true
    })
  }, [forecastData, dateFrom, dateTo])
  
  const filteredMetrics = useMemo(() => {
    if (!filteredForecastData || filteredForecastData.length === 0 || !treasuryBalance) return null
    
    const startData = filteredForecastData[0]
    const endData = filteredForecastData[filteredForecastData.length - 1]
    
    // New (with simulation)
    const totalIn = filteredForecastData.reduce((sum: number, d: any) => sum + (d.inflow || 0), 0)
    const totalOut = filteredForecastData.reduce((sum: number, d: any) => sum + (d.outflow || 0), 0)
    const startBalance = startData.predictedBalance || treasuryBalance.amount
    const endBalance = endData.predictedBalance || startBalance
    const change = endBalance - startBalance
    
    // Old (baseline without simulation)
    const oldStartBalance = startData.baselineBalance || startBalance
    const oldEndBalance = endData.baselineBalance || endBalance
    const oldChange = oldEndBalance - oldStartBalance
    
    // Calculate baseline inflow/outflow (original values before simulation)
    const totalSimInflow = filteredForecastData.reduce((sum: number, d: any) => sum + (d.simulationInflow || 0), 0)
    const totalSimOutflow = filteredForecastData.reduce((sum: number, d: any) => sum + (d.simulationOutflow || 0), 0)
    const oldTotalIn = totalIn - totalSimInflow
    const oldTotalOut = totalOut - totalSimOutflow
    
    return {
      // New values
      balanceAtStart: startBalance,
      balanceAtEnd: endBalance,
      totalInflow: totalIn,
      totalOutflow: totalOut,
      changeAmount: change,
      changePercent: startBalance !== 0 ? (change / startBalance) * 100 : 0,
      
      // Old (baseline) values
      oldBalanceAtStart: oldStartBalance,
      oldBalanceAtEnd: oldEndBalance,
      oldTotalInflow: oldTotalIn,
      oldTotalOutflow: oldTotalOut,
      oldChangeAmount: oldChange,
      oldChangePercent: oldStartBalance !== 0 ? (oldChange / oldStartBalance) * 100 : 0,
    }
  }, [filteredForecastData, treasuryBalance])
  
  const valueFormatter = (value: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(value)
  }
  
  const percentageFormatter = (value: number) => {
    return `${value.toFixed(2)}%`
  }
  
  const loadTreasuryBalance = useCallback(async () => {
    if (!selectedCompany) return
    
    try {
      const response = await treasuryApi.getBalance(selectedCompany)
      setTreasuryBalance(response.data)
    } catch (error) {
      console.error('Failed to load treasury balance:', error)
    }
  }, [selectedCompany, setTreasuryBalance])
  
  const loadSimulationAnalytics = useCallback(async () => {
    if (!selectedCompany || !treasuryBalance) return
    
    setLoading(true)
    try {
      // Get base forecast
      const forecast = await analyticsApi.getForecast({
        companyId: selectedCompany,
        forecastDays: 180,
      })
      
      let baseData = forecast.data
      
      // Apply simulation movements to the forecast
      const generatedMovements = getAllGeneratedMovements()
      if (generatedMovements.length > 0) {
        const movementsByDate: Record<string, { inflow: number; outflow: number }> = {}
        
        generatedMovements.forEach((movement) => {
          if (!movementsByDate[movement.date]) {
            movementsByDate[movement.date] = { inflow: 0, outflow: 0 }
          }
          
          if (movement.sign === 'Entrée') {
            movementsByDate[movement.date].inflow += movement.amount
          } else {
            movementsByDate[movement.date].outflow += movement.amount
          }
        })
        
        // Apply simulation movements only to their specific dates
        // Start with baseline and apply deltas only where movements occur
        let cumulativeDelta = 0 // Track cumulative impact of simulation movements
        
        baseData = baseData.map((item: any) => {
          const simMov = movementsByDate[item.date]
          const additionalInflow = simMov ? simMov.inflow : 0
          const additionalOutflow = simMov ? simMov.outflow : 0
          
          // Calculate the net change from simulation on this date
          const simulationImpact = additionalInflow - additionalOutflow
          cumulativeDelta += simulationImpact
          
          // New balance = baseline balance + cumulative simulation impact
          const baselineBalance = item.predictedBalance
          const newBalance = baselineBalance + cumulativeDelta
          
          return {
            ...item,
            baselineBalance: baselineBalance, // Keep original for comparison
            inflow: (item.inflow || 0) + additionalInflow,
            outflow: (item.outflow || 0) + additionalOutflow,
            predictedBalance: newBalance,
            simulationInflow: additionalInflow,
            simulationOutflow: additionalOutflow,
          }
        })
      } else {
        // No simulation movements, just mark baseline
        baseData = baseData.map((item: any) => ({
          ...item,
          baselineBalance: item.predictedBalance,
        }))
      }
      
      setForecastData(baseData)
    } catch (error) {
      console.error('Failed to load simulation analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, treasuryBalance, activeSimulationId, activeSimulation?.updatedAt])
  
  useEffect(() => {
    loadTreasuryBalance()
  }, [selectedCompany, loadTreasuryBalance])
  
  useEffect(() => {
    if (treasuryBalance) {
      loadSimulationAnalytics()
    }
  }, [treasuryBalance, loadSimulationAnalytics])
  
  const handleCreateSimulation = () => {
    if (!simulationName.trim()) return
    createSimulation(simulationName, simulationDescription)
    setSimulationName('')
    setSimulationDescription('')
  }
  
  const handleAddMovement = (movement: Omit<SimulationMovement, 'id' | 'generatedDates'>) => {
    try {
      addMovement(movement)
      setShowMovementDialog(false)
    } catch (error) {
      console.error('Error adding movement:', error)
      alert('Erreur lors de l\'ajout du mouvement: ' + (error as Error).message)
    }
  }
  
  const handleUpdateMovement = (id: string, movement: Omit<SimulationMovement, 'id' | 'generatedDates'>) => {
    try {
      updateMovement(id, movement)
      setEditingMovement(null)
    } catch (error) {
      console.error('Error updating movement:', error)
      alert('Erreur lors de la modification du mouvement: ' + (error as Error).message)
    }
  }
  
  const handleExport = () => {
    if (!activeSimulationId) return
    
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(activeSimulation, null, 2)], { type: 'application/json' })
    )
    a.download = `simulation_${activeSimulation?.name}_${Date.now()}.tabtre`
    a.click()
  }
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        importSimulation(data)
      } catch (error) {
        console.error('Error importing simulation:', error)
        alert('Erreur lors de l\'importation: fichier invalide')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Simulation de Trésorerie</h1>
          <p className="text-gray-500 mt-1">
            Créez des scénarios et simulez l'impact sur votre trésorerie
          </p>
        </div>
        
        <div className="flex gap-2">
          <label htmlFor="import-simulation">
            <Button variant="outline" onClick={() => document.getElementById('import-simulation')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <input
              id="import-simulation"
              type="file"
              accept=".tabtre,.json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          {activeSimulationId && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>
      
      {/* Create Simulation */}
      {!activeSimulationId && Object.keys(simulations).length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Créer une nouvelle simulation</CardTitle>
            <CardDescription>
              Donnez un nom à votre simulation pour commencer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sim-name">Nom de la simulation *</Label>
                <Input
                  id="sim-name"
                  value={simulationName}
                  onChange={(e) => setSimulationName(e.target.value)}
                  placeholder="Ex: Budget 2024, Scénario optimiste..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sim-desc">Description (optionnel)</Label>
                <Input
                  id="sim-desc"
                  value={simulationDescription}
                  onChange={(e) => setSimulationDescription(e.target.value)}
                  placeholder="Description de la simulation..."
                />
              </div>
              
              <Button onClick={handleCreateSimulation} disabled={!simulationName.trim()}>
                Créer la simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Simulation List & Selector */}
      {Object.keys(simulations).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Mes Simulations</CardTitle>
                <CardDescription>Sélectionnez une simulation ou créez-en une nouvelle</CardDescription>
              </div>
              <Button
                onClick={() => {
                  const name = prompt('Nom de la nouvelle simulation:')
                  if (name) createSimulation(name, '')
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(simulations).map(([id, sim]) => (
                <div
                  key={id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    activeSimulationId === id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveSimulation(id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{sim.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Supprimer cette simulation ?')) {
                          deleteSimulation(id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  {sim.description && (
                    <p className="text-sm text-gray-500 mb-2">{sim.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="outline">{sim.movements.length} mouvements</Badge>
                    <span>{new Date(sim.updatedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Active Simulation Content */}
      {activeSimulationId && activeSimulation && (
        <>
          {/* Movements Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Mouvements de simulation</CardTitle>
                  <CardDescription>
                    Ajoutez des mouvements pour simuler leur impact
                  </CardDescription>
                </div>
                <Button onClick={() => setShowMovementDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un mouvement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {simulationMovements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun mouvement. Commencez par en ajouter un.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {simulationMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant={movement.sign === 'Entrée' ? 'default' : 'destructive'}>
                          {movement.sign}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{movement.type}</p>
                          <p className="text-sm text-gray-500">
                            {movement.category} • {movement.frequency}
                            {movement.generatedDates && ` • ${movement.generatedDates.length} dates`}
                          </p>
                        </div>
                        <p className="font-semibold">{valueFormatter(movement.amount)}</p>
                      </div>
                      
                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailMovement(movement)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMovement(movement)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Supprimer ce mouvement ?')) {
                              deleteMovement(movement.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Date Filter */}
          {simulationMovements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Filtre de période</CardTitle>
                <CardDescription>Ajustez la période d'analyse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1">
                      <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700 mb-2 block">
                        Date de début
                      </Label>
                      <input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        min={today}
                        max={dateTo}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700 mb-2 block">
                        Date de fin
                      </Label>
                      <input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        min={dateFrom}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Range Slider */}
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Sélection rapide de période
                      </Label>
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.floor((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))} jours sélectionnés
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="365"
                      value={Math.floor((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))}
                      onChange={(e) => {
                        const days = parseInt(e.target.value)
                        const newDateTo = new Date(dateFrom)
                        newDateTo.setDate(newDateTo.getDate() + days)
                        setDateTo(newDateTo.toISOString().split('T')[0])
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0 jour</span>
                      <span>1 an (365 jours)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Analytics */}
          {simulationMovements.length > 0 && filteredMetrics && (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Solde de départ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base text-gray-400 truncate">{valueFormatter(filteredMetrics.oldBalanceAtStart)}</span>
                      <span className="text-blue-500 flex-shrink-0">→</span>
                      <span className="text-lg sm:text-2xl font-bold truncate">{valueFormatter(filteredMetrics.balanceAtStart)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Solde final</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base text-gray-400 truncate">{valueFormatter(filteredMetrics.oldBalanceAtEnd)}</span>
                      <span className="text-blue-500 flex-shrink-0">→</span>
                      <span className="text-lg sm:text-2xl font-bold truncate">{valueFormatter(filteredMetrics.balanceAtEnd)}</span>
                    </div>
                    <p className={`text-xs mt-1 font-medium ${
                      filteredMetrics.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {filteredMetrics.changePercent >= 0 ? '↑' : '↓'} {valueFormatter(Math.abs(filteredMetrics.changeAmount))} ({percentageFormatter(Math.abs(filteredMetrics.changePercent))})
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total entrées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base text-gray-400 truncate">{valueFormatter(filteredMetrics.oldTotalInflow)}</span>
                      <span className="text-blue-500 flex-shrink-0">→</span>
                      <span className="text-lg sm:text-2xl font-bold truncate">{valueFormatter(filteredMetrics.totalInflow)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total sorties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base text-gray-400 truncate">{valueFormatter(filteredMetrics.oldTotalOutflow)}</span>
                      <span className="text-blue-500 flex-shrink-0">→</span>
                      <span className="text-lg sm:text-2xl font-bold truncate">{valueFormatter(filteredMetrics.totalOutflow)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts with Tabs */}
              <Tabs defaultValue="forecast" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="forecast">Prévisions</TabsTrigger>
                  <TabsTrigger value="comparison">Comparaison</TabsTrigger>
                </TabsList>

                <TabsContent value="forecast">
                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution et Prévision du Solde</CardTitle>
                      <CardDescription>Comparaison entre prévision initiale et simulation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={filteredForecastData}>
                      <defs>
                        <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => valueFormatter(value)}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="baselineBalance"
                        name="Prévision initiale"
                        stroke={COLORS.blue}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBaseline)"
                      />
                      <Area
                        type="monotone"
                        dataKey="predictedBalance"
                        name="Avec simulation"
                        stroke={COLORS.emerald}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPredicted)"
                      />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="comparison">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tableau de Comparaison</CardTitle>
                      <CardDescription>Impact détaillé de la simulation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 font-semibold text-sm border-b pb-2">
                          <div>Métrique</div>
                          <div className="text-right">Sans simulation</div>
                          <div className="text-right">Avec simulation</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>Solde de départ</div>
                          <div className="text-right text-gray-600">{valueFormatter(filteredMetrics.oldBalanceAtStart)}</div>
                          <div className="text-right font-semibold">{valueFormatter(filteredMetrics.balanceAtStart)}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>Solde final</div>
                          <div className="text-right text-gray-600">{valueFormatter(filteredMetrics.oldBalanceAtEnd)}</div>
                          <div className="text-right font-semibold">{valueFormatter(filteredMetrics.balanceAtEnd)}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>Total entrées</div>
                          <div className="text-right text-gray-600">{valueFormatter(filteredMetrics.oldTotalInflow)}</div>
                          <div className="text-right font-semibold">{valueFormatter(filteredMetrics.totalInflow)}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>Total sorties</div>
                          <div className="text-right text-gray-600">{valueFormatter(filteredMetrics.oldTotalOutflow)}</div>
                          <div className="text-right font-semibold">{valueFormatter(filteredMetrics.totalOutflow)}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm border-t pt-2 font-semibold">
                          <div>Variation nette</div>
                          <div className="text-right">{valueFormatter(filteredMetrics.oldChangeAmount)}</div>
                          <div className={`text-right ${filteredMetrics.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {valueFormatter(filteredMetrics.changeAmount)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
      
      {/* Dialogs */}
      <SimulationMovementForm
        open={showMovementDialog || !!editingMovement}
        onClose={() => {
          setShowMovementDialog(false)
          setEditingMovement(null)
        }}
        onSubmit={handleAddMovement}
        movement={editingMovement}
        onUpdate={handleUpdateMovement}
      />
      
      <SimulationMovementDetail
        open={!!detailMovement}
        onClose={() => setDetailMovement(null)}
        movement={detailMovement}
      />
    </div>
  )
}
