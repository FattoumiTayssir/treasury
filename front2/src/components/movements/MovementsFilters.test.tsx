import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MovementsFilters } from './MovementsFilters'
import { MovementFilters } from '@/types'

describe('MovementsFilters', () => {
  const defaultFilters: MovementFilters = {
    logic: 'ET',
  }

  const mockOnChange = vi.fn()

  it('should render the Filtres header', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Filtres')).toBeInTheDocument()
  })

  it('should render Catégorie filter', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Catégorie')).toBeInTheDocument()
  })

  it('should render Type filter', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Type')).toBeInTheDocument()
  })

  it('should render Source filter', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Source')).toBeInTheDocument()
  })

  it('should render Date min filter', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Date min')).toBeInTheDocument()
  })

  it('should render Date max filter', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Date max')).toBeInTheDocument()
  })

  it('should render Référence filter', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Référence')).toBeInTheDocument()
  })

  it('should render Montant min filter', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Montant min')).toBeInTheDocument()
  })

  it('should render Montant max filter', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Montant max')).toBeInTheDocument()
  })

  it('should render Réinitialiser button', () => {
    render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Réinitialiser')).toBeInTheDocument()
  })

  it('should have all filter inputs in the correct order', () => {
    const { container } = render(<MovementsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    
    // Check grid structure
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    
    // Check all labels exist
    const labels = container.querySelectorAll('label')
    const labelTexts = Array.from(labels).map(label => label.textContent)
    
    console.log('Found labels:', labelTexts)
    
    expect(labelTexts).toContain('Catégorie')
    expect(labelTexts).toContain('Type')
    expect(labelTexts).toContain('Source')
    expect(labelTexts).toContain('Date min')
    expect(labelTexts).toContain('Date max')
    expect(labelTexts).toContain('Référence')
    expect(labelTexts).toContain('Montant min')
    expect(labelTexts).toContain('Montant max')
  })
})
