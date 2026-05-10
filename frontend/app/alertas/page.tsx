'use client'

import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertCircle, AlertTriangle, Info, Zap, CheckCheck, Loader2, MapPin } from 'lucide-react'
import { GuestPrompt } from '@/components/auth/guest-prompt'
import { useAuthToken } from '@/hooks/use-auth-token'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

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
  const { ready, isLoggedIn } = useAuthToken()
  const canFetch = ready && isLoggedIn

  const [page, setPage] = useState(0)
  const PAGE_SIZE = 15
  const [filterTipo, setFilterTipo] = useState('')
  const [filterSeveridad, setFilterSeveridad] = useState('')
  const [filterLeida, setFilterLeida] = useState<'todas' | 'si' | 'no'>('todas')
  const [filtroFincaId, setFiltroFincaId] = useState('')
  const [filtroLoteId, setFiltroLoteId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const { data: farms } = api.farms.getAll.useQuery(undefined, { enabled: canFetch })
  const { data: plotsFiltro } = api.plots.getAllByFarm.useQuery(
    { fincaId: filtroFincaId },
    { enabled: canFetch && !!filtroFincaId },
  )

  const { data, refetch, isLoading } = api.alerts.getAll.useQuery(
    {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      ...(filterTipo ? { tipo: filterTipo } : {}),
      ...(filterSeveridad ? { severidad: filterSeveridad } : {}),
      ...(filterLeida === 'si' ? { leida: true } : {}),
      ...(filterLeida === 'no' ? { leida: false } : {}),
      ...(filtroLoteId ? { loteId: filtroLoteId } : {}),
      ...(desde ? { desde: new Date(desde) } : {}),
      ...(hasta ? { hasta: new Date(hasta) } : {}),
    },
    { enabled: canFetch },
  )

  const markAsRead = api.alerts.markAsRead.useMutation({
    onSuccess: () => { toast({ title: 'Alerta marcada como leída' }); refetch() },
  })
  const markAllAsRead = api.alerts.markAllAsRead.useMutation({
    onSuccess: () => { toast({ title: 'Todas las alertas marcadas como leídas' }); refetch() },
  })

  const alerts = data?.alerts || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Centro de Alertas</h1>
        <GuestPrompt description="Las alertas de tu cuenta aparecen cuando has iniciado sesión." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
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

      <div className="flex flex-wrap gap-3 items-end p-4 border rounded-lg bg-muted/30">
        <div>
          <Label className="text-xs">Tipo</Label>
          <select
            className="mt-1 block px-2 py-1.5 border rounded text-sm bg-white min-w-[120px]"
            value={filterTipo}
            onChange={(e) => {
              setFilterTipo(e.target.value)
              setPage(0)
            }}
          >
            <option value="">Todos</option>
            <option value="clima">Clima</option>
            <option value="riego">Riego</option>
            <option value="plaga">Plaga</option>
            <option value="rendimiento">Rendimiento</option>
            <option value="sistema">Sistema</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Severidad</Label>
          <select
            className="mt-1 block px-2 py-1.5 border rounded text-sm bg-white min-w-[120px]"
            value={filterSeveridad}
            onChange={(e) => {
              setFilterSeveridad(e.target.value)
              setPage(0)
            }}
          >
            <option value="">Todas</option>
            <option value="critica">Crítica</option>
            <option value="advertencia">Advertencia</option>
            <option value="info">Info</option>
            <option value="emergencia">Emergencia</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Leída</Label>
          <select
            className="mt-1 block px-2 py-1.5 border rounded text-sm bg-white min-w-[100px]"
            value={filterLeida}
            onChange={(e) => {
              setFilterLeida(e.target.value as 'todas' | 'si' | 'no')
              setPage(0)
            }}
          >
            <option value="todas">Todas</option>
            <option value="no">No leídas</option>
            <option value="si">Leídas</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Finca (filtrar lote)</Label>
          <select
            className="mt-1 block px-2 py-1.5 border rounded text-sm bg-white min-w-[140px]"
            value={filtroFincaId}
            onChange={(e) => {
              setFiltroFincaId(e.target.value)
              setFiltroLoteId('')
              setPage(0)
            }}
          >
            <option value="">—</option>
            {(farms as any)?.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Lote</Label>
          <select
            className="mt-1 block px-2 py-1.5 border rounded text-sm bg-white min-w-[140px]"
            value={filtroLoteId}
            onChange={(e) => {
              setFiltroLoteId(e.target.value)
              setPage(0)
            }}
            disabled={!filtroFincaId}
          >
            <option value="">Todos</option>
            {(plotsFiltro as any)?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Desde</Label>
          <Input type="date" className="mt-1 h-9 w-36" value={desde} onChange={(e) => { setDesde(e.target.value); setPage(0) }} />
        </div>
        <div>
          <Label className="text-xs">Hasta</Label>
          <Input type="date" className="mt-1 h-9 w-36" value={hasta} onChange={(e) => { setHasta(e.target.value); setPage(0) }} />
        </div>
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

                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {alert.lote?.id && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/lotes?plot=${alert.lote.id}`}>
                            <MapPin className="mr-1 h-3 w-3" />
                            Ir al lote
                          </Link>
                        </Button>
                      )}
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
