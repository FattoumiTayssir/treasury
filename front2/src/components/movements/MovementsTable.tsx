import { useState } from 'react'
import { FinancialMovement } from '@/types'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ArrowDown, ArrowUp, ExternalLink } from 'lucide-react'

interface MovementsTableProps {
  movements: FinancialMovement[]
  isLoading: boolean
}

export function MovementsTable({ movements, isLoading }: MovementsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    setSelectedIds(prev =>
      prev.length === movements.length ? [] : movements.map(m => m.id)
    )
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="p-4 text-left">
                <Checkbox
                  checked={selectedIds.length === movements.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="p-4 text-left font-semibold">Date</th>
              <th className="p-4 text-left font-semibold">Catégorie</th>
              <th className="p-4 text-left font-semibold">Type</th>
              <th className="p-4 text-right font-semibold">Montant</th>
              <th className="p-4 text-left font-semibold">Référence</th>
              <th className="p-4 text-left font-semibold">Source</th>
              <th className="p-4 text-left font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Aucun mouvement trouvé
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id} className="border-b hover:bg-muted/20">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.includes(movement.id)}
                      onCheckedChange={() => toggleSelection(movement.id)}
                    />
                  </td>
                  <td className="p-4">{formatDate(movement.date)}</td>
                  <td className="p-4">
                    <Badge variant="outline">{movement.category}</Badge>
                  </td>
                  <td className="p-4">{movement.type}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {movement.sign === 'Entrée' ? (
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={movement.sign === 'Entrée' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {formatCurrency(Math.abs(movement.amount))}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {movement.reference ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{movement.reference}</span>
                          {movement.odooLink && (
                            <a href={movement.odooLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 text-primary" />
                            </a>
                          )}
                        </div>
                        {movement.referenceState && (
                          <div className="text-xs text-muted-foreground">
                            {movement.referenceState}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={movement.source === 'Odoo' ? 'default' : 'secondary'}>
                      {movement.source}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={movement.status === 'Actif' ? 'default' : 'outline'}>
                      {movement.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
