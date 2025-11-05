import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isWindowsLoading, setIsWindowsLoading] = useState(false)
  const { login, windowsLogin } = useAuthStore()
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

  const handleWindowsLogin = async () => {
    setIsWindowsLoading(true)

    try {
      await windowsLogin()
      toast({ 
        title: 'Connexion réussie', 
        description: 'Connexion automatique Windows réussie' 
      })
      navigate('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion Windows',
        description: error.response?.data?.detail || 'Impossible de se connecter avec Windows',
      })
    } finally {
      setIsWindowsLoading(false)
    }
  }

  const fillCredentials = (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Tabtré App</CardTitle>
          <CardDescription className="text-center">
            Gestion de Trésorerie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">🔐 Compte administrateur :</p>
            <div className="space-y-1 text-xs text-blue-800">
              <button
                type="button"
                onClick={() => fillCredentials('admin@treasury.local', 'admin123')}
                className="block w-full text-left hover:bg-blue-100 p-2 rounded transition-colors"
              >
                <strong>Admin:</strong> admin@treasury.local / admin123
              </button>
              <p className="text-xs text-blue-600 italic mt-2 px-2">
                ⚠️ Changez ce mot de passe après la première connexion
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="admin@treasury.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
            <Button type="submit" className="w-full" disabled={isLoading || isWindowsLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleWindowsLogin}
            disabled={isLoading || isWindowsLoading}
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 88 88"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349l-.011 41.34-47.318-6.678-.066-34.739z"
                fill="currentColor"
              />
            </svg>
            {isWindowsLoading ? 'Connexion Windows...' : 'Connexion automatique Windows'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
