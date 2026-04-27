import React from 'react';

type ChartItem = {
  label: string;
  value: number;
};

type Props = {
  data: ChartItem[];
};

export default function ProgramPredictionBarChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No chart data available yet.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d.value || 0)), 1);

  return (
    <div className="space-y-4">
      {data.map((item, idx) => {
        const value = Number(item.value || 0);
        const widthPercent = (value / maxValue) * 100;

        return (
          <div key={`${item.label}-${idx}`} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="font-semibold text-slate-600">{value}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}