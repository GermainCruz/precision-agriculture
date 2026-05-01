'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Farm {
  id: string
  nombre: string
}

interface CreatePlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  farms: Farm[]
  onSuccess: () => void
}

const TIPO_SUELO_OPTIONS = [
  { value: 'arcilloso', label: 'Arcilloso' },
  { value: 'arenoso', label: 'Arenoso' },
  { value: 'limoso', label: 'Limoso' },
  { value: 'franco', label: 'Franco' },
  { value: 'orgánico', label: 'Orgánico' },
]

export function CreatePlotDialog({ open, onOpenChange, farms, onSuccess }: CreatePlotDialogProps) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    nombre: '',
    fincaId: '',
    areaHectareas: '',
    tipoSuelo: 'franco' as 'arcilloso' | 'arenoso' | 'limoso' | 'franco' | 'orgánico',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createPlot = api.plots.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Lote creado', description: `${form.nombre} fue registrado exitosamente.`, variant: 'success' as any })
      setForm({ nombre: '', fincaId: '', areaHectareas: '', tipoSuelo: 'franco' })
      setErrors({})
      onOpenChange(false)
      onSuccess()
    },
    onError: (err: any) => {
      toast({ title: 'Error al crear lote', description: err.message, variant: 'destructive' })
    },
  })

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido'
    if (!form.fincaId) errs.fincaId = 'Selecciona una finca'
    if (!form.areaHectareas || Number(form.areaHectareas) <= 0)
      errs.areaHectareas = 'Ingresa un área válida (mayor a 0)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    createPlot.mutate({
      nombre: form.nombre,
      fincaId: form.fincaId,
      areaHectareas: Number(form.areaHectareas),
      tipoSuelo: form.tipoSuelo,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Finca *</Label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm mt-1"
              value={form.fincaId}
              onChange={(e) => setForm({ ...form, fincaId: e.target.value })}
            >
              <option value="">Seleccionar finca</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
            {errors.fincaId && <p className="text-xs text-red-500 mt-1">{errors.fincaId}</p>}
          </div>

          <div>
            <Label>Nombre del lote *</Label>
            <Input
              placeholder='Ej: "Lote Norte"'
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <Label>Área (hectáreas) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej: 12.5"
              value={form.areaHectareas}
              onChange={(e) => setForm({ ...form, areaHectareas: e.target.value })}
            />
            {errors.areaHectareas && (
              <p className="text-xs text-red-500 mt-1">{errors.areaHectareas}</p>
            )}
          </div>

          <div>
            <Label>Tipo de suelo *</Label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm mt-1"
              value={form.tipoSuelo}
              onChange={(e) => setForm({ ...form, tipoSuelo: e.target.value as any })}
            >
              {TIPO_SUELO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createPlot.isLoading}>
            {createPlot.isLoading ? 'Creando…' : 'Crear Lote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
