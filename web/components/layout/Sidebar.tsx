'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTenant } from '@/contexts/TenantContext'
import { hasPermission } from '@/lib/permissions'
import {
  LayoutDashboard, CheckSquare, Calendar, Users, FileText,
  DollarSign, BarChart2, MessageSquare, ClipboardList,
  UserCog, Settings, Target,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  modulo: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, modulo: 'dashboard'    },
  { href: '/checkin',       label: 'Check-in',      icon: CheckSquare,     modulo: 'checkin'      },
  { href: '/agenda',        label: 'Agenda',        icon: Calendar,        modulo: 'agenda'       },
  { href: '/pacientes',     label: 'Pacientes',     icon: Users,           modulo: 'pacientes'    },
  { href: '/prontuario',    label: 'Prontuário',    icon: ClipboardList,   modulo: 'prontuario'   },
  { href: '/financeiro',    label: 'Financeiro',    icon: DollarSign,      modulo: 'financeiro'   },
  { href: '/relatorios',    label: 'Relatórios',    icon: BarChart2,       modulo: 'relatorios'   },
  { href: '/whatsapp',      label: 'WhatsApp',      icon: MessageSquare,   modulo: 'whatsapp'     },
  { href: '/profissionais', label: 'Profissionais', icon: UserCog,         modulo: 'profissionais'},
  { href: '/crm',           label: 'CRM',           icon: Target,          modulo: 'crm'          },
  { href: '/configuracoes', label: 'Configurações', icon: Settings,        modulo: 'configuracoes'},
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useTenant()

  if (!user) return null

  const visibleItems = NAV_ITEMS.filter(item =>
    hasPermission(user.perfil, item.modulo, 'read')
  )

  return (
    <aside className="w-60 h-full border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <p className="font-semibold text-sm text-foreground">AltClinic</p>
        <p className="text-xs text-muted-foreground truncate">{user.tenant_nome}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground truncate">{user.nome}</p>
        <p className="text-xs text-muted-foreground capitalize">{user.perfil}</p>
      </div>
    </aside>
  )
}
