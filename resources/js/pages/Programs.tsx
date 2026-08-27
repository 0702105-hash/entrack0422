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

// --- Types ---
type ProgramYearlyData = {
  program_id: number;
  program_name: string;
  academic_year: string;
  predictions: {
    Prophet: number;
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safePrograms = programs || [];

  // --- Calculate Institutional Totals for the Main Chart ---
  const mainChartData = [
    { name: 'Prophet', value: safePrograms.reduce((sum, p) => sum + p.predictions.Prophet, 0) },
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
      case 'Prophet': return '#94a3b8';  // Slate 400
      default: return '#94a3b8';
    }
  };

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
                      <p className="text-sm text-slate-500">Sum of all programs compared across the 4 ML models.</p>
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

              {/* --- BOTTOM SECTION: INDIVIDUAL PROGRAM CHARTS --- */}
              <div className="mt-4">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Breakdown by Program
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {safePrograms.length === 0 ? (
                     <div className="col-span-full py-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                        No predictions generated yet.
                     </div>
                  ) : (
                    safePrograms.map((program) => {
                      // Format data for the mini chart
                      const progData = [
                        { name: 'Prophet', value: program.predictions.Prophet },
                        { name: 'LSTM', value: program.predictions.LSTM },
                        { name: 'XGBoost', value: program.predictions.XGBoost },
                        { name: 'Ensemble', value: program.predictions.Ensemble },
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

                          <div className="w-full h-[220px]">
                            {isMounted && (
                              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                                <BarChart data={progData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                                  <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '4px 8px' }} 
                                  />
                                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                                    {progData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      );
                    })
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

Programs.layout = (page: React.ReactNode) => <>{page}</>;