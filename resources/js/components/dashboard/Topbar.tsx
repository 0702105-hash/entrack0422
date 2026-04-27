import React from 'react'

export default function Topbar() {
  return (
    <header className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search program, prediction, or year..."
              className="w-full max-w-md rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none ring-emerald-400 placeholder:text-slate-400 focus:ring-2"
            />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">
            Good day, Analyst
          </h1>
          <p className="text-sm text-slate-500">
            Enrollment forecasting overview for the upcoming academic year
          </p>
        </div>

        <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
          <button className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600">
            Weekly
          </button>
          <button className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm">
            Monthly
          </button>
          <button className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600">
            Yearly
          </button>
        </div>
      </div>
    </header>
  )
}