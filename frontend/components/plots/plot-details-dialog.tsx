'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Thermometer, Droplet, TrendingUp, Edit2, Check, X, Sprout } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatNumber } from '@/lib/utils'

interface PlotDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plot: any
}

const ESTADO_CONFIG: Record<string, { label: string; variant: any }> = {
  activo: { label: 'Activo', variant: 'success' },
  planificado: { label: 'Planificado', variant: 'secondary' },
  cosechado: { label: 'Cosechado', variant: 'outline' },
  fallido: { label: 'Fallido', variant: 'destructive' },
}

export function PlotDetailsDialog({ open, onOpenChange, plot }: PlotDetailsDialogProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ nombre: '', areaHectareas: '' })
  const [iniciarOpen, setIniciarOpen] = useState(false)
  const [temporadaForm, setTemporadaForm] = useState({
    cultivoId: '',
    fechaSiembra: '',
    fechaCosechaEstimada: '',
  })

  const { data: plotDetail, refetch } = api.plots.getById.useQuery(
    { id: plot?.id },
    { enabled: !!plot?.id },
  )
  const { data: prediction } = api.predictions.getCurrent.useQuery(
    { loteId: plot?.id },
    { enabled: !!plot?.id },
  )
  const { data: cultivos } = api.cultivos.getAll.useQuery(undefined, { enabled: iniciarOpen })
  const { data: sensorReadings } = api.sensors.getLatestReadings.useQuery(
    { loteId: plot?.id },
    { enabled: !!plot?.id },
  )

  const updatePlot = api.plots.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Lote actualizado', variant: 'success' as any })
      setEditing(false)
      refetch()
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const iniciarTemporada = api.temporadas.iniciar.useMutation({
    onSuccess: () => {
      toast({ title: 'Temporada iniciada', variant: 'success' as any })
      setIniciarOpen(false)
      refetch()
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const triggerPrediction = api.predictions.triggerPrediction.useMutation({
    onSuccess: () => toast({ title: 'Predicción generada', variant: 'success' as any }),
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  if (!plot) return null

  const detail = plotDetail || plot
  const activeSeason = detail.temporadas?.find((t: any) => t.estado === 'activo')

  const startEditing = () => {
    setEditForm({ nombre: detail.nombre, areaHectareas: String(detail.areaHectareas) })
    setEditing(true)
  }

  const saveEditing = () => {
    updatePlot.mutate({
      id: plot.id,
      nombre: editForm.nombre,
      areaHectareas: Number(editForm.areaHectareas),
    })
  }

  const getConfidenceLevel = (pred: any) => {
    if (!pred?.precisionModelo) return null
    const pct = Number(pred.precisionModelo) * 100
    if (pct >= 85) return { label: 'Alta', color: 'text-green-600', icon: '🟢' }
    if (pct >= 70) return { label: 'Media', color: 'text-yellow-600', icon: '🟡' }
    return { label: 'Baja', color: 'text-red-600', icon: '🔴' }
  }

  const confidence = getConfidenceLevel(prediction)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              {editing ? (
                <Input
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="h-8 text-lg font-semibold"
                />
              ) : (
                detail.nombre
              )}
            </div>
            <div className="flex gap-1">
              {editing ? (
                <>
                  <Button size="icon" variant="ghost" onClick={saveEditing}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              ) : (
                <Button size="icon" variant="ghost" onClick={startEditing}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="sensores">Sensores</TabsTrigger>
            <TabsTrigger value="prediccion">Predicción</TabsTrigger>
          </TabsList>

          {/* Tab: General */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Área</p>
                {editing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.areaHectareas}
                    onChange={(e) => setEditForm({ ...editForm, areaHectareas: e.target.value })}
                    className="h-8 mt-1"
                  />
                ) : (
                  <p className="text-lg font-bold">{formatNumber(Number(detail.areaHectareas), 1)} ha</p>
                )}
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Tipo de suelo</p>
                <p className="text-lg font-bold capitalize">{detail.tipoSuelo}</p>
              </div>
            </div>

            {/* Temporada activa */}
            {activeSeason ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-green-600" />
                    Temporada Activa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cultivo:</span>
                    <span className="font-medium">{activeSeason.cultivo?.nombre}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Siembra:</span>
                    <span>{formatDate(activeSeason.fechaSiembra)}</span>
                  </div>
                  {activeSeason.fechaCosechaEstimada && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cosecha estimada:</span>
                      <span>{formatDate(activeSeason.fechaCosechaEstimada)}</span>
                    </div>
                  )}
                  <Badge variant="success">{ESTADO_CONFIG.activo.label}</Badge>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                <Sprout className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500 mb-3">Sin temporada activa</p>
                <Button size="sm" onClick={() => setIniciarOpen(true)}>
                  Iniciar Temporada
                </Button>
              </div>
            )}

            {/* Dialog de iniciar temporada */}
            <Dialog open={iniciarOpen} onOpenChange={setIniciarOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Iniciar Temporada de Cultivo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cultivo</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm mt-1"
                      value={temporadaForm.cultivoId}
                      onChange={(e) => setTemporadaForm({ ...temporadaForm, cultivoId: e.target.value })}
                    >
                      <option value="">Seleccionar cultivo</option>
                      {cultivos?.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.variedad ? `(${c.variedad})` : ''} — Ciclo: {c.cicloDias} días
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Fecha de siembra</Label>
                    <Input
                      type="date"
                      value={temporadaForm.fechaSiembra}
                      onChange={(e) => setTemporadaForm({ ...temporadaForm, fechaSiembra: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha estimada de cosecha (opcional)</Label>
                    <Input
                      type="date"
                      value={temporadaForm.fechaCosechaEstimada}
                      onChange={(e) => setTemporadaForm({ ...temporadaForm, fechaCosechaEstimada: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIniciarOpen(false)}>Cancelar</Button>
                  <Button
                    onClick={() =>
                      iniciarTemporada.mutate({
                        loteId: plot.id,
                        cultivoId: temporadaForm.cultivoId,
                        fechaSiembra: temporadaForm.fechaSiembra,
                        fechaCosechaEstimada: temporadaForm.fechaCosechaEstimada || undefined,
                      })
                    }
                    disabled={iniciarTemporada.isLoading || !temporadaForm.cultivoId || !temporadaForm.fechaSiembra}
                  >
                    {iniciarTemporada.isLoading ? 'Iniciando…' : 'Iniciar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Tab: Sensores */}
          <TabsContent value="sensores" className="space-y-3 mt-4">
            {!sensorReadings || sensorReadings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Thermometer className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Sin sensores instalados en este lote</p>
              </div>
            ) : (
              sensorReadings.map((s: any) => (
                <Card key={s.sensorId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      {s.codigo} — {s.tipo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {s.ultimaLectura ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {s.ultimaLectura.temperatura !== null && (
                          <div className="p-2 bg-orange-50 rounded">
                            <p className="text-xs text-gray-500">Temperatura</p>
                            <p className="font-bold">{s.ultimaLectura.temperatura}°C</p>
                          </div>
                        )}
                        {s.ultimaLectura.humedadSuelo !== null && (
                          <div className="p-2 bg-blue-50 rounded">
                            <p className="text-xs text-gray-500">Humedad suelo</p>
                            <p className="font-bold">{s.ultimaLectura.humedadSuelo}%</p>
                          </div>
                        )}
                        {s.ultimaLectura.precipitacion !== null && (
                          <div className="p-2 bg-cyan-50 rounded">
                            <p className="text-xs text-gray-500">Precipitación</p>
                            <p className="font-bold">{s.ultimaLectura.precipitacion} mm</p>
                          </div>
                        )}
                        {s.ultimaLectura.velocidadViento !== null && (
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-500">Viento</p>
                            <p className="font-bold">{s.ultimaLectura.velocidadViento} km/h</p>
                          </div>
                        )}
                        <div className="col-span-2 text-xs text-gray-400">
                          Última lectura: {formatDate(s.ultimaLectura.timestamp, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Sin lecturas disponibles</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Tab: Predicción */}
          <TabsContent value="prediccion" className="space-y-4 mt-4">
            {prediction ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-500 mb-1">Rendimiento estimado</p>
                  <p className="text-3xl font-bold text-green-700">
                    {formatNumber(Number(prediction.rendimientoEstimadoKgHa), 0)} kg/ha
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Intervalo: {formatNumber(Number(prediction.intervaloConfianzaInf), 0)} —{' '}
                    {formatNumber(Number(prediction.intervaloConfianzaSup), 0)} kg/ha
                  </p>
                </div>

                {confidence && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{confidence.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${confidence.color}`}>
                        Confianza {confidence.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        Precisión del modelo: {(Number(prediction.precisionModelo) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Modelo: {prediction.modeloUtilizado || 'Ensemble ML'} · Predicción:{' '}
                  {formatDate(prediction.fechaPrediccion)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm mb-3">
                  {activeSeason
                    ? 'No hay predicción para esta temporada'
                    : 'Inicia una temporada para obtener predicciones'}
                </p>
              </div>
            )}

            {activeSeason && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => triggerPrediction.mutate({ loteId: plot.id })}
                disabled={triggerPrediction.isLoading}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {triggerPrediction.isLoading ? 'Calculando…' : 'Actualizar Predicción'}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
