'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertCircle, AlertTriangle, Info, Zap, CheckCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const severityConfig: Record<string, { label: string; icon: any; color: string; badgeVariant: any }> = {
  critica: { label: 'Crítica', icon: Zap, color: 'text-red-600 bg-red-50', badgeVariant: 'destructive' },
  emergencia: { label: 'Emergencia', icon: AlertCircle, color: 'text-red-700 bg-red-100', badgeVariant: 'destructive' },
  advertencia: { label: 'Advertencia', icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50', badgeVariant: 'warning' },
  info: { label: 'Info', icon: Info, color: 'text-blue-600 bg-blue-50', badgeVariant: 'info' },
}

const tipoLabels: Record<string, string> = {
  riego: '💧 Riego',
  clima: '🌩️ Clima',
  plaga: '🐛 Plaga',
  rendimiento: '📉 Rendimiento',
  sistema: '⚙️ Sistema',
}

export default function AlertasPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 15

  const { data, refetch, isLoading } = api.alerts.getAll.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const markAsRead = api.alerts.markAsRead.useMutation({
    onSuccess: () => { toast({ title: 'Alerta marcada como leída' }); refetch() },
  })
  const markAllAsRead = api.alerts.markAllAsRead.useMutation({
    onSuccess: () => { toast({ title: 'Todas las alertas marcadas como leídas' }); refetch() },
  })

  const alerts = data?.alerts || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Centro de Alertas</h1>
          <p className="text-gray-500 text-sm mt-1">{total} alerta(s) en total</p>
        </div>
        <Button
          variant="outline"
          onClick={() => markAllAsRead.mutate()}
          disabled={markAllAsRead.isLoading}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Marcar todas como leídas
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando alertas…</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No hay alertas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const config = severityConfig[alert.severidad] || severityConfig.info
            const Icon = config.icon

            return (
              <Card
                key={alert.id}
                className={`transition-opacity ${alert.leida ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.color.split(' ')[1]}`}>
                      <Icon className={`h-5 w-5 ${config.color.split(' ')[0]}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={config.badgeVariant}>{config.label}</Badge>
                        <span className="text-xs text-gray-500">
                          {tipoLabels[alert.tipo] || alert.tipo}
                        </span>
                        {!alert.leida && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                            Nuevo
                          </Badge>
                        )}
                        {alert.lote && (
                          <span className="text-xs text-gray-400">
                            📍 {alert.lote.nombre}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800">{alert.mensaje}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(alert.creadaEn, { hour: '2-digit', minute: '2-digit' })}
                        {alert.leidaEn && ` · Leída: ${formatDate(alert.leidaEn)}`}
                      </p>
                    </div>

                    {!alert.leida && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead.mutate({ alertId: alert.id })}
                      >
                        Marcar leída
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Anterior
          </Button>
          <span className="px-3 py-2 text-sm text-gray-600">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
