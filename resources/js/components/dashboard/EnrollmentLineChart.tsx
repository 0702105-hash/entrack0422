import React, { useState } from 'react'
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

export type TrendItem = {
  period: string
  baseline: number | null
  baseline_male?: number | null
  baseline_female?: number | null
  predicted: number | null
  predicted_male?: number | null
  predicted_female?: number | null
}

type View = 'total' | 'male' | 'female'

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export default function EnrollmentLineChart({ data }: { data: TrendItem[] }) {
  const [view, setView] = useState<View>('total')

  const baselineKey = view === 'male' ? 'baseline_male' : view === 'female' ? 'baseline_female' : 'baseline'
  const predictedKey = view === 'male' ? 'predicted_male' : view === 'female' ? 'predicted_female' : 'predicted'

  const safeData = Array.isArray(data) ? data : []
  const viewLabel = view === 'total' ? 'Both' : view === 'male' ? 'Male' : 'Female'

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-end">
        <div className="inline-flex w-fit shrink-0 rounded-lg bg-slate-100 p-1">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setView(opt.value)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                view === opt.value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={1}>
          <LineChart data={safeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
            <Line
              type="monotone"
              dataKey={baselineKey}
              name={`Historical Baseline (${viewLabel})`}
              stroke="#94a3b8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey={predictedKey}
              name={`AI Prediction (${viewLabel})`}
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: '#0284c7', strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
