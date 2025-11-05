import {
  FinancialMovement,
  ManualEntry,
  Exception,
  MovementFilters,
  ManualEntryFilters,
  ExceptionFilters,
} from '@/types'

export const applyMovementFilters = (
  movements: FinancialMovement[],
  filters: MovementFilters
): FinancialMovement[] => {
  return movements.filter((movement) => {
    const checks: boolean[] = []

    if (filters.category && filters.category.length > 0) {
      checks.push(filters.category.includes(movement.category))
    }

    if (filters.type && filters.type.length > 0) {
      checks.push(filters.type.includes(movement.type))
    }

    if (filters.dateMin) {
      checks.push(new Date(movement.date) >= new Date(filters.dateMin))
    }

    if (filters.dateMax) {
      checks.push(new Date(movement.date) <= new Date(filters.dateMax))
    }

    if (filters.sign && filters.sign.length > 0) {
      checks.push(filters.sign.includes(movement.sign))
    }

    if (filters.amountMin !== undefined) {
      checks.push(Math.abs(movement.amount) >= filters.amountMin)
    }

    if (filters.amountMax !== undefined) {
      checks.push(Math.abs(movement.amount) <= filters.amountMax)
    }

    if (filters.source && filters.source.length > 0) {
      checks.push(filters.source.includes(movement.source))
    }

    if (filters.referenceType && filters.referenceType.length > 0) {
      checks.push(
        movement.referenceType
          ? filters.referenceType.includes(movement.referenceType)
          : false
      )
    }

    if (filters.reference) {
      checks.push(
        movement.reference
          ?.toLowerCase()
          .includes(filters.reference.toLowerCase()) || false
      )
    }

    if (filters.referenceState && filters.referenceState.length > 0) {
      checks.push(
        movement.referenceState
          ? filters.referenceState.includes(movement.referenceState)
          : false
      )
    }

    if (filters.status && filters.status.length > 0) {
      checks.push(filters.status.includes(movement.status))
    }

    if (checks.length === 0) return true

    return filters.logic === 'OU' ? checks.some((c) => c) : checks.every((c) => c)
  })
}

export const applyManualEntryFilters = (
  entries: ManualEntry[],
  filters: ManualEntryFilters
): ManualEntry[] => {
  return entries.filter((entry) => {
    const checks: boolean[] = []

    if (filters.user && filters.user.length > 0) {
      checks.push(filters.user.includes(entry.createdBy))
    }

    if (filters.updateDateMin && entry.updatedAt) {
      checks.push(new Date(entry.updatedAt) >= new Date(filters.updateDateMin))
    }

    if (filters.updateDateMax && entry.updatedAt) {
      checks.push(new Date(entry.updatedAt) <= new Date(filters.updateDateMax))
    }

    if (filters.category && filters.category.length > 0) {
      checks.push(filters.category.includes(entry.category))
    }

    if (filters.type && filters.type.length > 0) {
      checks.push(filters.type.includes(entry.type))
    }

    if (filters.sign && filters.sign.length > 0) {
      checks.push(filters.sign.includes(entry.sign))
    }

    if (filters.amountMin !== undefined) {
      checks.push(Math.abs(entry.amount) >= filters.amountMin)
    }

    if (filters.amountMax !== undefined) {
      checks.push(Math.abs(entry.amount) <= filters.amountMax)
    }

    if (filters.frequency && filters.frequency.length > 0) {
      checks.push(filters.frequency.includes(entry.frequency))
    }

    if (filters.referenceType && filters.referenceType.length > 0) {
      checks.push(
        entry.referenceType
          ? filters.referenceType.includes(entry.referenceType)
          : false
      )
    }

    if (filters.reference) {
      checks.push(
        entry.reference
          ?.toLowerCase()
          .includes(filters.reference.toLowerCase()) || false
      )
    }

    if (filters.referenceState && filters.referenceState.length > 0) {
      checks.push(
        entry.referenceState
          ? filters.referenceState.includes(entry.referenceState)
          : false
      )
    }

    if (filters.noteSearch) {
      checks.push(
        entry.note
          ?.toLowerCase()
          .includes(filters.noteSearch.toLowerCase()) || false
      )
    }

    if (checks.length === 0) return true

    return filters.logic === 'OU' ? checks.some((c) => c) : checks.every((c) => c)
  })
}

export const applyExceptionFilters = (
  exceptions: Exception[],
  filters: ExceptionFilters
): Exception[] => {
  return exceptions.filter((exception) => {
    const checks: boolean[] = []

    if (filters.category && filters.category.length > 0) {
      checks.push(filters.category.includes(exception.category))
    }

    if (filters.type && filters.type.length > 0) {
      checks.push(filters.type.includes(exception.type))
    }

    if (filters.exceptionType && filters.exceptionType.length > 0) {
      checks.push(filters.exceptionType.includes(exception.exceptionType))
    }

    if (filters.criticality && filters.criticality.length > 0) {
      checks.push(filters.criticality.includes(exception.criticality))
    }

    if (filters.referenceType && filters.referenceType.length > 0) {
      checks.push(
        exception.referenceType
          ? filters.referenceType.includes(exception.referenceType)
          : false
      )
    }

    if (filters.reference) {
      checks.push(
        exception.reference
          ?.toLowerCase()
          .includes(filters.reference.toLowerCase()) || false
      )
    }

    if (filters.referenceState && filters.referenceState.length > 0) {
      checks.push(
        exception.referenceState
          ? filters.referenceState.includes(exception.referenceState)
          : false
      )
    }

    if (filters.amountMin !== undefined) {
      checks.push(Math.abs(exception.amount) >= filters.amountMin)
    }

    if (filters.amountMax !== undefined) {
      checks.push(Math.abs(exception.amount) <= filters.amountMax)
    }

    if (filters.sign && filters.sign.length > 0) {
      checks.push(filters.sign.includes(exception.sign))
    }

    if (filters.descriptionSearch) {
      checks.push(
        exception.description
          .toLowerCase()
          .includes(filters.descriptionSearch.toLowerCase())
      )
    }

    if (filters.state && filters.state.length > 0) {
      checks.push(filters.state.includes(exception.state))
    }

    if (checks.length === 0) return true

    return filters.logic === 'OU' ? checks.some((c) => c) : checks.every((c) => c)
  })
}
