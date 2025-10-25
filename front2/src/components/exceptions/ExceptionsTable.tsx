import { useState } from 'react'
import { Exception } from '@/types'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/formatters'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'

interface ExceptionsTableProps {
  exceptions: Exception[]
  isLoading: boolean
}

export function ExceptionsTable({ exceptions, isLoading }: ExceptionsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    )
  }

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'Critique': return 'destructive'
      case 'Majeure': return 'default'
      case 'Warning': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="p-4 text-left"><Checkbox /></th>
              <th className="p-4 text-left font-semibold">Criticité</th>
              <th className="p-4 text-left font-semibold">Type</th>
              <th className="p-4 text-left font-semibold">Description</th>
              <th className="p-4 text-right font-semibold">Montant</th>
              <th className="p-4 text-left font-semibold">Référence</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Aucune exception trouvée
                </td>
              </tr>
            ) : (
              exceptions.map((exception) => (
                <tr key={exception.id} className="border-b hover:bg-muted/20">
                  <td className="p-4">
                    <Checkbox checked={selectedIds.includes(exception.id)} />
                  </td>
                  <td className="p-4">
                    <Badge variant={getCriticalityColor(exception.criticality) as any}>
                      {exception.criticality}
                    </Badge>
                  </td>
                  <td className="p-4">{exception.type}</td>
                  <td className="p-4 max-w-md">
                    <p className="text-sm truncate">{exception.description}</p>
                  </td>
                  <td className="p-4 text-right font-semibold">
                    {formatCurrency(exception.amount)}
                  </td>
                  <td className="p-4">
                    {exception.reference && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{exception.reference}</span>
                        {exception.odooLink && (
                          <a href={exception.odooLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 text-primary" />
                          </a>
                        )}
                      </div>
                    )}
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
