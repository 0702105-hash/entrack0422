import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type ProgramDistributionItem = {
  name: string
  value: number
}

type DonutResourcesChartProps = {
  data: ProgramDistributionItem[]
}

const COLORS = ['#6366F1', '#22C55E', '#0EA5E9', '#8B5CF6', '#14B8A6', '#F59E0B']

export default function DonutResourcesChart({ data }: DonutResourcesChartProps) {
  const chartData = data.length
    ? data
    : [
        { name: 'BSIT', value: 0 },
        { name: 'BSCS', value: 0 },
      ]

  return (
    <div className="h-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2">
        <h2 className="text-base font-semibold text-slate-800">
          Program Distribution
        </h2>
        <p className="text-xs text-slate-500">Predicted share by program</p>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="45%"
              cy="50%"
              innerRadius={52}
              outerRadius={86}
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}