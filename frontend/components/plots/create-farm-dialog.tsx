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

interface CreateFarmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateFarmDialog({ open, onOpenChange, onSuccess }: CreateFarmDialogProps) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    nombre: '',
    ubicacion: '',
    areaHectareas: '',
    lat: '',
    lng: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createFarm = api.farms.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Finca creada', description: `${form.nombre} fue registrada.`, variant: 'success' as any })
      setForm({ nombre: '', ubicacion: '', areaHectareas: '', lat: '', lng: '' })
      setErrors({})
      onOpenChange(false)
      onSuccess()
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido'
    if (!form.areaHectareas || Number(form.areaHectareas) <= 0)
      errs.areaHectareas = 'Ingresa un área válida'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    createFarm.mutate({
      nombre: form.nombre,
      ubicacion: form.ubicacion || undefined,
      areaHectareas: Number(form.areaHectareas),
      coordenadas:
        form.lat && form.lng
          ? { lat: Number(form.lat), lng: Number(form.lng) }
          : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Finca</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              placeholder='Ej: "Finca El Paraíso"'
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <Label>Ubicación</Label>
            <Input
              placeholder='Ej: "Km 12 Ruta 5, Mendoza"'
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            />
          </div>

          <div>
            <Label>Área total (hectáreas) *</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Ej: 50.5"
              value={form.areaHectareas}
              onChange={(e) => setForm({ ...form, areaHectareas: e.target.value })}
            />
            {errors.areaHectareas && (
              <p className="text-xs text-red-500 mt-1">{errors.areaHectareas}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Latitud (opcional)</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="-32.89"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
            </div>
            <div>
              <Label>Longitud (opcional)</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="-68.84"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createFarm.isLoading}>
            {createFarm.isLoading ? 'Creando…' : 'Crear Finca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
