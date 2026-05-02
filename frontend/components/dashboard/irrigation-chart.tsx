'use client'

import type { ReactNode } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface IrrigationDataPoint {
  period: string
  totalVolume?: number
  events?: number
  averageVolume?: number
}

interface IrrigationChartProps {
  data: IrrigationDataPoint[]
}

function coerceNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function irrigationTooltipFormatter(value: unknown, name: string): [ReactNode, string] {
  if (name === 'totalVolume') {
    const n = coerceNumber(value)
    return [n !== null ? `${n.toFixed(1)} m³` : '—', 'Volumen Total']
  }
  if (name === 'events') {
    const n = coerceNumber(value)
    return [n !== null ? String(Math.round(n)) : '—', 'Eventos']
  }
  return [value == null ? '—' : String(value), name]
}

export function IrrigationChart({ data }: IrrigationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        Sin datos de riego disponibles
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: 'm³', angle: -90, position: 'insideLeft', offset: -5 }}
        />
        <Tooltip
          formatter={(value, name) => irrigationTooltipFormatter(value, String(name))}
          labelFormatter={(label) => `Período: ${label}`}
        />
        <Legend
          formatter={(value) =>
            value === 'totalVolume' ? 'Volumen (m³)' : value === 'events' ? 'Eventos' : value
          }
        />
        <Bar dataKey="totalVolume" name="totalVolume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="events" name="events" fill="#93c5fd" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
