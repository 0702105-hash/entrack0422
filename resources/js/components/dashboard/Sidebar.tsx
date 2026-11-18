import { Link, usePage } from '@inertiajs/react'
import React from 'react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Programs', href: '/programs' },
  { label: 'Predictions', href: '/predictions' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Settings', href: '#' },
]

export default function Sidebar() {
  const { url } = usePage();

  return (
    <>
      {/* Mobile: horizontal scrollable pill nav instead of the full sidebar */}
      <nav className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-white/70 bg-white/85 p-2 shadow-sm backdrop-blur md:hidden">
        {navItems.map((item) => {
          const isActive = item.href !== '#' && url.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: full sidebar */}
      <aside className="hidden w-64 shrink-0 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-md backdrop-blur md:block">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="h-8 w-8 rounded-lg bg-sky-600" />
          <p className="text-lg font-bold text-slate-800">EnTrack</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href !== '#' && url.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current opacity-70" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl bg-sky-600 p-4 text-white">
          <p className="text-sm font-semibold">Need fresh forecast?</p>
          <p className="mt-1 text-xs text-emerald-50">
            Create a new prediction run for next AY.
          </p>
          <Link
            href="/predictions"
            className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 transition"
          >
            Create prediction
          </Link>
        </div>
      </aside>
    </>
  )
}
