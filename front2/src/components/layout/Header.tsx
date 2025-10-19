import { LogOut, User, Building2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NotificationDropdown } from './NotificationDropdown'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export function Header() {
  const { user, logout } = useAuthStore()
  const { companies, selectedCompanies, fetchCompanies, setSelectedCompanies } = useDataStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCompanyChange = (companyId: string) => {
    // Only one company can be selected at a time
    setSelectedCompanies([companyId])
  }

  const selectedCompanyId = selectedCompanies[0] || ''

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Bienvenue, {user?.name || 'Utilisateur'}
          </h2>
          
          <div className="flex items-center gap-2 border-l border-gray-200 pl-6">
            <Building2 className="w-5 h-5 text-gray-500" />
            <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Sélectionner une compagnie" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationDropdown />
          
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
