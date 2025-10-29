import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Title,
  Text,
  Metric,
  AreaChart,
  BarChart,
  DonutChart,
  Grid,
  Flex,
  BadgeDelta,
  DateRangePicker,
  DateRangePickerValue,
  MultiSelect,
  MultiSelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@tremor/react'
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, Info } from 'lucide-react'
import { analyticsApi, treasuryApi } from '@/services/api'
import { useDataStore } from '@/store/dataStore'
import { Label } from '@/components/ui/label'
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
  Category,
  TreasuryBalance,
} from '@/types'

const categories: Category[] = ['RH', 'Achat', 'Vente', 'Compta', 'Autre']

const valueFormatter = (value: number) => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const percentageFormatter = (value: number) => `${value.toFixed(1)}%`

export default function Analytics() {
  const { selectedCompanies, companies } = useDataStore()
  const selectedCompany = selectedCompanies[0] || ''
  const [treasuryBalance, setTreasuryBalance] = useState<TreasuryBalance | null>(null)
  const [dateRange, setDateRange] = useState<DateRangePickerValue>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date(new Date().setMonth(new Date().getMonth() + 3)),
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [forecastData, setForecastData] = useState<TreasuryForecast[]>([])
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([])
  const [cashFlowData, setCashFlowData] = useState<CashFlowAnalysis[]>([])
  const [metrics, setMetrics] = useState<TreasuryMetrics | null>(null)
  const [loading, setLoading] = useState(true)

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

  const loadAnalytics = useCallback(async () => {
    if (!selectedCompany || !treasuryBalance) return
    
    setLoading(true)
    try {
      const filters = {
        dateFrom: dateRange.from?.toISOString(),
        dateTo: dateRange.to?.toISOString(),
        category: selectedCategories.length > 0 ? selectedCategories as Category[] : undefined,
        companyId: selectedCompany,
        forecastDays: 90,
      }

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
    } catch (error) {
      console.error('Failed to load analytics, using mock data:', error)
      // Fallback to mock data with actual treasury balance
      const baselineBalance = treasuryBalance.amount
      const baselineDate = new Date(treasuryBalance.referenceDate)
      
      setForecastData(generateMockForecast(baselineBalance, baselineDate))
      setCategoryData(generateMockCategoryBreakdown())
      setCashFlowData(generateMockCashFlowAnalysis())
      setMetrics(generateMockMetrics(baselineBalance))
    } finally {
      setLoading(false)
    }
  }, [selectedCompany, treasuryBalance, dateRange, selectedCategories])

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

  const getDeltaType = (value: number): 'increase' | 'moderateIncrease' | 'unchanged' | 'moderateDecrease' | 'decrease' => {
    if (value > 5) return 'increase'
    if (value > 0) return 'moderateIncrease'
    if (value === 0) return 'unchanged'
    if (value > -5) return 'moderateDecrease'
    return 'decrease'
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des analyses...</p>
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
          <Flex className="gap-4" flexDirection="col" alignItems="start">
            <div className="w-full">
              <Label className="text-sm font-medium text-gray-700">
                Entreprise sélectionnée: {companies.find(c => c.id === selectedCompany)?.name}
              </Label>
            </div>

            {/* Baseline Card */}
            {treasuryBalance && treasuryBalance.amount > 0 && (
              <div className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-indigo-900">Solde de référence</span>
                </div>
                <div className="ml-7 space-y-1">
                  <p className="text-2xl font-bold text-indigo-900">
                    {valueFormatter(treasuryBalance.amount)}
                  </p>
                  <p className="text-sm text-indigo-700">
                    Date de référence: {new Date(treasuryBalance.referenceDate).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-indigo-600">
                    Ce montant est la base de tous les calculs et prévisions de trésorerie
                  </p>
                  {(() => {
                    const refDate = new Date(treasuryBalance.referenceDate)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    refDate.setHours(0, 0, 0, 0)
                    if (refDate < today) {
                      const daysDiff = Math.floor((today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <p className="text-xs text-amber-700 bg-amber-100 p-2 rounded mt-2 border border-amber-300">
                          ⚠️ <strong>Note importante:</strong> La date de référence est dans le passé (il y a {daysDiff} jour{daysDiff > 1 ? 's' : ''}). 
                          Ce solde restera constant depuis cette date jusqu'à aujourd'hui dans les analyses, car les calculs commencent toujours à partir d'aujourd'hui.
                        </p>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            )}
          </Flex>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <Flex className="gap-4" flexDirection="col" alignItems="start">
          <div className="w-full">
            <Text className="mb-2">Période d'analyse</Text>
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
              enableClear={false}
              className="max-w-md"
            />
          </div>
          <div className="w-full">
            <Text className="mb-2">Catégories</Text>
            <MultiSelect
              value={selectedCategories}
              onValueChange={setSelectedCategories}
              placeholder="Toutes les catégories"
              className="max-w-md"
            >
              {categories.map((cat) => (
                <MultiSelectItem key={cat} value={cat}>
                  {cat}
                </MultiSelectItem>
              ))}
            </MultiSelect>
          </div>
        </Flex>
      </Card>

      {/* Key Metrics */}
      {metrics && (
        <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
          <Card decoration="top" decorationColor="blue">
            <Flex alignItems="start">
              <div>
                <Text>Solde Actuel</Text>
                <Metric>{valueFormatter(metrics.currentBalance)}</Metric>
              </div>
              <DollarSign className="text-blue-600" size={24} />
            </Flex>
            <Flex className="mt-4">
              <Text>Variation 30j</Text>
              <BadgeDelta
                deltaType={getDeltaType(metrics.balanceChangePercent30d)}
                size="xs"
              >
                {percentageFormatter(Math.abs(metrics.balanceChangePercent30d))}
              </BadgeDelta>
            </Flex>
          </Card>

          <Card decoration="top" decorationColor="emerald">
            <Flex alignItems="start">
              <div>
                <Text>Prévision 30j</Text>
                <Metric>{valueFormatter(metrics.projectedBalance30d)}</Metric>
              </div>
              <ArrowUpRight className="text-emerald-600" size={24} />
            </Flex>
            <Flex className="mt-4">
              <Text>Variation estimée</Text>
              <Text className="font-semibold">
                {valueFormatter(metrics.projectedBalance30d - metrics.currentBalance)}
              </Text>
            </Flex>
          </Card>

          <Card decoration="top" decorationColor="green">
            <Flex alignItems="start">
              <div>
                <Text>Entrées 30j</Text>
                <Metric>{valueFormatter(metrics.totalInflow30d)}</Metric>
              </div>
              <TrendingUp className="text-green-600" size={24} />
            </Flex>
            <Flex className="mt-4">
              <Text>Moyenne/jour</Text>
              <Text className="font-semibold">{valueFormatter(metrics.avgDailyInflow)}</Text>
            </Flex>
          </Card>

          <Card decoration="top" decorationColor="red">
            <Flex alignItems="start">
              <div>
                <Text>Sorties 30j</Text>
                <Metric>{valueFormatter(metrics.totalOutflow30d)}</Metric>
              </div>
              <TrendingDown className="text-red-600" size={24} />
            </Flex>
            <Flex className="mt-4">
              <Text>Moyenne/jour</Text>
              <Text className="font-semibold">{valueFormatter(metrics.avgDailyOutflow)}</Text>
            </Flex>
          </Card>
        </Grid>
      )}

      {/* Tabbed Charts */}
      <TabGroup>
        <TabList>
          <Tab>Prévisions de Solde</Tab>
          <Tab>Flux de Trésorerie</Tab>
          <Tab>Analyse par Catégorie</Tab>
          <Tab>Tendances</Tab>
        </TabList>
        <TabPanels>
          {/* Balance Forecast Tab */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Évolution et Prévision du Solde</Title>
              <Text>Comparaison entre le solde réel et les prévisions</Text>
              <AreaChart
                className="mt-6 h-96"
                data={forecastData}
                index="date"
                categories={['actualBalance', 'predictedBalance']}
                colors={['blue', 'emerald']}
                valueFormatter={valueFormatter}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
                curveType="monotone"
                connectNulls={false}
                yAxisWidth={80}
                autoMinValue={true}
              />
            </Card>
          </TabPanel>

          {/* Cash Flow Tab */}
          <TabPanel>
            <Grid numItems={1} className="gap-4 mt-4">
              <Card>
                <Title>Flux de Trésorerie Mensuels</Title>
                <Text>Entrées vs Sorties par période</Text>
                <BarChart
                  className="mt-6 h-96"
                  data={cashFlowData}
                  index="period"
                  categories={['inflow', 'outflow']}
                  colors={['emerald', 'rose']}
                  valueFormatter={valueFormatter}
                  showLegend={true}
                  showGridLines={true}
                  stack={false}
                  yAxisWidth={80}
                  autoMinValue={true}
                />
              </Card>

              <Card>
                <Title>Flux Net de Trésorerie</Title>
                <Text>Différence entre entrées et sorties</Text>
                <AreaChart
                  className="mt-6 h-80"
                  data={cashFlowData}
                  index="period"
                  categories={['netFlow']}
                  colors={['indigo']}
                  valueFormatter={valueFormatter}
                  showLegend={false}
                  showGridLines={true}
                  showAnimation={true}
                  yAxisWidth={80}
                />
              </Card>
            </Grid>
          </TabPanel>

          {/* Category Analysis Tab */}
          <TabPanel>
            <Grid numItems={1} numItemsSm={2} className="gap-4 mt-4">
              <Card>
                <Title>Répartition par Catégorie</Title>
                <Text>Distribution des montants</Text>
                <DonutChart
                  className="mt-6 h-80"
                  data={categoryData}
                  category="amount"
                  index="category"
                  valueFormatter={valueFormatter}
                  colors={['blue', 'emerald', 'amber', 'rose', 'purple']}
                  showAnimation={true}
                  showLabel={true}
                  showTooltip={true}
                />
              </Card>

              <Card>
                <Title>Détails par Catégorie</Title>
                <Text>Montants et pourcentages</Text>
                <div className="mt-6 space-y-4">
                  {categoryData.map((item) => (
                    <div key={item.category}>
                      <Flex>
                        <Text className="font-semibold">{item.category}</Text>
                        <Text className="font-semibold">{valueFormatter(item.amount)}</Text>
                      </Flex>
                      <Flex className="mt-1">
                        <Text className="text-sm text-gray-600">
                          {item.count} mouvements
                        </Text>
                        <Text className="text-sm font-medium">
                          {percentageFormatter(item.percentage)}
                        </Text>
                      </Flex>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Grid>
          </TabPanel>

          {/* Trends Tab */}
          <TabPanel>
            <Grid numItems={1} className="gap-4 mt-4">
              <Card>
                <Title>Prévisions Détaillées</Title>
                <Text>Évolution quotidienne des entrées et sorties</Text>
                <AreaChart
                  className="mt-6 h-96"
                  data={forecastData}
                  index="date"
                  categories={['inflow', 'outflow', 'netChange']}
                  colors={['green', 'red', 'blue']}
                  valueFormatter={valueFormatter}
                  showLegend={true}
                  showGridLines={true}
                  stack={false}
                />
              </Card>

              <Card>
                <Title>Solde Moyen par Période</Title>
                <Text>Évolution du solde moyen journalier</Text>
                <BarChart
                  className="mt-6 h-80"
                  data={cashFlowData}
                  index="period"
                  categories={['avgDailyBalance']}
                  colors={['indigo']}
                  valueFormatter={valueFormatter}
                  showLegend={false}
                  showGridLines={true}
                />
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
