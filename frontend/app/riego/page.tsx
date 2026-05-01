'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Droplet, Calendar, Clock, TrendingUp, History, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatNumber } from '@/lib/utils'

const TIPO_RIEGO_LABELS: Record<string, string> = {
  goteo: 'Goteo',
  aspersion: 'Aspersión',
  inundacion: 'Inundación',
  subterraneo: 'Subterráneo',
}

export default function RiegoPage() {
  const { toast } = useToast()
  const [selectedFarm, setSelectedFarm] = useState<string>('')
  const [selectedPlot, setSelectedPlot] = useState<string>('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    fechaHora: '',
    duracionMinutos: 30,
    tipoRiego: 'goteo' as 'goteo' | 'aspersion' | 'inundacion' | 'subterraneo',
  })

  const { data: farms } = api.farms.getAll.useQuery()
  const { data: plots } = api.plots.getAllByFarm.useQuery(
    { fincaId: selectedFarm },
    { enabled: !!selectedFarm },
  )
  const { data: recommendations, isLoading: recsLoading } =
    api.irrigation.getRecommendations.useQuery(
      { loteId: selectedPlot },
      { enabled: !!selectedPlot },
    )
  const { data: events } = api.irrigation.getEvents.useQuery(
    {
      loteId: selectedPlot,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    { enabled: !!selectedPlot },
  )

  const scheduleIrrigation = api.irrigation.scheduleIrrigation.useMutation({
    onSuccess: () => {
      toast({ title: 'Riego programado', description: 'El evento de riego fue creado.', variant: 'success' as any })
      setScheduleOpen(false)
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const handleSchedule = () => {
    if (!selectedPlot || !scheduleForm.fechaHora) return
    scheduleIrrigation.mutate({
      loteId: selectedPlot,
      fechaHora: new Date(scheduleForm.fechaHora),
      duracionMinutos: scheduleForm.duracionMinutos,
      tipoRiego: scheduleForm.tipoRiego,
    })
  }

  const urgencyColor = (urgency?: string) => {
    if (urgency === 'high') return 'text-red-600'
    if (urgency === 'medium') return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Riego</h1>
        <Button onClick={() => setScheduleOpen(true)} disabled={!selectedPlot}>
          <Calendar className="mr-2 h-4 w-4" />
          Programar Riego
        </Button>
      </div>

      {/* Selectores */}
      <div className="flex gap-4 flex-wrap">
        <select
          className="px-3 py-2 border rounded-md text-sm min-w-40"
          value={selectedFarm}
          onChange={(e) => { setSelectedFarm(e.target.value); setSelectedPlot('') }}
        >
          <option value="">Seleccionar finca</option>
          {farms?.map((f: any) => (
            <option key={f.id} value={f.id}>{f.nombre}</option>
          ))}
        </select>

        <select
          className="px-3 py-2 border rounded-md text-sm min-w-40"
          value={selectedPlot}
          onChange={(e) => setSelectedPlot(e.target.value)}
          disabled={!selectedFarm}
        >
          <option value="">Seleccionar lote</option>
          {plots?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {selectedPlot && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recomendación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-blue-500" />
                Recomendación de Riego
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recsLoading ? (
                <p className="text-gray-500 text-sm">Calculando recomendación…</p>
              ) : recommendations ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{recommendations.recommendation}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500">Humedad actual</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {recommendations.currentSoilMoisture ?? '—'}%
                      </p>
                      <p className="text-xs text-gray-400">Óptimo: 60-80%</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-gray-500">Temperatura</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {recommendations.currentTemperature ?? '—'}°C
                      </p>
                    </div>
                  </div>

                  {recommendations.recommended_volume_m3 !== undefined && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          recommendations.urgency === 'high'
                            ? 'destructive'
                            : recommendations.urgency === 'medium'
                            ? 'warning' as any
                            : 'success' as any
                        }
                      >
                        Urgencia: {recommendations.urgency === 'high' ? 'Alta' : recommendations.urgency === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Vol. recomendado: {recommendations.recommended_volume_m3?.toFixed(1)} m³
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Sin datos de sensores disponibles</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                Historial de Riego (últimos 30 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!events || events.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Sin eventos de riego registrados</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {events.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg border text-sm"
                    >
                      <div>
                        <p className="font-medium">{formatDate(event.fechaHora)}</p>
                        <p className="text-gray-500">
                          {TIPO_RIEGO_LABELS[event.tipoRiego]} · {event.duracionMinutos} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(Number(event.volumenM3 || 0))} m³</p>
                        {event.eficiencia && (
                          <p
                            className={
                              Number(event.eficiencia) >= 0.8
                                ? 'text-green-600 text-xs'
                                : Number(event.eficiencia) >= 0.6
                                ? 'text-yellow-600 text-xs'
                                : 'text-red-600 text-xs'
                            }
                          >
                            {(Number(event.eficiencia) * 100).toFixed(0)}% eficiencia
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedPlot && (
        <div className="text-center py-16 text-gray-400">
          <Droplet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Selecciona una finca y un lote para ver el panel de riego</p>
        </div>
      )}

      {/* Dialog de programar riego */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar Riego</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fecha y hora</Label>
              <Input
                type="datetime-local"
                value={scheduleForm.fechaHora}
                onChange={(e) => setScheduleForm({ ...scheduleForm, fechaHora: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div>
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                min={1}
                max={480}
                value={scheduleForm.duracionMinutos}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, duracionMinutos: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Tipo de riego</Label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={scheduleForm.tipoRiego}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, tipoRiego: e.target.value as any })
                }
              >
                <option value="goteo">Goteo</option>
                <option value="aspersion">Aspersión</option>
                <option value="inundacion">Inundación</option>
                <option value="subterraneo">Subterráneo</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSchedule} disabled={scheduleIrrigation.isLoading}>
              {scheduleIrrigation.isLoading ? 'Programando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
