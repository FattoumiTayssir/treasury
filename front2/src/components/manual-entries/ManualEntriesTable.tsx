import { useState } from 'react'
import { ManualEntry } from '@/types'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Edit, Trash2 } from 'lucide-react'

interface ManualEntriesTableProps {
  entries: ManualEntry[]
  isLoading: boolean
}

export function ManualEntriesTable({ entries, isLoading }: ManualEntriesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
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
                <Checkbox />
              </th>
              <th className="p-4 text-left font-semibold">Catégorie</th>
              <th className="p-4 text-left font-semibold">Type</th>
              <th className="p-4 text-right font-semibold">Montant</th>
              <th className="p-4 text-left font-semibold">Fréquence</th>
              <th className="p-4 text-left font-semibold">Dates</th>
              <th className="p-4 text-left font-semibold">Visibilité</th>
              <th className="p-4 text-left font-semibold">Créé par</th>
              <th className="p-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  Aucune entrée manuelle trouvée
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-muted/20">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.includes(entry.id)}
                      onCheckedChange={() => toggleSelection(entry.id)}
                    />
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">{entry.category}</Badge>
                  </td>
                  <td className="p-4">{entry.type}</td>
                  <td className="p-4 text-right font-semibold">
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="p-4">
                    <Badge>{entry.frequency}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {entry.frequency === 'Une seule fois' ? (
                        <div>{formatDate(entry.start_date)}</div>
                      ) : (
                        <>
                          <div>{formatDate(entry.start_date)} → {entry.end_date ? formatDate(entry.end_date) : '-'}</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary">{entry.visibility}</Badge>
                  </td>
                  <td className="p-4 text-sm">{entry.createdBy}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
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
