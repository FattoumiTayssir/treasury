import { LogOut, User, Building2, Settings } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

  // Filter companies based on user's allowed companies
  // Admin users can see all companies
  const allowedCompanies = user 
    ? (user.role === 'Admin' ? companies : companies.filter(c => user.companies.includes(c.id)))
    : companies

  // Auto-select first company on login
  useEffect(() => {
    if (user && companies.length > 0 && selectedCompanies.length === 0 && allowedCompanies.length > 0) {
      setSelectedCompanies([allowedCompanies[0].id])
    }
  }, [user, companies, selectedCompanies.length, allowedCompanies, setSelectedCompanies])

  const handleLogout = () => {
    // Clear selected companies on logout
    setSelectedCompanies([])
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
                {allowedCompanies.map((company) => (
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
          
          <div className="pl-3 border-l border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:bg-gray-100">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings/password')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
