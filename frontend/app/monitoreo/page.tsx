'use client'

import { useMemo, useState } from 'react'
import { Activity, Database, Download, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { GuestPrompt } from '@/components/auth/guest-prompt'
import { useAuthToken } from '@/hooks/use-auth-token'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

function defaultDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 14)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export default function MonitoreoPage() {
  const { ready, isLoggedIn } = useAuthToken()
  const canFetch = ready && isLoggedIn
  const d0 = useMemo(defaultDates, [])

  const [fincaId, setFincaId] = useState('')
  const [loteId, setLoteId] = useState('')
  const [sensorId, setSensorId] = useState('')
  const [startDate, setStartDate] = useState(d0.start)
  const [endDate, setEndDate] = useState(d0.end)

  const { data: farms } = api.farms.getAll.useQuery(undefined, { enabled: canFetch })
  const { data: plots } = api.plots.getAllByFarm.useQuery(
    { fincaId },
    { enabled: canFetch && !!fincaId },
  )

  const { data: sensors } = api.sensors.getByLote.useQuery(
    { loteId },
    { enabled: canFetch && !!loteId },
  )

  const canQuerySeries = !!(sensorId && startDate && endDate)

  const series = api.sensors.seriesAggregatedDaily.useQuery(
    { sensorId, startDate: new Date(startDate), endDate: new Date(endDate) },
    { enabled: canFetch && canQuerySeries },
  )

  const optimal = api.sensors.optimalRanges.useQuery({ sensorId }, { enabled: canFetch && !!sensorId })

  const exportCsvMutation = api.sensors.readingsCsv.useMutation({
    onSuccess(data: { filename: string; csv: string }) {
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)
    },
  })

  const downloadCsv = () => {
    if (!sensorId || !startDate || !endDate) return
    exportCsvMutation.mutate({
      sensorId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    })
  }

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
        <h1 className="text-3xl font-bold">Monitoreo</h1>
        <GuestPrompt description="Selecciona lote y sensor con sesión iniciada para ver histórico y comparar con rangos recomendados." />
      </div>
    )
  }

  const hum = optimal.data?.humedadIdeal
  const temp = optimal.data?.temObjetivaCelsius

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8 text-sky-600" />
          Monitoreo de sensores
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Histórico agregado por día, comparación con valores orientativos y exportación CSV (manual §5).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Selector
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Label>Finca</Label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-white"
              value={fincaId}
              onChange={(e) => {
                setFincaId(e.target.value)
                setLoteId('')
                setSensorId('')
              }}
            >
              <option value="">Seleccionar…</option>
              {(farms as any)?.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Label>Lote</Label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-white"
              value={loteId}
              onChange={(e) => {
                setLoteId(e.target.value)
                setSensorId('')
              }}
              disabled={!fincaId}
            >
              <option value="">Seleccionar…</option>
              {(plots as any)?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <Label>Sensor</Label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-white"
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              disabled={!loteId}
            >
              <option value="">Seleccionar…</option>
              {(sensors as any)?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.codigo} — {s.tipo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Desde</Label>
            <Input type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" className="mt-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => downloadCsv()}
              disabled={!canQuerySeries || exportCsvMutation.isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar lecturas CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {sensorId && optimal.data && (
        <Card className="border-blue-100 bg-blue-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Referencias orientativas (vs. temporada activa / tipo sensor)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {hum ? (
              <p>
                <span className="font-medium text-blue-900">Humedad suelo:</span> rango objetivo{' '}
                {hum.min}–{hum.max}% — {hum.texto}
              </p>
            ) : (
              <p className="text-muted-foreground">Sin referencia de humedad para este tipo de sensor.</p>
            )}
            {temp ? (
              <p>
                <span className="font-medium text-blue-900">Temperatura centro cultivo:</span> ~{temp.centro}°C (
                orientativo)
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Serie diaria (promedios)</CardTitle>
        </CardHeader>
        <CardContent>
          {!canQuerySeries ? (
            <p className="text-sm text-muted-foreground">
              Completa sensor y fechas para ver la tabla histórica.
            </p>
          ) : series.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : !(series.data as any)?.length ? (
            <p className="text-sm text-muted-foreground">No hay lecturas en el rango.</p>
          ) : (
            <div className="overflow-auto max-h-80 border rounded-md">
              <table className="text-xs w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Día</th>
                    <th className="text-right p-2">Temp. °C</th>
                    <th className="text-right p-2">Hum. suelo %</th>
                    <th className="text-right p-2">Lluvia mm</th>
                  </tr>
                </thead>
                <tbody>
                  {(series.data as any[]).map((r) => (
                    <tr key={r.day} className="border-t">
                      <td className="p-2">{r.day}</td>
                      <td className="text-right p-2">
                        {r.temperaturaProm != null ? r.temperaturaProm.toFixed(1) : '—'}
                      </td>
                      <td className="text-right p-2">
                        {hum && r.humedadSueloProm != null ? (
                          <span
                            className={
                              r.humedadSueloProm < hum.min || r.humedadSueloProm > hum.max
                                ? 'text-amber-700 font-medium'
                                : ''
                            }
                          >
                            {r.humedadSueloProm}
                          </span>
                        ) : (
                          <span>{r.humedadSueloProm ?? '—'}</span>
                        )}
                      </td>
                      <td className="text-right p-2">
                        {r.precipitacionMm != null ? r.precipitacionMm.toFixed(1) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
