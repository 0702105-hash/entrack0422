import React from 'react'

type Accent = 'emerald' | 'sky'

type SideInfoCardProps = {
  title: string
  value: string
  subValue: string
  accent: Accent
}

const accentStyles: Record<Accent, string> = {
  emerald: 'text-emerald-600 bg-emerald-100',
  sky: 'text-sky-600 bg-sky-100',
}

export default function SideInfoCard({
  title,
  value,
  subValue,
  accent,
}: SideInfoCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subValue}</p>

      <div className="mt-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accentStyles[accent]}`}
        >
          Live
        </span>
      </div>
    </div>
  )
}