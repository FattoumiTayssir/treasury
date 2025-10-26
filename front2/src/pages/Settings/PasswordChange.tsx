import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Lock, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react'
import axios from 'axios'

export function PasswordChange() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setCurrentPasswordError('')
    setNewPasswordError('')
    setConfirmPasswordError('')

    // Validation
    let hasError = false

    if (!currentPassword) {
      setCurrentPasswordError('Le mot de passe actuel est requis')
      hasError = true
    }

    if (!newPassword) {
      setNewPasswordError('Le nouveau mot de passe est requis')
      hasError = true
    } else if (newPassword.length < 4) {
      setNewPasswordError('Le mot de passe doit contenir au moins 4 caractères')
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Veuillez confirmer le mot de passe')
      hasError = true
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas')
      hasError = true
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      setNewPasswordError('Le nouveau mot de passe doit être différent de l\'ancien')
      hasError = true
    }

    if (hasError) {
      return
    }

    setIsLoading(true)

    try {
      // Call new password change endpoint
      const token = localStorage.getItem('auth_token')
      await axios.post(
        'http://localhost:8000/users/change-password',
        {
          currentPassword: currentPassword,
          newPassword: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      toast({
        title: 'Succès',
        description: 'Votre mot de passe a été modifié avec succès',
      })

      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Navigate back after short delay
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error: any) {
      console.error('Password change error:', error)
      const errorMessage = error.response?.data?.detail || 'Impossible de modifier le mot de passe'
      
      // Check if it's a current password error
      if (errorMessage.includes('incorrect') || errorMessage.includes('Current password')) {
        setCurrentPasswordError('Le mot de passe actuel est incorrect')
      } else {
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>
                  Modifiez votre mot de passe pour sécuriser votre compte
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value)
                      setCurrentPasswordError('')
                    }}
                    placeholder="Entrez votre mot de passe actuel"
                    className={`pr-10 ${currentPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {currentPasswordError && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{currentPasswordError}</span>
                  </div>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setNewPasswordError('')
                    }}
                    placeholder="Entrez votre nouveau mot de passe"
                    className={`pr-10 ${newPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {newPasswordError ? (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{newPasswordError}</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Minimum 4 caractères
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setConfirmPasswordError('')
                    }}
                    placeholder="Confirmez votre nouveau mot de passe"
                    className={`pr-10 ${confirmPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {confirmPasswordError && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Conseils de sécurité
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Utilisez un mot de passe unique pour ce compte</li>
                  <li>• Évitez d'utiliser des informations personnelles</li>
                  <li>• Changez votre mot de passe régulièrement</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Modification...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
