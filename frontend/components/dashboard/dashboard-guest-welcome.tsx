'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  MapPin,
  Droplet,
  FileText,
  Bell,
  Settings,
  LogIn,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const modules = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description:
      'Resumen de fincas, lotes, rendimiento estimado, riego y alertas. Con tu cuenta verás gráficos en vivo.',
  },
  {
    icon: MapPin,
    title: 'Lotes',
    description:
      'Gestión de fincas y parcelas: área, suelo, temporadas de cultivo y sensores asociados.',
  },
  {
    icon: Droplet,
    title: 'Riego',
    description:
      'Recomendaciones, historial y programación de riegos por lote cuando tengas datos propios.',
  },
  {
    icon: FileText,
    title: 'Reportes',
    description:
      'Generación de informes operacionales y de gestión para análisis y respaldo.',
  },
  {
    icon: Bell,
    title: 'Alertas',
    description:
      'Centro de notificaciones por severidad para actuar rápido sobre incidencias.',
  },
  {
    icon: Settings,
    title: 'Configuración',
    description:
      'Perfil, seguridad y preferencias cuando inicies sesión.',
  },
] as const

export function DashboardGuestWelcome() {
  return (
    <div className="w-full flex justify-center py-2 px-4 sm:py-6">
      <Card className="w-full max-w-3xl border-green-100 bg-gradient-to-b from-white via-white to-green-50/40 shadow-md">
        <CardHeader className="text-center space-y-2 pb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-green-700">
            Modo invitado
          </p>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-green-900">
            Bienvenido a AgriPrecision
          </CardTitle>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Plataforma de agricultura de precisión para seguir tus cultivos, riego y alertas en un solo
            lugar. Ahora mismo navegas sin cuenta: puedes conocer cada módulo; los números y gráficos
            de abajo solo se cargan cuando{' '}
            <span className="font-medium text-foreground">inicies sesión</span>.
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-center text-foreground mb-4">
            Módulos del sistema
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {modules.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex gap-3 rounded-lg border bg-white/80 p-3 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <span className="font-medium text-gray-900">{title}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t bg-green-50/50 pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Crea una cuenta o entra para vincular fincas y ver datos reales.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center w-full">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login" className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-green-200">
              <Link href="/register" className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Registrarse
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
