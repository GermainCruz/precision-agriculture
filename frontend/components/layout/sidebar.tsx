'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  MapPin,
  Droplet,
  FileText,
  Bell,
  Settings,
  LogOut,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useAuthToken, notifyAuthChanged, useStoredUser } from '@/hooks/use-auth-token'

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    hideForRoles: ['agricultor'] as const,
  },
  { href: '/lotes', label: 'Lotes', icon: MapPin },
  { href: '/riego', label: 'Riego', icon: Droplet },
  { href: '/reportes', label: 'Reportes', icon: FileText, hideForRoles: ['agricultor'] as const },
  { href: '/alertas', label: 'Alertas', icon: Bell },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoggedIn, ready } = useAuthToken()
  const { user } = useStoredUser()

  const visibleMenu = menuItems.filter((item) => {
    const hide = 'hideForRoles' in item && item.hideForRoles
    if (!hide?.length) return true
    const rol = user?.rol?.toLowerCase()
    if (!rol) return true
    return !hide.some((r) => r.toLowerCase() === rol)
  })

  const handleLogout = () => {
    const wasAgricultor = user?.rol?.toLowerCase() === 'agricultor'
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    notifyAuthChanged()
    router.push(wasAgricultor ? '/lotes' : '/dashboard')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-green-700">AgriPrecision</h1>
        <p className="text-sm text-gray-500">Agricultura Inteligente</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {visibleMenu.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        {ready && isLoggedIn ? (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        ) : ready ? (
          <>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-green-700" asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </>
        ) : null}
      </div>
    </aside>
  )
}
