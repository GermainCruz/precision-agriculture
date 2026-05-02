'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface YieldDataPoint {
  period: string
  averageYield?: number
  maxYield?: number
  minYield?: number
}

interface YieldChartProps {
  data: YieldDataPoint[]
}

function yieldTooltipValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'number' && Number.isFinite(value)) return `${value.toFixed(0)} kg/ha`
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toFixed(0)} kg/ha` : '—'
}

export function YieldChart({ data }: YieldChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        Sin datos de rendimiento disponibles
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          label={{ value: 'kg/ha', angle: -90, position: 'insideLeft', offset: -5 }}
        />
        <Tooltip
          formatter={(value, name) => [yieldTooltipValue(value), String(name ?? '')]}
          labelFormatter={(label) => `Período: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="averageYield"
          name="Rendimiento Promedio"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="maxYield"
          name="Máximo"
          stroke="#86efac"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="minYield"
          name="Mínimo"
          stroke="#fca5a5"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
