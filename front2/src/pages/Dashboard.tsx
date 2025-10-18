import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { dashboardApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

export function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await dashboardApi.refresh()
      toast({
        title: 'Dashboard mis à jour',
        description: 'Les données ont été rafraîchies avec succès',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de mettre à jour le dashboard',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Prévision de trésorerie sur 6 mois
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Mettre à jour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de Bord BI</CardTitle>
          <CardDescription>
            Visualisation de la trésorerie prévisionnelle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <p className="text-muted-foreground">
              Le dashboard BI sera intégré ici (développé séparément)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
