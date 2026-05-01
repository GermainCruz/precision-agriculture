'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
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

const getBarColor = (value: number) => {
  if (value > 80) return '#16a34a'
  if (value > 60) return '#eab308'
  return '#dc2626'
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
          formatter={(value: number, name: string) => [
            name === 'totalVolume' ? `${value?.toFixed(1)} m³` : value,
            name === 'totalVolume' ? 'Volumen Total' : name === 'events' ? 'Eventos' : name,
          ]}
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
