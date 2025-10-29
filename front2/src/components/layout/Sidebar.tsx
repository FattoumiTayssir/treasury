import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Edit3,
  AlertTriangle,
  Settings,
  Users,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'

const navigation = [
  { name: 'Analyse', href: '/analytics', icon: BarChart3, tabName: 'analytics' },
  { name: 'Mouvements', href: '/movements', icon: TrendingUp, tabName: 'movements' },
  { name: 'Entrées manuelles', href: '/manual-entries', icon: Edit3, tabName: 'manual-entries' },
  { name: 'Exceptions', href: '/exceptions', icon: AlertTriangle, tabName: 'exceptions' },
  { name: 'Paramètres', href: '/settings', icon: Settings, tabName: 'settings' },
]

const adminNavigation = [
  { name: 'Gestion des utilisateurs', href: '/users', icon: Users, adminOnly: true },
  { name: 'Actualiser les données', href: '/data-refresh', icon: RefreshCw, adminOnly: true },
]

export function Sidebar() {
  const location = useLocation()
  const { hasPermission, isAdmin } = useAuthStore()

  // Filter navigation items based on permissions
  const visibleNavigation = navigation.filter(item => 
    isAdmin() || hasPermission(item.tabName)
  )

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary">Tabtré App</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion de Trésorerie</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {visibleNavigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}

        {/* Admin-only navigation */}
        {isAdmin() && (
          <>
            <div className="my-2 border-t border-gray-200" />
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </div>
  )
}
