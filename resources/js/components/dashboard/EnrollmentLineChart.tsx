import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type TrendItem = {
  period: string
  predicted: number
  baseline: number
}

type EnrollmentLineChartProps = {
  data: TrendItem[]
}

export default function EnrollmentLineChart({ data }: EnrollmentLineChartProps) {
  const chartData = data.length
    ? data
    : [
        { period: 'AY 2021', predicted: 0, baseline: 0 },
        { period: 'AY 2022', predicted: 0, baseline: 0 },
      ]

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2">
        <h2 className="text-base font-semibold text-slate-800">
          Enrollment Trend
        </h2>
        <p className="text-xs text-slate-500">
          Predicted versus baseline by academic year
        </p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}