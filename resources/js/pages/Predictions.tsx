import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import PublicLayout from '@/layouts/PublicLayout';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
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
  academic_year: string; // or number
  trend: TrendItem[];
};

type ProgramOption = {
  program_id: number;
  program_name: string;
};

type Props = {
  filters: {
    model: string;
    academicYear: string;
    programId: string;
  };
  models: string[];
  academicYears: string[];
  programs: ProgramOption[];
  mainTrend: TrendItem[];
  predictionTrends: PredictionData[];
};

export default function Predictions({
  filters,
  models,
  academicYears,
  programs,
  mainTrend,
  predictionTrends,
}: Props) {
  // State for the control panel
  const [selectedModel, setSelectedModel] = useState(filters.model || 'Ensemble');
  const [selectedAY, setSelectedAY] = useState(filters.academicYear || academicYears?.[0] || '');
  const [selectedProgramId, setSelectedProgramId] = useState(filters.programId || '');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Predict Button Click (Inertia visit to reload data with new filters)
  const handlePredict = () => {
    setIsLoading(true);
    router.get(
      '/predictions',
      { model: selectedModel, academicYear: selectedAY, programId: selectedProgramId },
      {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setIsLoading(false),
      }
    );
  };

  return (
    <>
      <Head title="Predictions Overview" />

      <PublicLayout>
        <div className="flex gap-4 md:gap-6">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <div className="mt-6 flex flex-col gap-6">
              {/* --- HEADER --- */}
              <div>
                <h2 className="text-xl font-bold text-slate-800">Predictions</h2>
                <p className="text-sm text-slate-500">
                  Create and review predictions by model, academic year, and program.
                </p>
              </div>

              {/* --- TOP SECTION: Main Chart + Controls --- */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                {/* Main Aggregated Chart */}
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Overall Prediction Trend ({selectedModel})
                    </h3>
                  </div>

                  <div className="flex-1 min-h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mainTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
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
                  </div>
                </div>

                {/* Control Panel */}
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
                  <h3 className="mb-1 text-lg font-semibold text-slate-800">Prediction Engine</h3>
                  <p className="mb-6 text-sm text-slate-500">Set parameters for the forecast run.</p>

                  <div className="flex flex-col gap-5">
                    {/* Model */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Algorithm Model</label>
                      <div className="relative">
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        >
                          {models.map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Academic Year</label>
                      <div className="relative">
                        <select
                          value={selectedAY}
                          onChange={(e) => setSelectedAY(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        >
                          {academicYears.map((ay) => (
                            <option key={ay} value={ay}>{ay}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Program */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Program</label>
                      <div className="relative">
                        <select
                          value={selectedProgramId}
                          onChange={(e) => setSelectedProgramId(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        >
                          <option value="">All Programs</option>
                          {programs.map((p) => (
                            <option key={p.program_id} value={String(p.program_id)}>
                              {p.program_name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex-1"></div>

                    {/* Predict Action Button */}
                    <button
                      onClick={handlePredict}
                      disabled={isLoading}
                      className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Generate Prediction'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* --- BOTTOM SECTION: Prediction Cards --- */}
              <div className="mt-4">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">Prediction Results</h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {predictionTrends.map((pred) => (
                    <div key={pred.prediction_id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-2">
                        <h4 className="font-semibold text-slate-800 truncate" title={pred.program_name}>
                          {pred.program_name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {pred.model} • AY {pred.academic_year}
                        </p>
                      </div>

                      <div className="flex-1 min-h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={pred.trend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
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
                  ))}
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