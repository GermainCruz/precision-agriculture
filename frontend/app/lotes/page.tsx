'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { GuestPrompt } from '@/components/auth/guest-prompt'
import { useAuthToken } from '@/hooks/use-auth-token'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Home } from 'lucide-react'
import { CreatePlotDialog } from '@/components/plots/create-plot-dialog'
import { PlotDetailsDialog } from '@/components/plots/plot-details-dialog'
import { CreateFarmDialog } from '@/components/plots/create-farm-dialog'
import { formatNumber } from '@/lib/utils'

const TIPO_SUELO_LABELS: Record<string, string> = {
  arcilloso: 'Arcilloso',
  arenoso: 'Arenoso',
  limoso: 'Limoso',
  franco: 'Franco',
  'orgánico': 'Orgánico',
}

export default function LotesPage() {
  const searchParams = useSearchParams()
  const plotFromQuery = searchParams.get('plot')

  const { ready, isLoggedIn } = useAuthToken()
  const canFetch = ready && isLoggedIn

  const [selectedFarm, setSelectedFarm] = useState<string>('')
  const [createPlotOpen, setCreatePlotOpen] = useState(false)
  const [createFarmOpen, setCreateFarmOpen] = useState(false)
  const [selectedPlot, setSelectedPlot] = useState<any>(null)

  const { data: farms, isLoading: farmsLoading, refetch: refetchFarms } = api.farms.getAll.useQuery(
    undefined,
    { enabled: canFetch },
  )
  const {
    data: plots,
    isLoading: plotsLoading,
    refetch: refetchPlots,
  } = api.plots.getAllByFarm.useQuery(
    { fincaId: selectedFarm },
    { enabled: canFetch && !!selectedFarm },
  )

  const { data: plotDeepLink } = api.plots.getById.useQuery(
    { id: plotFromQuery! },
    { enabled: canFetch && !!plotFromQuery },
  )

  useEffect(() => {
    if (!plotDeepLink) return
    const fincaId = (plotDeepLink as any).fincaId ?? (plotDeepLink as any).finca?.id
    if (fincaId) setSelectedFarm(fincaId)
    setSelectedPlot(plotDeepLink)
  }, [plotDeepLink])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestión de Fincas y Lotes</h1>
        <GuestPrompt description="Aquí puedes registrar fincas, lotes, temporadas y sensores cuando tengas sesión iniciada." />
      </div>
    )
  }

  if (farmsLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        Cargando fincas…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Gestión de Fincas y Lotes</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateFarmOpen(true)}>
            <Home className="mr-2 h-4 w-4" />
            Nueva Finca
          </Button>
          <Button onClick={() => setCreatePlotOpen(true)} disabled={!farms || farms.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lote
          </Button>
        </div>
      </div>

      {/* Selector de finca */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Finca:</label>
        <select
          className="px-3 py-2 border rounded-md text-sm min-w-52 bg-white"
          value={selectedFarm}
          onChange={(e) => setSelectedFarm(e.target.value)}
        >
          <option value="">Seleccionar finca…</option>
          {farms?.map((farm: any) => (
            <option key={farm.id} value={farm.id}>
              {farm.nombre} ({formatNumber(Number(farm.areaHectareas), 1)} ha)
            </option>
          ))}
        </select>

        {selectedFarm && farms && (
          <span className="text-sm text-gray-500">
            {plots?.length ?? 0} lote(s) registrado(s)
          </span>
        )}
      </div>

      {/* Sin fincas */}
      {!farms || farms.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
          <Home className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">Aún no tienes fincas registradas</p>
          <Button onClick={() => setCreateFarmOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear primera finca
          </Button>
        </div>
      ) : !selectedFarm ? (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p>Selecciona una finca para ver sus lotes</p>
        </div>
      ) : plotsLoading ? (
        <div className="text-center py-8 text-gray-400">Cargando lotes…</div>
      ) : plots && plots.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">Esta finca no tiene lotes aún</p>
          <Button onClick={() => setCreatePlotOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear primer lote
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plots?.map((plot: any) => {
            const activeSeason = plot.temporadas?.[0]
            return (
              <Card
                key={plot.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                onClick={() => setSelectedPlot(plot)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="truncate">{plot.nombre}</span>
                    </div>
                    {activeSeason && (
                      <Badge variant="success" className="text-xs flex-shrink-0">
                        {activeSeason.estado}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Área:</span>
                    <span className="font-medium">{formatNumber(Number(plot.areaHectareas), 1)} ha</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Suelo:</span>
                    <span>{TIPO_SUELO_LABELS[plot.tipoSuelo] || plot.tipoSuelo}</span>
                  </div>
                  {activeSeason ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Cultivo:</span>
                        <span className="font-medium">{activeSeason.cultivo?.nombre}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sin cultivo activo</p>
                  )}
                  {plot.sensores?.length > 0 && (
                    <div className="text-xs text-blue-600">
                      📡 {plot.sensores.length} sensor(es) instalado(s)
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateFarmDialog
        open={createFarmOpen}
        onOpenChange={setCreateFarmOpen}
        onSuccess={() => refetchFarms()}
      />

      <CreatePlotDialog
        open={createPlotOpen}
        onOpenChange={setCreatePlotOpen}
        farms={farms || []}
        onSuccess={() => refetchPlots()}
      />

      <PlotDetailsDialog
        open={!!selectedPlot}
        onOpenChange={(o) => !o && setSelectedPlot(null)}
        plot={selectedPlot}
      />
    </div>
  )
}
