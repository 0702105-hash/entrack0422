import React from 'react'

export default function Topbar() {
  return (
    <header className="flex flex-col gap-5 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        <div className="flex w-full items-center gap-3 md:flex-1">
          <input
            type="text"
            placeholder="Search program, prediction, or year..."
            className="w-full max-w-[530px] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none ring-sky-400 placeholder:text-slate-400 focus:ring-2"
          />
        </div>

        <div className="inline-flex w-fit shrink-0 rounded-xl bg-slate-100 p-1">
          <button className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600">
            Daily
          </button>
          <button className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600">
            Weekly
          </button>
          <button className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm">
            Monthly
          </button>
          <button className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600">
            Yearly
          </button>
        </div>

      </div>

      <div className="min-w-0 pl-4 md:pl-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Good day, Dr. Caluza
        </h1>
        <p className="text-sm text-slate-500">
          Enrollment forecasting overview for the upcoming academic year
        </p>
      </div>

    </header>
  )
}