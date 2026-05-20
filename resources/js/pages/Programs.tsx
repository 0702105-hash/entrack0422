import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/PublicLayout';
import Sidebar from '@/components/dashboard/Sidebar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

// --- Types ---
type TrendItem = {
  period: string;
  baseline: number | null;
  predicted: number | null;
};

type Props = {
  filters: {
    model: string;
  };
  mainTrend: TrendItem[];
  programTrends: ProgramData[];
};

type ProgramData = {
  program_id: number;
  program_name: string;
  trend: TrendItem[];
};

export default function Programs({ filters, mainTrend, programTrends }: Props) {
  const modelLabel = filters?.model || 'Ensemble';
  const safeMainTrend = mainTrend.length
    ? mainTrend
    : [
      { period: '—', baseline: 0, predicted: 0 },
      { period: '—', baseline: 0, predicted: 0 },
    ];

  const safeProgramTrends = programTrends ?? [];

  return (
    <>
      <Head title="Programs Overview" />

      <PublicLayout>
        <div className="flex gap-4 md:gap-6">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <div className="mt-6 flex flex-col gap-6">
              {/* --- HEADER --- */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Department Predictions
                  </h2>
                  <p className="text-sm text-slate-500">
                    Analyze overall institutional growth.
                  </p>
                </div>

                <Link
                  href="/programs/manage"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Manage Programs
                </Link>
              </div>

              {/* --- MAIN CHART ONLY --- */}
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Overall Enrollment Trend ({modelLabel})
                    </h3>
                  </div>

                  <div className="flex-1 min-h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={safeMainTrend}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorPredicted"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0ea5e9"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0ea5e9"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="period"
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow:
                              '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={40}
                          iconType="circle"
                          wrapperStyle={{ fontSize: '13px' }}
                        />

                        <Area
                          type="monotone"
                          dataKey="predicted"
                          name="AI Prediction"
                          stroke="#0ea5e9"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorPredicted)"
                          activeDot={{
                            r: 6,
                            stroke: '#0284c7',
                            strokeWidth: 2,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="baseline"
                          name="Historical Baseline"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* --- BOTTOM SECTION: Individual Program Charts --- */}
              <div className="mt-4">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Breakdown by Program
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {safeProgramTrends.map((program) => {
                    const safeTrend =
                      program.trend && program.trend.length
                        ? program.trend
                        : [
                          { period: '—', baseline: 0, predicted: 0 },
                          { period: '—', baseline: 0, predicted: 0 },
                        ];

                    return (
                      <div
                        key={program.program_id}
                        className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <h4
                          className="mb-4 font-semibold text-slate-800 truncate"
                          title={program.program_name}
                        >
                          {program.program_name}
                        </h4>

                        <div className="flex-1 min-h-[220px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={safeTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                              <Line type="monotone" dataKey="baseline" name="Actual" stroke="#94a3b8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>
      </PublicLayout>
    </>
  );
}

Programs.layout = (page: React.ReactNode) => <>{page}</>;