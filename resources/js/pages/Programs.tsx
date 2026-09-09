import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/PublicLayout';
import Sidebar from '@/components/dashboard/Sidebar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// --- Types ---
type ModelBreakdownItem = {
  model: string;
  total: number;
  male: number;
  female: number;
  confidence: number | null;
};

type ProgramYearlyData = {
  program_id: number;
  program_name: string;
  academic_year: string;
  average: number;
  average_male: number;
  average_female: number;
  has_predictions: boolean;
  breakdown: ModelBreakdownItem[];
  predictions: {
    LSTM: number;
    XGBoost: number;
    Ensemble: number;
  };
};

type Props = {
  programs?: ProgramYearlyData[];
};

export default function Programs({ programs = [] }: Props) {
  // --- Hydration Fix State ---
  const [isMounted, setIsMounted] = useState(false);
  const [detailProgram, setDetailProgram] = useState<ProgramYearlyData | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safePrograms = programs || [];

  // --- Calculate Institutional Totals for the Main Chart ---
  const mainChartData = [
    { name: 'LSTM', value: safePrograms.reduce((sum, p) => sum + p.predictions.LSTM, 0) },
    { name: 'XGBoost', value: safePrograms.reduce((sum, p) => sum + p.predictions.XGBoost, 0) },
    { name: 'Ensemble', value: safePrograms.reduce((sum, p) => sum + p.predictions.Ensemble, 0) },
  ];

  const targetAY = safePrograms.length > 0 ? safePrograms[0].academic_year : '2026-2027';

  const { props } = usePage<{ flash?: { success?: string } }>();

  // --- Import Setup ---
  const { data, setData, post, processing, errors, progress } = useForm({
    file: null as File | null,
  });

  const submitImport = (e: React.FormEvent) => {
    e.preventDefault();
    post('/programs/import-enrollments', {
      preserveScroll: true,
      onSuccess: () => {
        setData('file', null);
      },
    });
  };

  // Color coding for models
  const getBarColor = (name: string) => {
    switch (name) {
      case 'Ensemble': return '#10b981'; // Emerald 500
      case 'XGBoost': return '#f59e0b';  // Amber 500
      case 'LSTM': return '#3b82f6';     // Blue 500
      default: return '#94a3b8';
    }
  };

  return (
    <>
      <Head title="Programs Overview" />

      <PublicLayout>
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
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
                    Compare model forecasts for AY {targetAY}.
                  </p>
                </div>

                <Link
                  href="/programs/manage"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Manage Programs
                </Link>
              </div>

              {/* --- DATA IMPORT SECTION --- */}
              <div className="flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Import Historical Data
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Upload the CAS enrollment Excel workbook (one sheet per academic year) or a CSV file to feed the prediction models.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <form onSubmit={submitImport} className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-auto">
                      <input
                        key={data.file ? 'has-file' : 'empty'} 
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => setData('file', e.target.files ? e.target.files[0] : null)}
                        className="block w-full max-w-md text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition cursor-pointer"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={processing || !data.file}
                      className={`w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${processing || !data.file
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                      {processing ? 'Uploading...' : 'Upload File'}
                    </button>
                  </form>

                  {/* Progress & Messages */}
                  {progress && (
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                  )}
                  {props.flash?.success && (
                    <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 max-w-md">
                      {props.flash.success}
                    </div>
                  )}
                  {errors.file && (
                    <div className="text-sm text-red-600 font-medium">
                      {errors.file}
                    </div>
                  )}
                </div>
              </div>

              {/* --- MAIN CHART: INSTITUTIONAL AVERAGE --- */}
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        Total Institutional Prediction (AY {targetAY})
                      </h3>
                      <p className="text-sm text-slate-500">Sum of all programs compared across the 3 ML models.</p>
                    </div>
                  </div>

                  <div className="w-full h-[350px]">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <BarChart
                          data={mainChartData}
                          margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} tickLine={false} axisLine={false} dy={10} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={80}>
                            {mainChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* --- BOTTOM SECTION: INDIVIDUAL PROGRAM BREAKDOWN --- */}
              <div className="mt-4">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Breakdown by Program
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {safePrograms.length === 0 ? (
                     <div className="col-span-full py-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                        No programs found.
                     </div>
                  ) : (
                    safePrograms.map((program) => (
                      <div
                        key={program.program_id}
                        className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <h4
                          className="mb-1 font-semibold text-slate-800 truncate"
                          title={program.program_name}
                        >
                          {program.program_name}
                        </h4>
                        <p className="mb-4 text-xs text-slate-400">{program.academic_year}</p>

                        {program.has_predictions ? (
                          <>
                            <div className="mb-1 text-3xl font-bold text-slate-800">
                              {program.average.toLocaleString()}
                            </div>
                            <p className="mb-4 text-xs text-slate-500">
                              Average of models &middot; {program.average_male.toLocaleString()} M / {program.average_female.toLocaleString()} F
                            </p>
                            <button
                              type="button"
                              onClick={() => setDetailProgram(program)}
                              className="mt-auto inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              View model breakdown
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center text-sm text-slate-400">
                            No predictions generated yet.
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* --- MODEL BREAKDOWN MODAL --- */}
              <Dialog open={detailProgram !== null} onOpenChange={(open) => !open && setDetailProgram(null)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{detailProgram?.program_name}</DialogTitle>
                  </DialogHeader>
                  {detailProgram && (
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
                          {detailProgram.breakdown.map((m) => (
                            <tr key={m.model} className="border-t border-slate-100">
                              <td className="py-2 pr-3 font-medium text-slate-700">{m.model}</td>
                              <td className="py-2 pr-3">{m.confidence !== null ? m.total.toLocaleString() : '—'}</td>
                              <td className="py-2 pr-3">{m.confidence !== null ? m.male.toLocaleString() : '—'}</td>
                              <td className="py-2 pr-3">{m.confidence !== null ? m.female.toLocaleString() : '—'}</td>
                              <td className="py-2 pr-3">{m.confidence !== null ? `${m.confidence}%` : '—'}</td>
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

Programs.layout = (page: React.ReactNode) => <>{page}</>;