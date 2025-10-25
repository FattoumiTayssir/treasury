import { describe, it, expect } from 'vitest'
import {
  generateMockForecast,
  generateMockCategoryBreakdown,
  generateMockCashFlowAnalysis,
  generateMockMetrics,
} from './mockAnalytics'

describe('generateMockForecast', () => {
  it('should generate correct number of data points (121 days: -30 to +90)', () => {
    const forecast = generateMockForecast(1000000)
    expect(forecast).toHaveLength(121)
  })

  it('should start with baseline balance', () => {
    const baselineBalance = 1500000
    const forecast = generateMockForecast(baselineBalance)
    
    // First entry should be close to baseline (within inflow/outflow range)
    const firstEntry = forecast[0]
    expect(firstEntry.actualBalance).toBeDefined()
    expect(firstEntry.actualBalance).toBeCloseTo(baselineBalance, -4) // within 10k
  })

  it('should have actualBalance only for past dates (i <= 0)', () => {
    const forecast = generateMockForecast(1000000)
    
    // First 31 entries are past (i = -30 to 0)
    for (let i = 0; i <= 30; i++) {
      expect(forecast[i].actualBalance).not.toBeNull()
    }
    
    // Remaining entries are future (i = 1 to 90)
    for (let i = 31; i < forecast.length; i++) {
      expect(forecast[i].actualBalance).toBeNull()
    }
  })

  it('should always have predictedBalance', () => {
    const forecast = generateMockForecast(1000000)
    
    forecast.forEach(entry => {
      expect(entry.predictedBalance).toBeDefined()
      expect(typeof entry.predictedBalance).toBe('number')
    })
  })

  it('should calculate netChange as inflow - outflow', () => {
    const forecast = generateMockForecast(1000000)
    
    forecast.forEach(entry => {
      expect(entry.netChange).toBe(entry.inflow - entry.outflow)
    })
  })

  it('should accumulate balance correctly', () => {
    const baselineBalance = 1000000
    const forecast = generateMockForecast(baselineBalance)
    
    // Check that actualBalance accumulates correctly for past dates
    // actualBalance represents the balance at the START of the period
    let expectedBalance = baselineBalance
    for (let i = 0; i <= 30; i++) {
      const entry = forecast[i]
      expect(entry.actualBalance).toBe(expectedBalance)
      // Update expected balance for next iteration (balance after this day's transactions)
      expectedBalance += entry.netChange
    }
  })

  it('should have dates in correct format (YYYY-MM-DD)', () => {
    const forecast = generateMockForecast(1000000)
    
    forecast.forEach(entry => {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('should have sequential dates', () => {
    const forecast = generateMockForecast(1000000)
    
    for (let i = 1; i < forecast.length; i++) {
      const prevDate = new Date(forecast[i - 1].date)
      const currDate = new Date(forecast[i].date)
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBe(1)
    }
  })
})

describe('generateMockCategoryBreakdown', () => {
  it('should generate 5 categories', () => {
    const breakdown = generateMockCategoryBreakdown()
    expect(breakdown).toHaveLength(5)
  })

  it('should have all required categories', () => {
    const breakdown = generateMockCategoryBreakdown()
    const categories = breakdown.map(b => b.category)
    
    expect(categories).toContain('Vente')
    expect(categories).toContain('Achat')
    expect(categories).toContain('RH')
    expect(categories).toContain('Compta')
    expect(categories).toContain('Autre')
  })

  it('should have percentages that sum to 100', () => {
    const breakdown = generateMockCategoryBreakdown()
    const totalPercentage = breakdown.reduce((sum, b) => sum + b.percentage, 0)
    
    expect(totalPercentage).toBe(100)
  })

  it('should have amounts that match percentages', () => {
    const breakdown = generateMockCategoryBreakdown()
    const totalAmount = breakdown.reduce((sum, b) => sum + b.amount, 0)
    
    breakdown.forEach(item => {
      const expectedAmount = Math.round((totalAmount * item.percentage) / 100)
      // Allow small rounding differences
      expect(Math.abs(item.amount - expectedAmount)).toBeLessThan(totalAmount * 0.01)
    })
  })

  it('should have positive counts', () => {
    const breakdown = generateMockCategoryBreakdown()
    
    breakdown.forEach(item => {
      expect(item.count).toBeGreaterThan(0)
    })
  })

  it('should have correct percentages for each category', () => {
    const breakdown = generateMockCategoryBreakdown()
    const categoryMap = Object.fromEntries(breakdown.map(b => [b.category, b.percentage]))
    
    expect(categoryMap['Vente']).toBe(45)
    expect(categoryMap['Achat']).toBe(30)
    expect(categoryMap['RH']).toBe(15)
    expect(categoryMap['Compta']).toBe(7)
    expect(categoryMap['Autre']).toBe(3)
  })
})

describe('generateMockCashFlowAnalysis', () => {
  it('should generate 6 months of data', () => {
    const cashFlow = generateMockCashFlowAnalysis()
    expect(cashFlow).toHaveLength(6)
  })

  it('should calculate netFlow as inflow - outflow', () => {
    const cashFlow = generateMockCashFlowAnalysis()
    
    cashFlow.forEach(entry => {
      expect(entry.netFlow).toBe(entry.inflow - entry.outflow)
    })
  })

  it('should have valid period labels', () => {
    const cashFlow = generateMockCashFlowAnalysis()
    
    cashFlow.forEach(entry => {
      // Should match format "Mon YYYY" (e.g., "Jan 2024", "Août 2025")
      // Using \p{L} to match any Unicode letter including accented characters
      expect(entry.period).toMatch(/^[\p{L}]+ \d{4}$/u)
    })
  })

  it('should have positive values for amounts', () => {
    const cashFlow = generateMockCashFlowAnalysis()
    
    cashFlow.forEach(entry => {
      expect(entry.inflow).toBeGreaterThan(0)
      expect(entry.outflow).toBeGreaterThan(0)
      expect(entry.avgDailyBalance).toBeGreaterThan(0)
    })
  })

  it('should have sequential months', () => {
    const cashFlow = generateMockCashFlowAnalysis()
    
    // Extract years and month names to verify they're sequential
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    
    for (let i = 1; i < cashFlow.length; i++) {
      const prevParts = cashFlow[i - 1].period.split(' ')
      const currParts = cashFlow[i].period.split(' ')
      
      const prevMonth = months.indexOf(prevParts[0])
      const currMonth = months.indexOf(currParts[0])
      const prevYear = parseInt(prevParts[1])
      const currYear = parseInt(currParts[1])
      
      // Check if next month or next year
      const isNextMonth = (currMonth === prevMonth + 1 && currYear === prevYear) ||
                          (currMonth === 0 && prevMonth === 11 && currYear === prevYear + 1)
      
      expect(isNextMonth).toBe(true)
    }
  })
})

describe('generateMockMetrics', () => {
  it('should use provided baseline balance as currentBalance', () => {
    const baselineBalance = 1234567
    const metrics = generateMockMetrics(baselineBalance)
    
    expect(metrics.currentBalance).toBe(baselineBalance)
  })

  it('should calculate netCashFlow30d correctly', () => {
    const metrics = generateMockMetrics(1000000)
    const expectedNetCashFlow = metrics.totalInflow30d - metrics.totalOutflow30d
    
    expect(metrics.netCashFlow30d).toBe(expectedNetCashFlow)
  })

  it('should calculate avgDailyInflow correctly', () => {
    const metrics = generateMockMetrics(1000000)
    const expectedAvgDailyInflow = Math.round(metrics.totalInflow30d / 30)
    
    expect(metrics.avgDailyInflow).toBe(expectedAvgDailyInflow)
  })

  it('should calculate avgDailyOutflow correctly', () => {
    const metrics = generateMockMetrics(1000000)
    const expectedAvgDailyOutflow = Math.round(metrics.totalOutflow30d / 30)
    
    expect(metrics.avgDailyOutflow).toBe(expectedAvgDailyOutflow)
  })

  it('should calculate balanceChange30d correctly', () => {
    const metrics = generateMockMetrics(1000000)
    const expectedChange = metrics.projectedBalance30d - metrics.currentBalance
    
    expect(metrics.balanceChange30d).toBe(expectedChange)
  })

  it('should calculate balanceChangePercent30d correctly', () => {
    const baselineBalance = 1250000
    const metrics = generateMockMetrics(baselineBalance)
    
    const expectedPercent = ((metrics.projectedBalance30d - metrics.currentBalance) / metrics.currentBalance) * 100
    
    expect(metrics.balanceChangePercent30d).toBeCloseTo(expectedPercent, 2)
  })

  it('should have projectedBalance30d greater than currentBalance (since mock has positive net flow)', () => {
    const metrics = generateMockMetrics(1000000)
    
    // The mock data should show growth (~5.6%)
    expect(metrics.projectedBalance30d).toBeGreaterThan(metrics.currentBalance)
    expect(metrics.projectedBalance30d).toBeCloseTo(metrics.currentBalance * 1.056, -2)
  })

  it('should have totalInflow30d greater than totalOutflow30d', () => {
    const metrics = generateMockMetrics(1000000)
    
    // The mock data should have positive net cash flow
    expect(metrics.totalInflow30d).toBeGreaterThan(metrics.totalOutflow30d)
  })

  it('should scale proportionally with baseline balance', () => {
    const smallBalance = 1000
    const largeBalance = 1000000
    
    const smallMetrics = generateMockMetrics(smallBalance)
    const largeMetrics = generateMockMetrics(largeBalance)
    
    // Check that percentages are the same regardless of scale
    const smallGrowthPercent = ((smallMetrics.projectedBalance30d - smallMetrics.currentBalance) / smallMetrics.currentBalance) * 100
    const largeGrowthPercent = ((largeMetrics.projectedBalance30d - largeMetrics.currentBalance) / largeMetrics.currentBalance) * 100
    
    expect(smallGrowthPercent).toBeCloseTo(largeGrowthPercent, 1)
    expect(smallGrowthPercent).toBeCloseTo(5.6, 1)
  })

  it('should have all numeric values', () => {
    const metrics = generateMockMetrics(1000000)
    
    Object.values(metrics).forEach(value => {
      expect(typeof value).toBe('number')
      expect(isNaN(value)).toBe(false)
    })
  })
})
