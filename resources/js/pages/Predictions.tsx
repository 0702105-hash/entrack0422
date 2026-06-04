import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
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

type PredictionData = {
  prediction_id: number;
  program_id: number;
  program_name: string;
  model: string;
  academic_year: string;
  trend: TrendItem[];
};

type ProgramOption = {
  program_id: number;
  program_name: string;
};

type Props = {
  filters: {
    model: string;
    year_start: string;
    year_end: string;
    program_id: string;
  };
  models: string[];
  programs: ProgramOption[];
  mainTrend: TrendItem[];
  predictionTrends: PredictionData[];
};

export default function Predictions({
  filters,
  models,
  programs,
  mainTrend,
  predictionTrends = [],
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const { data, setData, post, processing } = useForm({
    program_id: filters?.program_id || '',
    year_start: filters?.year_start || '',
    year_end: filters?.year_end || '',
    model: filters?.model || 'Ensemble',
  });

  // --- Generate Dynamic Years ---
  const currentBaseYear = 2013; 
  const currentYear = new Date().getFullYear();
  const startYears = Array.from({ length: 5 }, (_, i) => currentBaseYear + i);
  const endYears = data.year_start 
    ? Array.from({ length: 5 }, (_, i) => parseInt(data.year_start) + i + 1) 
    : [];

  // --- Handlers ---
  const handleFilterChange = (field: string, value: string) => {
    setData(field as any, value);
    router.get(
      '/predictions',
      { ...data, [field]: value },
      { preserveState: true, preserveScroll: true, replace: true }
    );
  };

  const handleStartYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStart = e.target.value;
    // Update state and clear end_year since the start changed
    setData(prev => ({ ...prev, year_start: newStart, year_end: '' }));
    
    router.get(
      '/predictions',
      { ...data, year_start: newStart, year_end: '' },
      { preserveState: true, preserveScroll: true, replace: true }
    );
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    post('/predict', {
      preserveScroll: true,
      onSuccess: () => alert('Prediction generated successfully!'),
      onError: (errors) => alert('ML Engine Failed:\n\n' + (errors.prediction || 'Unknown error')),
    });
  };

  const safeMainTrend = mainTrend && mainTrend.length > 0
    ? mainTrend
    : [
        { period: 'First', baseline: 0, predicted: 0 },
        { period: 'Second', baseline: 0, predicted: 0 },
        { period: 'Summer', baseline: 0, predicted: 0 }
      ];

  return (
    <>
      <Head title="Predictions Overview" />

      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-2xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            <h3 className="text-xl font-bold text-slate-800">Running ML Engine...</h3>
            <p className="text-sm text-slate-500">Calculating historical trends. This may take a minute.</p>
          </div>
        </div>
      )}

      <PublicLayout>
        <div className="flex gap-4 md:gap-6">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <div className="mt-6 flex flex-col gap-6">
              
              <div>
                <h2 className="text-xl font-bold text-slate-800">Predictions</h2>
                <p className="text-sm text-slate-500">
                  Create and review predictions by model, academic year, and program.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                
                {/* Main Aggregated Chart */}
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Overall Prediction Trend ({data.model})
                    </h3>
                  </div>

                  <div className="flex-1 min-h-[350px] w-full">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <AreaChart data={safeMainTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                          <Area type="monotone" dataKey="predicted" name="AI Prediction" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorPredicted)" activeDot={{ r: 6, stroke: '#0284c7', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="baseline" name="Historical Baseline" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Control Panel (Filters & Generate) */}
                <form onSubmit={handlePredict} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
                  <h3 className="mb-1 text-lg font-semibold text-slate-800">Prediction Engine</h3>
                  <p className="mb-6 text-sm text-slate-500">Filter views or run a new forecast.</p>

                  <div className="flex flex-col gap-5">
                    {/* Model Dropdown */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Algorithm Model</label>
                      <select
                        value={data.model}
                        onChange={(e) => handleFilterChange('model', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                      >
                        {models.map((model) => <option key={model} value={model}>{model}</option>)}
                      </select>
                    </div>

                    {/* DUAL ACADEMIC YEAR DROPDOWNS */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-700">Start Year</label>
                        <select
                          value={data.year_start}
                          onChange={handleStartYearChange}
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                        >
                          <option value="">Select</option>
                          {startYears.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-700">End Year</label>
                        <select
                          value={data.year_end}
                          onChange={(e) => handleFilterChange('year_end', e.target.value)}
                          disabled={!data.year_start}
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select</option>
                          {endYears.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Program Dropdown */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Program</label>
                      <select
                        value={data.program_id}
                        onChange={(e) => handleFilterChange('program_id', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                      >
                        <option value="">All Programs</option>
                        {programs.map((p) => (
                          <option key={p.program_id} value={String(p.program_id)}>{p.program_name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={processing || !data.program_id || !data.year_start || !data.year_end}
                      title={(!data.program_id || !data.year_start || !data.year_end) ? "Select a program, start year, and end year to generate" : ""}
                      className="mt-4 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Generate New Forecast'}
                    </button>
                  </div>
                </form>
              </div>

              {/* --- BOTTOM SECTION: Prediction Cards --- */}
              <div className="mt-4">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Prediction Results ({predictionTrends.length})
                </h3>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {predictionTrends.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                      No predictions found for the selected filters.
                    </div>
                  ) : (
                    predictionTrends.map((pred) => (
                      <div key={pred.prediction_id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                        <div className="mb-2">
                          <h4 className="font-semibold text-slate-800 truncate" title={pred.program_name}>{pred.program_name}</h4>
                          <p className="text-xs text-slate-500">{pred.model} • AY {pred.academic_year}</p>
                        </div>

                        <div className="flex-1 min-h-[220px] w-full">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                              <LineChart data={pred.trend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="baseline" name="Actual" stroke="#94a3b8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>
      </PublicLayout>
    </>
  );
}

Predictions.layout = (page: React.ReactNode) => <>{page}</>;