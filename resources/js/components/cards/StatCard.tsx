import React from 'react';

const toneMap = {
  blue: 'from-blue-500 to-cyan-400',
  indigo: 'from-indigo-500 to-violet-500',
  pink: 'from-pink-500 to-rose-400',
  emerald: 'from-emerald-500 to-teal-400',
};

export type Tone = 'blue' | 'indigo' | 'pink' | 'emerald';

type CardItem = {
  title: string;
  value: number | string;
  subtitle: string;
  tone: Tone;
};

export default function StatCard({ title, value, subtitle, tone = 'blue' }: CardItem) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneMap[tone] || toneMap.blue}`}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-800">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}