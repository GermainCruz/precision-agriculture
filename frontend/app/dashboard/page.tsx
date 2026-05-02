'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard } from '@/components/dashboard/metric-card'
import { YieldChart } from '@/components/dashboard/yield-chart'
import { IrrigationChart } from '@/components/dashboard/irrigation-chart'
import { AlertsList } from '@/components/dashboard/alerts-list'
import { DashboardGuestWelcome } from '@/components/dashboard/dashboard-guest-welcome'
import { api } from '@/lib/api'
import { useAuthToken } from '@/hooks/use-auth-token'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { isLoggedIn, ready } = useAuthToken()
  const canFetch = ready && isLoggedIn

  const { data: metrics, isLoading: metricsLoading } = api.dashboard.getMetrics.useQuery(undefined, {
    enabled: canFetch,
  })
  const { data: charts, isLoading: chartsLoading } = api.dashboard.getCharts.useQuery(
    { periodo: 'mes' },
    { enabled: canFetch },
  )

  const showLoadingAuth = canFetch && (metricsLoading || chartsLoading)

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {!isLoggedIn ? <DashboardGuestWelcome /> : null}

      {showLoadingAuth ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Fincas"
              value={isLoggedIn ? metrics?.totalFarms ?? 0 : '—'}
              icon="farm"
            />
            <MetricCard
              title="Total Lotes"
              value={isLoggedIn ? metrics?.totalPlots ?? 0 : '—'}
              icon="plot"
            />
            <MetricCard
              title="Rendimiento Promedio"
              value={
                isLoggedIn
                  ? `${metrics?.averageYield?.toFixed(2) ?? 0} kg/ha`
                  : '—'
              }
              icon="yield"
            />
            <MetricCard
              title="Alertas No Leídas"
              value={isLoggedIn ? metrics?.unreadAlerts ?? 0 : '—'}
              icon="alert"
              variant={
                isLoggedIn && (metrics?.unreadAlerts ?? 0) > 0 ? 'warning' : 'default'
              }
            />
          </div>

          {/* Gráficos */}
          <Tabs defaultValue="yield" className="space-y-4">
            <TabsList>
              <TabsTrigger value="yield">Rendimiento</TabsTrigger>
              <TabsTrigger value="irrigation">Riego</TabsTrigger>
              <TabsTrigger value="climate">Clima</TabsTrigger>
            </TabsList>

            <TabsContent value="yield" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoggedIn ? (
                    <YieldChart data={charts?.yieldHistory || []} />
                  ) : (
                    <p className="text-center text-muted-foreground py-12 text-sm">
                      Inicia sesión para ver curvas de rendimiento de tus temporadas.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="irrigation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Eficiencia de Riego</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoggedIn ? (
                    <IrrigationChart data={charts?.irrigationData || []} />
                  ) : (
                    <p className="text-center text-muted-foreground py-12 text-sm">
                      Datos de riego disponibles tras iniciar sesión.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="climate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Datos Climáticos</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoggedIn ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold">Temperatura Promedio</h3>
                        <p className="text-2xl">
                          {charts?.climateData?.avgTemperature?.toFixed(1) || 0}°C
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Precipitación Total</h3>
                        <p className="text-2xl">
                          {charts?.climateData?.totalPrecipitation?.toFixed(1) || 0} mm
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12 text-sm">
                      Métricas de sensores después de iniciar sesión.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Alertas recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertsList />
            </CardContent>
          </Card>
        </>
      )}

    </div>
  )
}
