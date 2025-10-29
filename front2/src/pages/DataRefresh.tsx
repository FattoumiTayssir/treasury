import { useState, useEffect, useRef } from 'react'
import { Card, Title, Text, Button, ProgressBar, Badge, Flex, Icon } from '@tremor/react'
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Database } from 'lucide-react'
import { dataRefreshApi, type DataRefreshExecution, type DataRefreshStatus } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

export default function DataRefresh() {
  const { user } = useAuthStore()
  const [status, setStatus] = useState<DataRefreshStatus | null>(null)
  const [history, setHistory] = useState<DataRefreshExecution[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const isAdmin = user?.role === 'Admin'

  // Fetch initial status and history
  useEffect(() => {
    fetchStatus()
    fetchHistory()
  }, [])

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/data-refresh/ws'
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
    }
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      console.log('WebSocket message:', message)
      
      if (message.type === 'progress' || message.type === 'started') {
        // Update current execution status
        fetchStatus()
      } else if (message.type === 'complete' || message.type === 'error') {
        // Refresh both status and history
        fetchStatus()
        fetchHistory()
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }
    
    wsRef.current = ws
    
    // Keep connection alive with ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000) // Ping every 30 seconds
    
    return () => {
      clearInterval(pingInterval)
      ws.close()
    }
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await dataRefreshApi.getStatus()
      setStatus(response.data)
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await dataRefreshApi.getHistory(20)
      setHistory(response.data)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  const handleStartRefresh = async () => {
    setIsStarting(true)
    setError(null)
    
    try {
      await dataRefreshApi.start()
      // Status will be updated via WebSocket
      await fetchStatus()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to start data refresh'
      setError(errorMessage)
    } finally {
      setIsStarting(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge color="blue" icon={RefreshCw}>En cours</Badge>
      case 'completed':
        return <Badge color="green" icon={CheckCircle2}>Terminé</Badge>
      case 'failed':
        return <Badge color="red" icon={XCircle}>Échoué</Badge>
      case 'cancelled':
        return <Badge color="gray" icon={AlertTriangle}>Annulé</Badge>
      default:
        return <Badge color="gray">{status}</Badge>
    }
  }

  const currentExecution = status?.currentExecution

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Title>Actualisation des Données</Title>
        <Text>Actualisez les données depuis Odoo pour garder vos informations de trésorerie à jour</Text>
      </div>

      {/* Warning banner if refresh is running */}
      {status?.isRunning && (
        <Card className="bg-blue-50 border-2 border-blue-300">
          <Flex className="items-start gap-3">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
            <div>
              <Text className="font-semibold text-blue-900 text-base">Actualisation en Cours</Text>
              <Text className="text-blue-800 font-medium mt-1">
                Veuillez patienter pendant que nous récupérons les dernières données. Les informations affichées peuvent être temporairement incomplètes.
              </Text>
            </div>
          </Flex>
        </Card>
      )}

      {/* Current Status Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Title>État Actuel</Title>
              <Text>Progression en temps réel des opérations d'actualisation</Text>
            </div>
            {isAdmin && (
              <Button
                onClick={handleStartRefresh}
                disabled={isStarting || status?.isRunning}
                loading={isStarting}
                icon={RefreshCw}
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {status?.isRunning ? 'Actualisation en cours...' : 'Actualiser les Données'}
              </Button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <Flex className="items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <Text className="text-red-900 font-medium">{error}</Text>
              </Flex>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <Text className="text-gray-600">
                Seuls les administrateurs peuvent lancer une actualisation des données
              </Text>
            </div>
          )}

          {currentExecution ? (
            <div className="space-y-4">
              <Flex>
                <div>
                  {getStatusBadge(currentExecution.status)}
                </div>
                <Text className="text-gray-600">
                  Démarré par {currentExecution.startedBy} le {formatDate(currentExecution.startedAt)}
                </Text>
              </Flex>

              {currentExecution.status === 'running' && (
                <>
                  <div>
                    <Flex>
                      <Text className="font-medium">{currentExecution.currentStep || 'Traitement en cours...'}</Text>
                      <Text className="text-gray-600">{currentExecution.progressPercentage}%</Text>
                    </Flex>
                    <ProgressBar value={currentExecution.progressPercentage} color="blue" className="mt-2" />
                  </div>
                </>
              )}

              {currentExecution.status === 'completed' && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <Flex className="items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <Text className="font-semibold text-green-900 text-base">Actualisation Terminée avec Succès</Text>
                      <Text className="text-green-800 font-medium mt-1">
                        {currentExecution.totalRecordsProcessed.toLocaleString()} enregistrements traités en {formatDuration(currentExecution.durationSeconds)}
                      </Text>
                    </div>
                  </Flex>
                </div>
              )}

              {currentExecution.status === 'failed' && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <Flex className="items-start gap-3">
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <Text className="font-semibold text-red-900 text-base">Échec de l'Actualisation</Text>
                      {currentExecution.errorMessage && (
                        <Text className="text-red-800 font-medium mt-1">{currentExecution.errorMessage}</Text>
                      )}
                    </div>
                  </Flex>
                </div>
              )}

              {/* Job Details */}
              {currentExecution.details?.jobs && (
                <div className="mt-4">
                  <Text className="font-semibold mb-2">Sources de Données</Text>
                  <div className="space-y-2">
                    {currentExecution.details.jobs.map((job: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon icon={Database} size="sm" />
                          <div>
                            <Text className="font-medium">{job.name}</Text>
                            {job.success && (
                              <Text className="text-gray-600 text-sm">
                                {job.records.toLocaleString()} enregistrements • {formatDuration(Math.round(job.duration))}
                              </Text>
                            )}
                            {!job.success && job.error && (
                              <Text className="text-red-600 text-sm">{job.error.substring(0, 100)}...</Text>
                            )}
                          </div>
                        </div>
                        {job.success ? (
                          <Icon icon={CheckCircle2} color="green" />
                        ) : (
                          <Icon icon={XCircle} color="red" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon icon={Clock} size="xl" color="gray" />
              <Text className="mt-2 text-gray-600">Aucune opération d'actualisation en cours</Text>
            </div>
          )}
        </div>
      </Card>

      {/* History Card */}
      {isAdmin && history.length > 0 && (
        <Card>
          <Title>Historique des Actualisations</Title>
          <Text className="mb-4">Opérations d'actualisation récentes</Text>
          
          <div className="space-y-3">
            {history.map((execution) => (
              <div
                key={execution.executionId}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <Flex>
                  <div className="flex-1">
                    <Flex>
                      <Text className="font-medium">{formatDate(execution.startedAt)}</Text>
                      {getStatusBadge(execution.status)}
                    </Flex>
                    <Text className="text-gray-600 text-sm mt-1">
                      Démarré par {execution.startedBy}
                    </Text>
                    {execution.status === 'completed' && (
                      <Text className="text-gray-600 text-sm">
                        {execution.totalRecordsProcessed.toLocaleString()} enregistrements • {formatDuration(execution.durationSeconds)}
                      </Text>
                    )}
                    {execution.status === 'failed' && execution.errorMessage && (
                      <Text className="text-red-600 text-sm mt-1">
                        {execution.errorMessage.substring(0, 150)}
                        {execution.errorMessage.length > 150 && '...'}
                      </Text>
                    )}
                  </div>
                </Flex>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
