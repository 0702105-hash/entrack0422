import React from 'react'
import { Link } from '@inertiajs/react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', active: true },
  { label: 'Programs', href: '/programs', active: false },
  { label: 'Predictions', href: '/predictions/create', active: false },
  { label: 'Analytics', href: '#', active: false },
  { label: 'Settings', href: '#', active: false },
]

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-md backdrop-blur">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-lg bg-emerald-500" />
        <p className="text-lg font-bold text-slate-800">EnTrack</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              item.active
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current opacity-70" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl bg-emerald-500 p-4 text-white">
        <p className="text-sm font-semibold">Need fresh forecast?</p>
        <p className="mt-1 text-xs text-emerald-50">
          Create a new prediction run for next AY.
        </p>
        <Link
          href="/predictions/create"
          className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
        >
          Create prediction
        </Link>
      </div>
    </aside>
  )
}