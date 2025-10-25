import type {
  TreasuryForecast,
  CategoryBreakdown,
  CashFlowAnalysis,
  TreasuryMetrics,
} from '@/types'

// Generate mock forecast data for the next 90 days
export function generateMockForecast(
  baselineBalance: number = 1250000,
  baselineDate: Date = new Date()
): TreasuryForecast[] {
  const data: TreasuryForecast[] = []
  const today = new Date()
  let currentBalance = baselineBalance
  
  for (let i = -30; i <= 90; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    // Generate realistic inflow/outflow patterns
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    const baseInflow = isWeekend ? 5000 : 25000 + Math.random() * 30000
    const baseOutflow = isWeekend ? 3000 : 20000 + Math.random() * 25000
    
    const inflow = Math.round(baseInflow)
    const outflow = Math.round(baseOutflow)
    const netChange = inflow - outflow
    
    // Add some volatility to predictions
    const predictedBalance = i > 0 
      ? currentBalance + netChange + (Math.random() - 0.5) * 50000
      : currentBalance + netChange
    
    data.push({
      date: date.toISOString().split('T')[0],
      actualBalance: i <= 0 ? currentBalance : null,
      predictedBalance: Math.round(predictedBalance),
      inflow,
      outflow,
      netChange,
    })
    
    // Update balance after creating the entry
    currentBalance += netChange
  }
  
  return data
}

// Generate mock category breakdown
export function generateMockCategoryBreakdown(): CategoryBreakdown[] {
  const categories = [
    { category: 'Vente' as const, percentage: 45 },
    { category: 'Achat' as const, percentage: 30 },
    { category: 'RH' as const, percentage: 15 },
    { category: 'Compta' as const, percentage: 7 },
    { category: 'Autre' as const, percentage: 3 },
  ]
  
  const totalAmount = 2500000
  
  return categories.map(cat => ({
    category: cat.category,
    amount: Math.round((totalAmount * cat.percentage) / 100),
    percentage: cat.percentage,
    count: Math.floor(Math.random() * 100) + 20,
  }))
}

// Generate mock cash flow analysis
export function generateMockCashFlowAnalysis(): CashFlowAnalysis[] {
  const data: CashFlowAnalysis[] = []
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
  ]
  
  const today = new Date()
  
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(today)
    monthDate.setMonth(today.getMonth() - 5 + i)
    
    const monthIndex = monthDate.getMonth()
    const year = monthDate.getFullYear()
    
    const inflow = 300000 + Math.random() * 200000
    const outflow = 250000 + Math.random() * 180000
    const avgDailyBalance = 1200000 + Math.random() * 300000
    
    const roundedInflow = Math.round(inflow)
    const roundedOutflow = Math.round(outflow)
    const netFlow = roundedInflow - roundedOutflow
    
    data.push({
      period: `${months[monthIndex]} ${year}`,
      inflow: roundedInflow,
      outflow: roundedOutflow,
      netFlow: netFlow,
      avgDailyBalance: Math.round(avgDailyBalance),
    })
  }
  
  return data
}

// Generate mock treasury metrics
export function generateMockMetrics(baselineBalance: number = 1250000): TreasuryMetrics {
  const currentBalance = baselineBalance
  
  // Scale projections and flows proportionally to the baseline balance
  // Using percentages based on typical treasury patterns:
  // - 30d projection: +5.6% growth
  // - 90d projection: +16% growth
  // - Monthly inflow: ~68% of balance
  // - Monthly outflow: ~62.4% of balance
  // - Net positive cash flow: ~5.6%
  
  const projectedBalance30d = Math.round(currentBalance * 1.056)
  const projectedBalance90d = Math.round(currentBalance * 1.16)
  const totalInflow30d = Math.round(currentBalance * 0.68)
  const totalOutflow30d = Math.round(currentBalance * 0.624)
  
  return {
    currentBalance,
    projectedBalance30d,
    projectedBalance90d,
    totalInflow30d,
    totalOutflow30d,
    netCashFlow30d: totalInflow30d - totalOutflow30d,
    avgDailyInflow: Math.round(totalInflow30d / 30),
    avgDailyOutflow: Math.round(totalOutflow30d / 30),
    balanceChange30d: projectedBalance30d - currentBalance,
    balanceChangePercent30d: ((projectedBalance30d - currentBalance) / currentBalance) * 100,
  }
}
