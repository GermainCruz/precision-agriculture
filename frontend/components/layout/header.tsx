'use client'

import { Bell, User, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<{ nombre: string; apellido: string; rol: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const { data: unreadAlerts } = api.alerts.getUnread.useQuery(undefined, {
    refetchInterval: 60_000,
  })

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="text-sm text-gray-500">
        AgriPrecision — Sistema de Agricultura de Precisión
      </div>

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/alertas')}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadAlerts && unreadAlerts.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
            </Badge>
          )}
        </Button>

        {/* Usuario */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <User className="h-4 w-4 text-green-700" />
            </div>
            <span>{user ? `${user.nombre} ${user.apellido}` : 'Usuario'}</span>
            {user && (
              <Badge variant="secondary" className="text-xs capitalize">
                {user.rol}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={() => { setMenuOpen(false); router.push('/configuracion') }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Mi Perfil
              </button>
              <button
                onClick={() => { setMenuOpen(false); router.push('/configuracion') }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Configuración
              </button>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
