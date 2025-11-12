import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, Info } from 'lucide-react'
import { analyticsApi, treasuryApi, movementsApi } from '@/services/api'
import { useDataStore } from '@/store/dataStore'
import {
  generateMockForecast,
  generateMockCategoryBreakdown,
  generateMockCashFlowAnalysis,
  generateMockMetrics,
} from '@/utils/mockAnalytics'
import type {
  TreasuryForecast,
  CategoryBreakdown,
  CashFlowAnalysis,
  TreasuryMetrics,
  TreasuryBalance,
  Category,
} from '@/types'

// Color palette
const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  purple: '#a855f7',
  indigo: '#6366f1',
  gray: '#6b7280',
}

const CATEGORY_COLORS = [COLORS.blue, COLORS.emerald, COLORS.amber, COLORS.rose, COLORS.purple]

const valueFormatter = (value: number) => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const percentageFormatter = (value: number) => `${value.toFixed(1)}%`

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-3">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700">
            {entry.name}: {valueFormatter(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const categories: Category[] = ['RH', 'Achat', 'Vente', 'Compta', 'Autre']

export default function AnalyticsRecharts() {
  const { selectedCompanies, companies } = useDataStore()
  const selectedCompany = selectedCompanies[0] || ''
  const [treasuryBalance, setTreasuryBalance] = useState<TreasuryBalance | null>(null)
  const [forecastData, setForecastData] = useState<TreasuryForecast[]>([])
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([])
  const [cashFlowData, setCashFlowData] = useState<CashFlowAnalysis[]>([])
  const [metrics, setMetrics] = useState<TreasuryMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Date filter state - default to today to 3 months future
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState<string>(today)
  const [dateTo, setDateTo] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 3)
    return date.toISOString().split('T')[0]
  })
  
  // Category and Type filters
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  
  // Calculated metrics from filtered data
  const [filteredMetrics, setFilteredMetrics] = useState<{
    balanceAtStart: number
    balanceAtEnd: number
    totalInflow: number
    totalOutflow: number
    changeAmount: number
    changePercent: number
  } | null>(null)

  const loadTreasuryBalance = useCallback(async () => {
    if (!selectedCompany) return

    try {
      const response = await treasuryApi.getBalance(selectedCompany)
      setTreasuryBalance(response.data)
    } catch (error) {
      console.error('Failed to load treasury balance:', error)
      setTreasuryBalance(null)
    }
  }, [selectedCompany])

  // Load available types from movements
  useEffect(() => {
    const loadTypes = async () => {
      if (!selectedCompany) return
      try {
        const response = await movementsApi.getAll()
        const types = [...new Set(response.data
          .filter(m => m.companyId === selectedCompany)
          .map(m => m.type))]
        setAvailableTypes(types.sort())
      } catch (error) {
        console.error('Failed to load types:', error)
      }
    }
    loadTypes()
  }, [selectedCompany])

  const loadAnalytics = useCallback(async () => {
    if (!selectedCompany || !treasuryBalance) return

    setLoading(true)
    try {
      const filters = {
        companyId: selectedCompany,
        forecastDays: 90,
        dateFrom: dateFrom,
        dateTo: dateTo,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        type: selectedTypes.length > 0 ? selectedTypes : undefined,
      }
      
      console.log('Loading analytics with filters:', filters)

      const [forecast, breakdown, cashFlow, metricsData] = await Promise.all([
        analyticsApi.getForecast(filters),
        analyticsApi.getCategoryBreakdown(filters),
        analyticsApi.getCashFlowAnalysis(filters),
        analyticsApi.getMetrics(selectedCompany),
      ])

      setForecastData(forecast.data)
      setCategoryData(breakdown.data)
      setCashFlowData(cashFlow.data)
      setMetrics(metricsData.data)
      
      // Calculate filtered metrics from forecast data
      if (forecast.data && forecast.data.length > 0) {
        const startData = forecast.data[0]
        const endData = forecast.data[forecast.data.length - 1]
        const totalIn = forecast.data.reduce((sum, d) => sum + (d.inflow || 0), 0)
        const totalOut = forecast.data.reduce((sum, d) => sum + (d.outflow || 0), 0)
        const startBalance = startData.predictedBalance || treasuryBalance.amount
        const endBalance = endData.predictedBalance || startBalance
        const change = endBalance - startBalance
        
        setFilteredMetrics({
          balanceAtStart: startBalance,
          balanceAtEnd: endBalance,
          totalInflow: totalIn,
          totalOutflow: totalOut,
          changeAmount: change,
          changePercent: startBalance !== 0 ? (change / startBalance) * 100 : 0
        })
      }
    } catch (error) {
      console.error('Failed to load analytics, using mock data:', error)
      const baselineBalance = treasuryBalance.amount
      const baselineDate = new Date(treasuryBalance.referenceDate)

      const mockForecast = generateMockForecast(baselineBalance, baselineDate)
      setForecastData(mockForecast)
      setCategoryData(generateMockCategoryBreakdown())
      setCashFlowData(generateMockCashFlowAnalysis())
      setMetrics(generateMockMetrics(baselineBalance))
      
      // Calculate mock filtered metrics
      if (mockForecast.length > 0) {
        const startData = mockForecast[0]
        const endData = mockForecast[mockForecast.length - 1]
        const totalIn = mockForecast.reduce((sum, d) => sum + (d.inflow || 0), 0)
        const totalOut = mockForecast.reduce((sum, d) => sum + (d.outflow || 0), 0)
        const startBalance = startData.predictedBalance || baselineBalance
        const endBalance = endData.predictedBalance || startBalance
        const change = endBalance - startBalance
        
        setFilteredMetrics({
          balanceAtStart: startBalance,
          balanceAtEnd: endBalance,
          totalInflow: totalIn,
          totalOutflow: totalOut,
          changeAmount: change,
          changePercent: startBalance !== 0 ? (change / startBalance) * 100 : 0
        })
      }
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, treasuryBalance, dateFrom, dateTo, selectedCategories, selectedTypes])

  useEffect(() => {
    if (selectedCompany) {
      loadTreasuryBalance()
    }
  }, [selectedCompany, loadTreasuryBalance])

  useEffect(() => {
    if (selectedCompany && treasuryBalance) {
      loadAnalytics()
    }
  }, [selectedCompany, treasuryBalance, loadAnalytics])

  const getDeltaType = (value: number): 'increase' | 'decrease' => {
    return value >= 0 ? 'increase' : 'decrease'
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des analyses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analyse de Trésorerie</h1>
        <p className="mt-2 text-gray-600">
          Prévisions, tendances et analyses approfondies de votre trésorerie
        </p>
      </div>

      {/* Treasury Baseline Info */}
      {selectedCompany && companies.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Entreprise sélectionnée: {companies.find((c) => c.id === selectedCompany)?.name}
                </Label>
              </div>

              {treasuryBalance && treasuryBalance.amount > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-900">Solde de référence</span>
                  </div>
                  <div className="ml-7 space-y-1">
                    <p className="text-2xl font-bold text-indigo-900">
                      {valueFormatter(treasuryBalance.amount)}
                    </p>
                    <p className="text-sm text-indigo-700">
                      Date de référence:{' '}
                      {new Date(treasuryBalance.referenceDate).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-indigo-600">
                      Ce montant est la base de tous les calculs et prévisions de trésorerie
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Filter - Above Cards */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtre de période</CardTitle>
            <CardDescription>Sélectionnez la période pour les analyses ci-dessous</CardDescription>
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

      {/* Key Metrics */}
      {filteredMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Solde de départ</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{valueFormatter(filteredMetrics.balanceAtStart)}</div>
              <p className={`text-xs mt-1 font-medium ${
                getDeltaType(filteredMetrics.changePercent) === 'increase' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {getDeltaType(filteredMetrics.changePercent) === 'increase' ? '↑' : '↓'}{' '}
                {valueFormatter(Math.abs(filteredMetrics.changeAmount))} ({percentageFormatter(Math.abs(filteredMetrics.changePercent))})
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Prévision fin période</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{valueFormatter(filteredMetrics.balanceAtEnd)}</div>
              <p className={`text-xs mt-1 font-medium ${
                getDeltaType(filteredMetrics.changePercent) === 'increase' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {getDeltaType(filteredMetrics.changePercent) === 'increase' ? '↑' : '↓'}{' '}
                {valueFormatter(Math.abs(filteredMetrics.changeAmount))} ({percentageFormatter(Math.abs(filteredMetrics.changePercent))})
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Entrées période</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{valueFormatter(filteredMetrics.totalInflow)}</div>
              <p className="text-xs text-gray-500 mt-1">
                {valueFormatter(filteredMetrics.totalInflow / Math.max(1, Math.floor((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))))}/jour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sorties période</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{valueFormatter(filteredMetrics.totalOutflow)}</div>
              <p className="text-xs text-gray-500 mt-1">
                {valueFormatter(filteredMetrics.totalOutflow / Math.max(1, Math.floor((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))))}/jour
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Tabs */}
      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">Prévisions</TabsTrigger>
          <TabsTrigger value="cashflow">Flux de Trésorerie</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        {/* Balance Forecast */}
        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>Évolution et Prévision du Solde</CardTitle>
              <CardDescription>Comparaison entre le solde réel et les prévisions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => valueFormatter(value)}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="baselineBalance"
                    name="Trésorerie de base"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="predictedBalance"
                    name="Trésorerie prévue"
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

        {/* Cash Flow */}
        <TabsContent value="cashflow">
          <div className="space-y-4">
            {/* Filters for Cash Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtres</CardTitle>
                <CardDescription>Filtrer les flux de trésorerie par catégorie et type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Category Filter */}
                  <div className="flex-1">
                    <Label htmlFor="cashflow-categories" className="text-sm font-medium text-gray-700 mb-2 block">
                      Catégories
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategories(prev =>
                              prev.includes(cat)
                                ? prev.filter(c => c !== cat)
                                : [...prev, cat]
                            )
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            selectedCategories.includes(cat)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      {selectedCategories.length > 0 && (
                        <button
                          onClick={() => setSelectedCategories([])}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Type Filter */}
                  <div className="flex-1">
                    <Label htmlFor="cashflow-types" className="text-sm font-medium text-gray-700 mb-2 block">
                      Types
                    </Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {availableTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedTypes(prev =>
                              prev.includes(type)
                                ? prev.filter(t => t !== type)
                                : [...prev, type]
                            )
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            selectedTypes.includes(type)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                      {selectedTypes.length > 0 && (
                        <button
                          onClick={() => setSelectedTypes([])}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Flux de Trésorerie Mensuels</CardTitle>
                <CardDescription>Entrées vs Sorties par période</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => valueFormatter(value)}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="inflow" name="Entrées" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outflow" name="Sorties" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flux Net de Trésorerie</CardTitle>
                <CardDescription>Différence entre entrées et sorties</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => valueFormatter(value)}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="netFlow"
                      name="Flux net"
                      stroke={COLORS.indigo}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorNet)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Catégorie</CardTitle>
                <CardDescription>Distribution des montants</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.category}: ${percentageFormatter(entry.percentage)}`}
                      labelLine={true}
                    >
                      {categoryData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails par Catégorie</CardTitle>
                <CardDescription>Montants et pourcentages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((item, index) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                          />
                          <span className="font-semibold text-gray-900">{item.category}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{valueFormatter(item.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.count} mouvements</span>
                        <span className="font-medium text-gray-700">{percentageFormatter(item.percentage)}</span>
                      </div>
                      {index < categoryData.length - 1 && <div className="border-b border-gray-200" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends">
          <div className="space-y-4">
            {/* Filters for Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtres</CardTitle>
                <CardDescription>Filtrer les tendances par catégorie et type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Category Filter */}
                  <div className="flex-1">
                    <Label htmlFor="trends-categories" className="text-sm font-medium text-gray-700 mb-2 block">
                      Catégories
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategories(prev =>
                              prev.includes(cat)
                                ? prev.filter(c => c !== cat)
                                : [...prev, cat]
                            )
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            selectedCategories.includes(cat)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      {selectedCategories.length > 0 && (
                        <button
                          onClick={() => setSelectedCategories([])}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Type Filter */}
                  <div className="flex-1">
                    <Label htmlFor="trends-types" className="text-sm font-medium text-gray-700 mb-2 block">
                      Types
                    </Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {availableTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedTypes(prev =>
                              prev.includes(type)
                                ? prev.filter(t => t !== type)
                                : [...prev, type]
                            )
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            selectedTypes.includes(type)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                      {selectedTypes.length > 0 && (
                        <button
                          onClick={() => setSelectedTypes([])}
                          className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tendances de Trésorerie</CardTitle>
              <CardDescription>Vue d'ensemble des variations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => valueFormatter(value)}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    name="Entrées"
                    stroke={COLORS.emerald}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInflow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    name="Sorties"
                    stroke={COLORS.rose}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOutflow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
