'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { GuestPrompt } from '@/components/auth/guest-prompt'
import { useAuthToken } from '@/hooks/use-auth-token'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Settings, User, Bell, Shield, Cpu } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ConfiguracionPage() {
  const { toast } = useToast()
  const { ready, isLoggedIn } = useAuthToken()
  const canFetch = ready && isLoggedIn

  const [profile, setProfile] = useState({ nombre: '', apellido: '', telefono: '' })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [notifPrefs, setNotifPrefs] = useState({
    emailCriticas: true,
    emailDiarias: false,
    pushTodas: true,
    smsSolo: false,
  })

  const { data: me, refetch: refetchMe } = api.auth.me.useQuery(undefined, { enabled: canFetch })

  useEffect(() => {
    if (me) {
      setProfile({ nombre: me.nombre || '', apellido: me.apellido || '', telefono: (me as any).telefono || '' })
    }
  }, [me])

  const updateProfile = api.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast({ title: 'Perfil actualizado', variant: 'success' as any })
      refetchMe()
      const stored = localStorage.getItem('user')
      if (stored) {
        const user = JSON.parse(stored)
        localStorage.setItem('user', JSON.stringify({ ...user, ...profile }))
      }
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const changePassword = api.auth.changePassword.useMutation({
    onSuccess: () => {
      toast({ title: 'Contraseña actualizada', variant: 'success' as any })
      setPasswords({ current: '', newPass: '', confirm: '' })
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const handlePasswordChange = () => {
    if (passwords.newPass !== passwords.confirm) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }
    changePassword.mutate({ currentPassword: passwords.current, newPassword: passwords.newPass })
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
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <GuestPrompt description="Editar perfil, contraseña y preferencias solo está disponible con tu cuenta iniciada." />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu perfil y preferencias del sistema</p>
      </div>

      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Mi Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={profile.nombre}
                onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input
                value={profile.apellido}
                onChange={(e) => setProfile({ ...profile, apellido: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={me?.email || ''} disabled className="bg-gray-50" />
            <p className="text-xs text-gray-400 mt-1">El email no puede modificarse aquí</p>
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              value={profile.telefono}
              onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
              placeholder="+54 9 261 123-4567"
            />
          </div>
          <Button onClick={() => updateProfile.mutate(profile)} disabled={updateProfile.isLoading}>
            {updateProfile.isLoading ? 'Guardando…' : 'Guardar Perfil'}
          </Button>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contraseña actual</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            />
          </div>
          <div>
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              value={passwords.newPass}
              onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
            />
          </div>
          <div>
            <Label>Confirmar contraseña</Label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={changePassword.isLoading} variant="outline">
            {changePassword.isLoading ? 'Cambiando…' : 'Cambiar Contraseña'}
          </Button>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Preferencias de Notificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">✉ Email</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifPrefs.emailCriticas}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, emailCriticas: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600"
              />
              <span className="text-sm">Alertas críticas</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifPrefs.emailDiarias}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, emailDiarias: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600"
              />
              <span className="text-sm">Reportes diarios</span>
            </label>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">🔔 Push</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifPrefs.pushTodas}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, pushTodas: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600"
              />
              <span className="text-sm">Todas las alertas</span>
            </label>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">📱 SMS</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifPrefs.smsSolo}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, smsSolo: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600"
              />
              <span className="text-sm">Solo emergencias</span>
            </label>
          </div>

          {/* PENDIENTE: Integrar guardado de preferencias de notificación en la BD */}
          <Button
            onClick={() => toast({ title: 'Preferencias guardadas', variant: 'success' as any })}
          >
            Guardar Preferencias
          </Button>
        </CardContent>
      </Card>

      {/* Sensores IoT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" /> Sensores IoT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Configura y gestiona los sensores instalados en tus lotes desde la sección de Lotes.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
            <p>✅ <strong>Temperatura del suelo/aire</strong> — Lectura automática</p>
            <p>✅ <strong>Humedad del suelo</strong> — Cada 15 minutos</p>
            <p>✅ <strong>Precipitación</strong> — Acumulado diario</p>
            <p>✅ <strong>Velocidad del viento</strong> — Lectura continua</p>
            <p>✅ <strong>Radiación solar</strong> — Lectura continua</p>
          </div>
          {/* PENDIENTE: Implementar UI de gestión de sensores cuando se cuente con hardware real */}
        </CardContent>
      </Card>
    </div>
  )
}
