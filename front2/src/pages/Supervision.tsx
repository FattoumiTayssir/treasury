import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { supervisionApi } from '@/services/api'
import type { SupervisionLog, SupervisionStats } from '@/types'
import { Activity, Filter, TrendingUp } from 'lucide-react'

export function Supervision() {
  const [logs, setLogs] = useState<SupervisionLog[]>([])
  const [stats, setStats] = useState<SupervisionStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [entityType, setEntityType] = useState<string>('')
  const [action, setAction] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [entityType, action, dateFrom, dateTo])

  const loadData = async () => {
    try {
      setLoading(true)
      const filters: any = {
        limit: 100,
      }
      
      // Only add filters if they have values
      if (entityType) filters.entity_type = entityType
      if (action) filters.action = action
      if (dateFrom) filters.date_from = dateFrom
      if (dateTo) filters.date_to = dateTo
      
      const [logsRes, statsRes] = await Promise.all([
        supervisionApi.getLogs(filters),
        supervisionApi.getStats(),
      ])
      
      setLogs(logsRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error loading supervision data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateFromChange = (value: string) => {
    setDateFrom(value)
    // If dateTo is set and is before the new dateFrom, clear it
    if (dateTo && value && value > dateTo) {
      setDateTo('')
    }
  }

  const handleDateToChange = (value: string) => {
    setDateTo(value)
    // If dateFrom is set and is after the new dateTo, clear it
    if (dateFrom && value && value < dateFrom) {
      setDateFrom('')
    }
  }

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'movement':
        return 'Mouvement'
      case 'manual_entry':
        return 'Entrée manuelle'
      case 'data_refresh':
        return 'Actualisation données'
      default:
        return type
    }
  }

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'include':
        return 'Inclusion'
      case 'exclude':
        return 'Exclusion'
      case 'insert':
      case 'create':
        return 'Création'
      case 'update':
      case 'modify':
        return 'Modification'
      case 'delete':
        return 'Suppression'
      case 'refresh':
        return 'Actualisation'
      default:
        return actionType
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'include':
      case 'insert':
      case 'refresh':
        return 'bg-green-100 text-green-800'
      case 'exclude':
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="w-8 h-8" />
          Supervision
        </h1>
        <p className="text-muted-foreground mt-1">
          Journal d'audit des modifications (Admin uniquement)
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total des logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {stats.logsByEntity.slice(0, 3).map((item) => (
                  <div key={item.entityType} className="flex justify-between">
                    <span className="text-muted-foreground">{getEntityTypeLabel(item.entityType)}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Par action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {stats.logsByAction.slice(0, 3).map((item) => (
                  <div key={item.action} className="flex justify-between">
                    <span className="text-muted-foreground">{getActionLabel(item.action)}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Utilisateurs actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {stats.topUsers.slice(0, 3).map((item) => (
                  <div key={item.userName} className="flex justify-between">
                    <span className="text-muted-foreground truncate">{item.userName}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
          <CardDescription>Filtrer les logs par type, action et période</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="entityType">Type d'entité</Label>
              <Select value={entityType || undefined} onValueChange={(value) => setEntityType(value === 'all' ? '' : value)}>
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="movement">Mouvement</SelectItem>
                  <SelectItem value="manual_entry">Entrée manuelle</SelectItem>
                  <SelectItem value="data_refresh">Actualisation données</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={action || undefined} onValueChange={(value) => setAction(value === 'all' ? '' : value)}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="include">Inclusion</SelectItem>
                  <SelectItem value="exclude">Exclusion</SelectItem>
                  <SelectItem value="insert">Création</SelectItem>
                  <SelectItem value="update">Modification</SelectItem>
                  <SelectItem value="delete">Suppression</SelectItem>
                  <SelectItem value="refresh">Actualisation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Date de début</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Date de fin</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Journal d'audit</CardTitle>
          <CardDescription>
            {logs.length} log{logs.length !== 1 ? 's' : ''} trouvé{logs.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucun log trouvé
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.logId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium">{log.userName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {getEntityTypeLabel(log.entityType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.details?.reference ? (
                          <span className="font-medium text-blue-600">
                            {log.details.reference}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.description || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
