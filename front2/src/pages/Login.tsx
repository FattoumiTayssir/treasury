import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { MOCK_CREDENTIALS } from '@/services/mockAuth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast({ title: 'Connexion réussie', description: 'Bienvenue sur Tabtré App' })
      navigate('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: error.message || 'Identifiants invalides',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredentials = (type: 'admin' | 'user' | 'multi') => {
    setEmail(MOCK_CREDENTIALS[type].email)
    setPassword(MOCK_CREDENTIALS[type].password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Tabtré App</CardTitle>
          <CardDescription className="text-center">
            Gestion de Trésorerie Universal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">🔐 Comptes de test disponibles :</p>
            <div className="space-y-1 text-xs text-blue-800">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="block w-full text-left hover:bg-blue-100 p-2 rounded transition-colors"
              >
                <strong>Admin:</strong> admin@universal.com / admin123
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('user')}
                className="block w-full text-left hover:bg-blue-100 p-2 rounded transition-colors"
              >
                <strong>Gestionnaire:</strong> user@universal.com / user123
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('multi')}
                className="block w-full text-left hover:bg-blue-100 p-2 rounded transition-colors"
              >
                <strong>Multi-entreprises:</strong> multi@universal.com / multi123
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@universal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
