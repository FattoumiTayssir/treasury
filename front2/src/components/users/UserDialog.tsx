import { useState, useEffect } from 'react'
import { usersApi } from '@/services/api'
import type { User, Company, TabDefinition } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Eye, Edit } from 'lucide-react'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  companies: Company[]
  tabs: TabDefinition[]
  onSave: () => void
}

interface PermissionState {
  tabName: string
  tabLabel: string
  canView: boolean
  canModify: boolean
  ownDataOnly: boolean
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  companies,
  tabs,
  onSave,
}: UserDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'Admin' | 'Manager'>('Manager')
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [permissions, setPermissions] = useState<PermissionState[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      if (user) {
        // Edit mode
        setName(user.name)
        setEmail(user.email)
        setPassword('')
        setRole(user.role)
        setSelectedCompanies(user.companies)
        
        // Initialize permissions from user
        const userPerms = tabs.map(tab => {
          const existingPerm = user.permissions.find(p => p.tabName === tab.name)
          return {
            tabName: tab.name,
            tabLabel: tab.label,
            canView: existingPerm?.canView || false,
            canModify: existingPerm?.canModify || false,
            ownDataOnly: existingPerm?.ownDataOnly || false,
          }
        })
        setPermissions(userPerms)
      } else {
        // Create mode
        setName('')
        setEmail('')
        setPassword('')
        setRole('Manager')
        setSelectedCompanies([])
        
        // Initialize empty permissions
        setPermissions(
          tabs.map(tab => ({
            tabName: tab.name,
            tabLabel: tab.label,
            canView: false,
            canModify: false,
            ownDataOnly: false,
          }))
        )
      }
    }
  }, [open, user, tabs])

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  const handlePermissionChange = (tabName: string, field: 'canView' | 'canModify' | 'ownDataOnly', value: boolean) => {
    setPermissions(prev =>
      prev.map(p =>
        p.tabName === tabName
          ? {
              ...p,
              [field]: value,
              // If setting canModify to true, also set canView to true
              ...(field === 'canModify' && value ? { canView: true } : {}),
              // If setting canView to false, also set canModify and ownDataOnly to false
              ...(field === 'canView' && !value ? { canModify: false, ownDataOnly: false } : {}),
            }
          : p
      )
    )
  }

  const handleSubmit = async () => {
    // Validation
    if (!name || !email) {
      toast({
        title: 'Erreur',
        description: 'Nom et email sont requis',
        variant: 'destructive',
      })
      return
    }

    if (!user && !password) {
      toast({
        title: 'Erreur',
        description: 'Mot de passe requis pour un nouvel utilisateur',
        variant: 'destructive',
      })
      return
    }

    if (selectedCompanies.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Au moins une société doit être sélectionnée',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      if (user) {
        // Update existing user
        const updateData: any = {
          display_name: name,
          email,
          role,
          companies: selectedCompanies.map(id => parseInt(id)),
          permissions: permissions.map(p => ({
            tabName: p.tabName,
            canView: p.canView,
            canModify: p.canModify,
            ownDataOnly: p.ownDataOnly,
          })),
        }

        if (password) {
          updateData.password = password
        }

        await usersApi.update(user.id, updateData)
        toast({
          title: 'Succès',
          description: 'Utilisateur modifié avec succès',
        })
      } else {
        // Create new user with companies and permissions
        const createData: any = {
          display_name: name,
          email,
          role,
          password,
        }

        // First create the user
        const response = await usersApi.create(createData)
        
        // Then update with companies and permissions
        await usersApi.update(response.data.id, {
          companies: selectedCompanies.map(id => parseInt(id)),
          permissions: permissions.map(p => ({
            tabName: p.tabName,
            canView: p.canView,
            canModify: p.canModify,
            ownDataOnly: p.ownDataOnly,
          })),
        })

        toast({
          title: 'Succès',
          description: 'Utilisateur créé avec succès',
        })
      }

      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast({
        title: 'Erreur',
        description: error.response?.data?.detail || 'Erreur lors de l\'enregistrement',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </DialogTitle>
          <DialogDescription>
            {user
              ? 'Modifiez les informations, permissions et sociétés de l\'utilisateur'
              : 'Créez un nouvel utilisateur avec ses permissions et sociétés'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password">
                Mot de passe {user && '(laisser vide pour ne pas changer)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={user ? 'Nouveau mot de passe' : 'Mot de passe'}
              />
            </div>

            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={role} onValueChange={(value: 'Admin' | 'Manager') => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Companies */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Sociétés autorisées</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Sélectionnez les sociétés auxquelles l'utilisateur a accès
            </p>
            <div className="space-y-2">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${company.id}`}
                    checked={selectedCompanies.includes(company.id)}
                    onCheckedChange={() => handleCompanyToggle(company.id)}
                  />
                  <label
                    htmlFor={`company-${company.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {company.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions */}
          {role !== 'Admin' && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Permissions des onglets</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Définissez les permissions pour chaque onglet (Admin a toutes les permissions)
              </p>
              <div className="space-y-3">
                {permissions.map((perm) => (
                  <div key={perm.tabName} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{perm.tabLabel}</div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`view-${perm.tabName}`}
                            checked={perm.canView}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(perm.tabName, 'canView', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`view-${perm.tabName}`}
                            className="text-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </label>
                        </div>
                        {/* Hide Modifier checkbox for analytics tab (read-only) */}
                        {perm.tabName !== 'analytics' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`modify-${perm.tabName}`}
                              checked={perm.canModify}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(perm.tabName, 'canModify', checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`modify-${perm.tabName}`}
                              className="text-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                              Modifier
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Show "Own Data Only" option for movements and manual-entries */}
                    {(perm.tabName === 'movements' || perm.tabName === 'manual-entries') && perm.canView && (
                      <div className="ml-4 pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`own-${perm.tabName}`}
                            checked={perm.ownDataOnly}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(perm.tabName, 'ownDataOnly', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`own-${perm.tabName}`}
                            className="text-sm text-gray-600 cursor-pointer italic"
                          >
                            Uniquement ses propres données
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
