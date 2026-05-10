'use client'

import Link from 'next/link'
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
import { User, Bell, Shield, Cpu, Users, ScrollText } from 'lucide-react'
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
  const [humCritPct, setHumCritPct] = useState('')
  const [humMaxPct, setHumMaxPct] = useState('')
  const [adminNew, setAdminNew] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    rolNombre: 'tecnico' as 'administrador' | 'tecnico' | 'agricultor',
  })

  const { data: me, refetch: refetchMe } = api.auth.me.useQuery(undefined, { enabled: canFetch })

  useEffect(() => {
    if (me) {
      setProfile({ nombre: me.nombre || '', apellido: me.apellido || '', telefono: (me as any).telefono || '' })
    }
    const pa = me && typeof (me as any).preferenciasAlertas === 'object' ? (me as any).preferenciasAlertas : null
    if (pa) {
      setNotifPrefs({
        emailCriticas: pa.emailCriticas !== false,
        emailDiarias: Boolean(pa.emailDiarias),
        pushTodas: pa.pushTodas !== false,
        smsSolo: Boolean(pa.smsSolo),
      })
      if (pa.umbrales && typeof pa.umbrales === 'object') {
        const u = pa.umbrales as Record<string, number>
        setHumCritPct(u.humedadSueloCriticaPct != null ? String(u.humedadSueloCriticaPct) : '')
        setHumMaxPct(u.humedadSueloMaxPct != null ? String(u.humedadSueloMaxPct) : '')
      }
    }
  }, [me])

  const updateAlertPrefs = api.alerts.updatePreferencias.useMutation({
    onSuccess: () => {
      toast({ title: 'Preferencias de alertas guardadas', variant: 'success' as any })
      refetchMe()
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const isAdmin = String((me as any)?.rol || '').toLowerCase() === 'administrador'
  const { data: adminUsers, refetch: refetchAdminUsers } = api.admin.listUsers.useQuery(undefined, {
    enabled: canFetch && isAdmin,
  })
  const { data: auditRows } = api.admin.listAudit.useQuery({ limit: 40 }, {
    enabled: canFetch && isAdmin,
  })
  const adminCreateUser = api.admin.createUser.useMutation({
    onSuccess: () => {
      toast({ title: 'Usuario creado', variant: 'success' as any })
      refetchAdminUsers()
      setAdminNew({
        email: '',
        password: '',
        nombre: '',
        apellido: '',
        rolNombre: 'tecnico',
      })
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })
  const adminUpdateUser = api.admin.updateUser.useMutation({
    onSuccess: () => {
      toast({ title: 'Usuario actualizado', variant: 'success' as any })
      refetchAdminUsers()
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

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

          <p className="text-sm font-medium text-gray-700">Umbrales humedad suelo (alertas orientativas)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Crítica %</Label>
              <Input value={humCritPct} onChange={(e) => setHumCritPct(e.target.value)} placeholder="Ej. 40" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Máxima %</Label>
              <Input value={humMaxPct} onChange={(e) => setHumMaxPct(e.target.value)} placeholder="Ej. 80" />
            </div>
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

          <Button
            disabled={updateAlertPrefs.isLoading}
            onClick={() => {
              const c = Number(humCritPct)
              const m = Number(humMaxPct)
              updateAlertPrefs.mutate({
                emailCriticas: notifPrefs.emailCriticas,
                emailDiarias: notifPrefs.emailDiarias,
                pushTodas: notifPrefs.pushTodas,
                smsSolo: notifPrefs.smsSolo,
                ...(((!Number.isNaN(c) && c > 0) || (!Number.isNaN(m) && m > 0))
                  ? {
                      umbrales: {
                        ...(!Number.isNaN(c) && c > 0 ? { humedadSueloCriticaPct: c } : {}),
                        ...(!Number.isNaN(m) && m > 0 ? { humedadSueloMaxPct: m } : {}),
                      },
                    }
                  : {}),
              })
            }}
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
            Alta, edición y baja de sensores: solo <strong>técnicos</strong> y{' '}
            <strong>administradores</strong> desde <strong>Lotes</strong> → detalle del lote. Cualquier perfil con
            sensores asignados puede consultar históricos y CSV en{' '}
            <Link href="/monitoreo" className="text-green-700 underline font-medium">
              Monitoreo
            </Link>
            .
          </p>
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
            <p>✅ <strong>Temperatura del suelo/aire</strong> — Lectura automática</p>
            <p>✅ <strong>Humedad del suelo</strong> — Cada 15 minutos</p>
            <p>✅ <strong>Precipitación</strong> — Acumulado diario</p>
            <p>✅ <strong>Velocidad del viento</strong> — Lectura continua</p>
            <p>✅ <strong>Radiación solar</strong> — Lectura continua</p>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Administración de usuarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-white p-4 space-y-3 text-sm">
              <p className="font-medium">Crear usuario</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <Input placeholder="Email" value={adminNew.email} onChange={(e) => setAdminNew({ ...adminNew, email: e.target.value })} />
                <Input type="password" placeholder="Contraseña" value={adminNew.password} onChange={(e) => setAdminNew({ ...adminNew, password: e.target.value })} />
                <Input placeholder="Nombre" value={adminNew.nombre} onChange={(e) => setAdminNew({ ...adminNew, nombre: e.target.value })} />
                <Input placeholder="Apellido" value={adminNew.apellido} onChange={(e) => setAdminNew({ ...adminNew, apellido: e.target.value })} />
                <select
                  className="px-2 py-2 border rounded sm:col-span-2"
                  value={adminNew.rolNombre}
                  onChange={(e) =>
                    setAdminNew({
                      ...adminNew,
                      rolNombre: e.target.value as typeof adminNew.rolNombre,
                    })
                  }
                >
                  <option value="tecnico">Técnico</option>
                  <option value="agricultor">Agricultor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <Button
                disabled={adminCreateUser.isLoading}
                onClick={() =>
                  adminCreateUser.mutate({
                    ...adminNew,
                  })
                }
              >
                Crear
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Usuarios</p>
              <div className="overflow-auto max-h-64 border rounded-md bg-white text-xs">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Rol</th>
                      <th className="text-left p-2">Activo</th>
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {(adminUsers as any)?.map?.((u: any) => (
                      <tr key={u.id} className="border-t">
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.rol?.nombre}</td>
                        <td className="p-2">{u.activo ? 'sí' : 'no'}</td>
                        <td className="p-2 text-right space-x-1 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              adminUpdateUser.mutate({
                                userId: u.id,
                                activo: !u.activo,
                              })
                            }
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                          <select
                            className="border rounded px-1 py-0.5 ml-1"
                            value={String(u.rol?.nombre || '')}
                            onChange={(ev) =>
                              adminUpdateUser.mutate({
                                userId: u.id,
                                rolNombre: ev.target.value as typeof adminNew.rolNombre,
                              })
                            }
                          >
                            <option value="administrador">administrador</option>
                            <option value="tecnico">tecnico</option>
                            <option value="agricultor">agricultor</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <ScrollText className="h-4 w-4" /> Auditoría (acciones admin)
              </p>
              <div className="overflow-auto max-h-48 border rounded-md bg-white text-[11px] font-mono p-2">
                {(auditRows as any)?.length
                  ? (auditRows as any).map((a: any) => (
                      <div key={a.id} className="border-b border-dashed py-1">
                        {new Date(a.creadoEn).toISOString()} · {a.accion}{' '}
                        {a.entidadTipo ? `(${a.entidadTipo})` : ''}
                      </div>
                    ))
                  : 'Sin registros.'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
