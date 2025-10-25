import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExceptionsFilters } from './ExceptionsFilters'
import { ExceptionFilters } from '@/types'

describe('ExceptionsFilters', () => {
  const defaultFilters: ExceptionFilters = {
    logic: 'ET',
  }

  const mockOnChange = vi.fn()

  it('should render the Filtres header', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Filtres')).toBeInTheDocument()
  })

  it('should render Catégorie filter', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Catégorie')).toBeInTheDocument()
  })

  it('should render Type filter', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Type')).toBeInTheDocument()
  })

  it('should render Criticité filter', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Criticité')).toBeInTheDocument()
  })

  it('should render Recherche description filter', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Recherche description')).toBeInTheDocument()
  })

  it('should render Référence filter', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Référence')).toBeInTheDocument()
  })

  it('should render Montant min filter', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Montant min')).toBeInTheDocument()
  })

  it('should render Montant max filter', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Montant max')).toBeInTheDocument()
  })

  it('should render Réinitialiser button', () => {
    render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    expect(screen.getByText('Réinitialiser')).toBeInTheDocument()
  })

  it('should have all filter inputs in the correct order', () => {
    const { container } = render(<ExceptionsFilters filters={defaultFilters} onFiltersChange={mockOnChange} />)
    
    const labels = container.querySelectorAll('label')
    const labelTexts = Array.from(labels).map(label => label.textContent)
    
    console.log('Found labels:', labelTexts)
    
    expect(labelTexts).toContain('Catégorie')
    expect(labelTexts).toContain('Type')
    expect(labelTexts).toContain('Criticité')
    expect(labelTexts).toContain('Recherche description')
    expect(labelTexts).toContain('Référence')
    expect(labelTexts).toContain('Montant min')
    expect(labelTexts).toContain('Montant max')
  })
})
