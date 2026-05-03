'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { GuestPrompt } from '@/components/auth/guest-prompt'
import { useAuthToken } from '@/hooks/use-auth-token'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { FileText, Plus, Download, Trash2, BarChart2, ClipboardList } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const tipoConfig = {
  operacional: { label: 'Operacional', icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
  gestion: { label: 'Gestión', icon: BarChart2, color: 'text-purple-600 bg-purple-50' },
  prediccion: { label: 'Predicción', icon: BarChart2, color: 'text-green-600 bg-green-50' },
  riego: { label: 'Riego', icon: ClipboardList, color: 'text-cyan-600 bg-cyan-50' },
}

export default function ReportesPage() {
  const { toast } = useToast()
  const { ready, isLoggedIn } = useAuthToken()
  const canFetch = ready && isLoggedIn

  const [filterTipo, setFilterTipo] = useState<'operacional' | 'gestion' | undefined>()
  const [genDialogOpen, setGenDialogOpen] = useState(false)
  const [genType, setGenType] = useState<'operacional' | 'gestion'>('operacional')
  const [form, setForm] = useState({
    fincaId: '',
    loteId: '',
    startDate: '',
    endDate: '',
  })

  const { data: reportes, refetch, isLoading } = api.reports.getAll.useQuery(
    { tipo: filterTipo },
    { enabled: canFetch },
  )
  const { data: farms } = api.farms.getAll.useQuery(undefined, { enabled: canFetch })
  const { data: plots } = api.plots.getAllByFarm.useQuery(
    { fincaId: form.fincaId },
    { enabled: canFetch && !!form.fincaId },
  )

  const generateOperational = api.reports.generateOperational.useMutation({
    onSuccess: () => {
      toast({ title: 'Reporte generado', description: 'El reporte operacional fue creado.', variant: 'success' as any })
      setGenDialogOpen(false)
      refetch()
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const generateManagement = api.reports.generateManagement.useMutation({
    onSuccess: () => {
      toast({ title: 'Reporte generado', description: 'El reporte de gestión fue creado.', variant: 'success' as any })
      setGenDialogOpen(false)
      refetch()
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const deleteReport = api.reports.delete.useMutation({
    onSuccess: () => { toast({ title: 'Reporte eliminado' }); refetch() },
  })

  const exportPdf = api.reports.exportPdf.useMutation({
    onSuccess: (data: { filename: string; pdfBase64: string }) => {
      const bin = atob(data.pdfBase64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)
      toast({
        title: 'Descarga lista',
        description: `${data.filename} generado.`,
        variant: 'success' as any,
      })
      refetch()
    },
    onError: (err: any) =>
      toast({ title: 'No se pudo exportar PDF', description: err.message, variant: 'destructive' }),
  })

  const downloadReportPdf = (reportId: string) => exportPdf.mutate({ reportId })

  const handleGenerate = () => {
    if (genType === 'operacional') {
      if (!form.loteId || !form.startDate || !form.endDate) {
        toast({ title: 'Faltan datos', description: 'Completa lote y rango de fechas', variant: 'destructive' })
        return
      }
      generateOperational.mutate({
        loteId: form.loteId,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
      })
    } else {
      if (!form.fincaId) {
        toast({ title: 'Faltan datos', description: 'Selecciona una finca', variant: 'destructive' })
        return
      }
      generateManagement.mutate({ fincaId: form.fincaId })
    }
  }

  const isGenerating = generateOperational.isLoading || generateManagement.isLoading

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
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">Genera y descarga reportes del sistema</p>
        </div>
        <GuestPrompt description="Lista, generación y eliminación de reportes están vinculadas a tu usuario; identifícate para usar esta sección." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">Genera y descarga reportes del sistema</p>
        </div>
        <Button onClick={() => setGenDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generar Reporte
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filterTipo === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterTipo(undefined)}
        >
          Todos
        </Button>
        <Button
          variant={filterTipo === 'operacional' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterTipo('operacional')}
        >
          Operacionales
        </Button>
        <Button
          variant={filterTipo === 'gestion' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterTipo('gestion')}
        >
          Gestión
        </Button>
      </div>

      {/* Lista de reportes */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando reportes…</div>
      ) : !reportes || reportes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No hay reportes generados aún</p>
          <Button className="mt-4" onClick={() => setGenDialogOpen(true)}>
            Generar primer reporte
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reportes.map((reporte: any) => {
            const config = tipoConfig[reporte.tipo as keyof typeof tipoConfig] || tipoConfig.operacional
            const Icon = config.icon

            return (
              <Card key={reporte.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${config.color.split(' ')[1]}`}>
                      <Icon className={`h-5 w-5 ${config.color.split(' ')[0]}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{config.label}</Badge>
                        <Badge variant="secondary" className="uppercase text-xs">
                          {reporte.formato}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Generado: {formatDate(reporte.generadoEn, { hour: '2-digit', minute: '2-digit' })}
                        {reporte.descargadoEn && ` · Descargado: ${formatDate(reporte.descargadoEn)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {reporte.urlArchivo ? (
                        <Button variant="outline" size="sm" asChild title="Abrir archivo">
                          <a
                            href={reporte.urlArchivo}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          title="Descargar PDF"
                          disabled={
                            exportPdf.isLoading &&
                            exportPdf.variables?.reportId === reporte.id
                          }
                          onClick={() => downloadReportPdf(reporte.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteReport.mutate({ reportId: reporte.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de generar reporte */}
      <Dialog open={genDialogOpen} onOpenChange={setGenDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Reporte</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de reporte</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={genType === 'operacional' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGenType('operacional')}
                >
                  Operacional
                </Button>
                <Button
                  variant={genType === 'gestion' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGenType('gestion')}
                >
                  Gestión
                </Button>
              </div>
            </div>

            <div>
              <Label>Finca</Label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm mt-1"
                value={form.fincaId}
                onChange={(e) => setForm({ ...form, fincaId: e.target.value, loteId: '' })}
              >
                <option value="">Seleccionar finca</option>
                {farms?.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>

            {genType === 'operacional' && (
              <>
                <div>
                  <Label>Lote</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md text-sm mt-1"
                    value={form.loteId}
                    onChange={(e) => setForm({ ...form, loteId: e.target.value })}
                    disabled={!form.fincaId}
                  >
                    <option value="">Seleccionar lote</option>
                    {plots?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Fecha inicio</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha fin</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generando…' : 'Generar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
