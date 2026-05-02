'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tractor, MapPin, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: 'farm' | 'plot' | 'yield' | 'alert'
  variant?: 'default' | 'warning'
}

const icons = {
  farm: Tractor,
  plot: MapPin,
  yield: TrendingUp,
  alert: AlertCircle,
}

export function MetricCard({ title, value, icon, variant = 'default' }: MetricCardProps) {
  const Icon = icons[icon]

  return (
    <Card className={cn(
      variant === 'warning' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
