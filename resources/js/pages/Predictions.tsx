import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import PublicLayout from '@/layouts/PublicLayout';
import Sidebar from '@/components/dashboard/Sidebar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TrendItem = { period: string; baseline: number | null; predicted: number | null; };
type ProgramOption = { program_id: number; program_name: string; };
type ModelBreakdownItem = {
  model: string;
  total: number;
  male: number;
  female: number;
  confidence: number;
};
type RecentPrediction = {
  enrollment_batch_id: number;
  program_id: number;
  program_name: string;
  academic_year: string;
  average: number;
  average_male: number;
  average_female: number;
  generated_at: string;
  breakdown: ModelBreakdownItem[];
};

type Props = {
  filters: { model: string; year_start: string; year_end: string; program_id: string; };
  models: string[];
  programs: ProgramOption[];
  mainTrend: TrendItem[];
  recentPredictions: RecentPrediction[];
  recentFilter: string;
};

const RECENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
];

export default function Predictions({ filters, models, programs, mainTrend, recentPredictions = [], recentFilter = 'all' }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [detailResult, setDetailResult] = useState<RecentPrediction | null>(null);
  useEffect(() => setIsMounted(true), []);

  const { data, setData, post, processing } = useForm({
    program_id: filters?.program_id || '',
    year_start: filters?.year_start || '',
    year_end: filters?.year_end || '',
    model: filters?.model || 'Ensemble',
    recent: recentFilter || 'all',
  });

  const startYear = 2013;
  const currentYear = new Date().getFullYear();
  const startYears = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  const endYears = data.year_start ? Array.from({ length: 5 }, (_, i) => parseInt(data.year_start) + i + 1) : [];

  const handleFilterChange = (field: string, value: string) => {
    setData(field as any, value);
    // FIX: Using direct URL string to prevent 'route' is not defined crash
    router.get('/predictions', { ...data, [field]: value }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const handleStartYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStart = e.target.value;
    setData(prev => ({ ...prev, year_start: newStart, year_end: '' }));
    router.get('/predictions', { ...data, year_start: newStart, year_end: '' }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    post('/predict', {
      preserveScroll: true,
      onSuccess: () => alert('Prediction generated successfully!'),
      onError: (errors) => alert('ERROR DETAILS:\n\n' + JSON.stringify(errors, null, 2)),
    });
  };

  const handleRecentChange = (value: string) => {
    setData('recent', value);
    router.get('/predictions', { ...data, recent: value }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const safeMainTrend = Array.isArray(mainTrend) ? mainTrend : [];

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
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <div className="mt-6 flex flex-col gap-6">

              <div>
                <h2 className="text-xl font-bold text-slate-800">Predictions</h2>
                <p className="text-sm text-slate-500">Create and review predictions by model, academic year, and program.</p>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Overall Prediction Trend ({data.model})</h3>
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

                <form onSubmit={handlePredict} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
                  <h3 className="mb-1 text-lg font-semibold text-slate-800">Prediction Engine</h3>
                  <p className="mb-6 text-sm text-slate-500">Filter views or run a new forecast.</p>

                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Algorithm Model</label>
                      <select value={data.model} onChange={(e) => handleFilterChange('model', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white">
                        {models.map((model) => <option key={model} value={model}>{model}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-700">Start Year</label>
                        <select value={data.year_start} onChange={handleStartYearChange} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white">
                          <option value="">Select</option>
                          {startYears.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-700">End Year</label>
                        <select value={data.year_end} onChange={(e) => handleFilterChange('year_end', e.target.value)} disabled={!data.year_start} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                          <option value="">Select</option>
                          {endYears.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Program</label>
                      <select value={data.program_id} onChange={(e) => handleFilterChange('program_id', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white">
                        <option value="">All Programs</option>
                        {programs.map((p) => <option key={p.program_id} value={String(p.program_id)}>{p.program_name}</option>)}
                      </select>
                    </div>

                    <button type="submit" disabled={processing || !data.year_start || !data.year_end} className="mt-4 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      {processing ? 'Processing...' : 'Generate New Forecast'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Prediction Results ({recentPredictions.length})
                  </h3>
                  <div className="inline-flex w-fit shrink-0 rounded-xl bg-slate-100 p-1">
                    {RECENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleRecentChange(opt.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          data.recent === opt.value
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recentPredictions.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                      No predictions {data.recent !== 'all' ? 'in this time range' : 'have been generated yet'}.
                    </div>
                  ) : (
                    recentPredictions.map((result) => (
                      <div
                        key={result.enrollment_batch_id}
                        className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <h4 className="mb-1 font-semibold text-slate-800 truncate" title={result.program_name}>
                          {result.program_name}
                        </h4>
                        <p className="mb-3 text-xs text-slate-400">
                          AY {result.academic_year} &middot; generated {new Date(result.generated_at).toLocaleString()}
                        </p>

                        <div className="mb-1 text-3xl font-bold text-slate-800">
                          {result.average.toLocaleString()}
                        </div>
                        <p className="mb-4 text-xs text-slate-500">
                          Average of models &middot; {result.average_male.toLocaleString()} M / {result.average_female.toLocaleString()} F
                        </p>

                        <button
                          type="button"
                          onClick={() => setDetailResult(result)}
                          className="mt-auto inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          View model breakdown
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* --- MODEL BREAKDOWN MODAL --- */}
              <Dialog open={detailResult !== null} onOpenChange={(open) => !open && setDetailResult(null)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{detailResult?.program_name} &middot; AY {detailResult?.academic_year}</DialogTitle>
                  </DialogHeader>
                  {detailResult && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase text-slate-500">
                            <th className="pb-2 pr-3">Model</th>
                            <th className="pb-2 pr-3">Total</th>
                            <th className="pb-2 pr-3">Male</th>
                            <th className="pb-2 pr-3">Female</th>
                            <th className="pb-2 pr-3">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailResult.breakdown.map((m) => (
                            <tr key={m.model} className="border-t border-slate-100">
                              <td className="py-2 pr-3 font-medium text-slate-700">{m.model}</td>
                              <td className="py-2 pr-3">{m.total.toLocaleString()}</td>
                              <td className="py-2 pr-3">{m.male.toLocaleString()}</td>
                              <td className="py-2 pr-3">{m.female.toLocaleString()}</td>
                              <td className="py-2 pr-3">{m.confidence}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </PublicLayout>
    </>
  );
}