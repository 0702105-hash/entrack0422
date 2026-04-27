import React from 'react'

type Tone = 'amber' | 'emerald' | 'sky' | 'violet'

type MetricCardProps = {
  title: string
  value: number | string
  change: string
  tone: Tone
}

const toneStyles: Record<Tone, string> = {
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
}

export default function MetricCard({
  title,
  value,
  change,
  tone,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold leading-none text-slate-800">
            {value}
          </p>
        </div>
        <div
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${toneStyles[tone]}`}
        >
          ●
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {change}
        </span>
        <span className="text-xs text-slate-500">this cycle</span>
      </div>
    </div>
  )
}