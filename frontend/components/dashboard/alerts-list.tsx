'use client'

import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthToken } from '@/hooks/use-auth-token'
import Link from 'next/link'

const severityConfig = {
  critica: {
    icon: Zap,
    badgeVariant: 'destructive' as const,
    label: 'Crítica',
    className: 'text-red-600',
  },
  emergencia: {
    icon: AlertCircle,
    badgeVariant: 'destructive' as const,
    label: 'Emergencia',
    className: 'text-red-700',
  },
  advertencia: {
    icon: AlertTriangle,
    badgeVariant: 'warning' as const,
    label: 'Advertencia',
    className: 'text-yellow-600',
  },
  info: {
    icon: Info,
    badgeVariant: 'info' as const,
    label: 'Info',
    className: 'text-blue-600',
  },
}

const tipoLabels: Record<string, string> = {
  riego: '💧 Riego',
  clima: '🌩️ Clima',
  plaga: '🐛 Plaga',
  rendimiento: '📉 Rendimiento',
  sistema: '⚙️ Sistema',
}

export function AlertsList() {
  const router = useRouter()
  const { isLoggedIn, ready } = useAuthToken()
  const canFetch = ready && isLoggedIn

  const { data, refetch } = api.alerts.getUnread.useQuery(undefined, { enabled: canFetch })
  const markAsRead = api.alerts.markAsRead.useMutation({
    onSuccess: () => refetch(),
  })
  const markAllAsRead = api.alerts.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  })

  if (!ready) {
    return <p className="text-center text-sm text-muted-foreground py-6">Cargando…</p>
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center py-8 text-muted-foreground space-y-2">
        <Info className="h-8 w-8 mx-auto text-gray-300" />
        <p className="text-sm">
          Las alertas de tu cuenta aparecen aquí cuando{' '}
          <Link href="/login" className="text-green-700 font-medium underline underline-offset-2">
            inicies sesión
          </Link>
          .
        </p>
      </div>
    )
  }

  const alerts = data || []

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No hay alertas pendientes</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{alerts.length} alerta(s) sin leer</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isLoading}
          >
            Marcar todas como leídas
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/alertas')}>
            Ver todas
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.slice(0, 8).map((alert: any) => {
          const config =
            severityConfig[alert.severidad as keyof typeof severityConfig] || severityConfig.info
          const Icon = config.icon

          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.className}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={config.badgeVariant} className="text-xs">
                    {config.label}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {tipoLabels[alert.tipo] || alert.tipo}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{alert.mensaje}</p>
                {alert.lote && (
                  <p className="text-xs text-gray-500 mt-1">
                    Lote: {alert.lote.nombre}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs flex-shrink-0"
                onClick={() => markAsRead.mutate({ alertId: alert.id })}
              >
                Leída
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
