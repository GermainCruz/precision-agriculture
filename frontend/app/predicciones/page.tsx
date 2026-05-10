'use client'

import { Loader2, TrendingUp, Sprout } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { GuestPrompt } from '@/components/auth/guest-prompt'
import { useAuthToken } from '@/hooks/use-auth-token'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default function PrediccionesPage() {
  const { ready, isLoggedIn } = useAuthToken()
  const canFetch = ready && isLoggedIn

  const { data: overview, isLoading } = api.predictions.getOverviewPlots.useQuery(undefined, {
    enabled: canFetch,
  })

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
        <h1 className="text-3xl font-bold">Predicciones</h1>
        <GuestPrompt description="Las predicciones por lote requieren una sesión iniciada." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-green-600" />
          Predicciones por lote
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Vista según manual §7: rendimiento orientativo, confianza, factores y estimaciones de cosecha/calidad.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando panorama…</div>
      ) : !overview?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Sin lotes registrados. Crea fincas y lotes en{' '}
            <Link href="/lotes" className="text-green-700 underline font-medium">
              Lotes
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(overview as any[]).map((row) => {
            const pred = row.prediccion
            const t = row.temporada

            return (
              <Card key={row.loteId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between gap-2 items-start flex-wrap">
                    <span>{row.loteNombre}</span>
                    <Badge variant="outline" className="font-normal shrink-0">
                      {row.fincaNombre}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {t ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sprout className="h-4 w-4 text-green-600" />
                      <span>{t.cultivoNombre}</span>
                      <span className="text-xs">· Siembra {formatDate(t.fechaSiembra)}</span>
                    </div>
                  ) : (
                    <p className="text-amber-700 text-xs">Sin temporada activa en este lote.</p>
                  )}

                  {!pred ? (
                    <p className="text-muted-foreground">Aún no hay predicción. Genera una desde el detalle del lote.</p>
                  ) : (
                    <>
                      <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                        <p className="text-xs text-muted-foreground">Rendimiento estimado</p>
                        <p className="text-2xl font-bold text-green-800">{pred.rendimientoKgHa} kg/ha</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Intervalo: {pred.intervaloConfianza[0]} — {pred.intervaloConfianza[1]} kg/ha
                        </p>
                      </div>

                      <div className="flex gap-2 items-start flex-wrap">
                        <span className="text-xl" aria-hidden>
                          {pred.nivelConfianzaEmoji}
                        </span>
                        <div>
                          <p className="font-medium capitalize">Confianza {pred.nivelConfianza}</p>
                          <p className="text-xs text-muted-foreground">{pred.nivelConfianzaTexto}</p>
                          {pred.precisionModeloDeclarada != null && (
                            <p className="text-xs mt-1">
                              Precisión modelo declarada: {(pred.precisionModeloDeclarada * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Cosecha orientativa</p>
                          <p className="font-medium">{formatDate(pred.fechaCosechaEstimada)}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Calidad grano (orientativo)</p>
                          <p className="font-medium">{pred.calidadGranoEstimadaPct}%</p>
                        </div>
                      </div>

                      {pred.factoresInfluencia && (
                        <div className="text-xs">
                          <p className="font-medium text-muted-foreground mb-1">Factores (modelo)</p>
                          <pre className="p-2 bg-muted/80 rounded-md overflow-auto max-h-24 text-[11px]">
                            {JSON.stringify(pred.factoresInfluencia, null, 2)}
                          </pre>
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Actualizado · {formatDate(pred.fechaPrediccion)}{' '}
                        {pred.modeloUtilizado && `· ${pred.modeloUtilizado}`}
                      </p>
                    </>
                  )}

                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/lotes">Abrir gestión de lotes</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
