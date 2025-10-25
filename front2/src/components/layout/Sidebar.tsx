import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Edit3,
  AlertTriangle,
  Settings,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analyse', href: '/analytics', icon: BarChart3 },
  { name: 'Mouvements', href: '/movements', icon: TrendingUp },
  { name: 'Entrées manuelles', href: '/manual-entries', icon: Edit3 },
  { name: 'Exceptions', href: '/exceptions', icon: AlertTriangle },
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-primary">Tabtré App</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion de Trésorerie</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
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
      </nav>
    </div>
  )
}
