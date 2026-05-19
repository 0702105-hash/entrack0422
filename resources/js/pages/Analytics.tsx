import React from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/PublicLayout';
import Sidebar from '@/components/dashboard/Sidebar';

// --- Types ---
type ModelMetric = {
    model_name: string;
    mae: number | null;
    rmse: number | null;
    mape: number | null;
    r2: number | null;
    rmsle: number | null;
    theil_u: number | null;
};

type PredictionMetrics = {
    prediction_id: number;
    program_name: string;
    academic_year_start?: string;
    academic_year_end?: string;
    academic_year?: string;
    metrics: ModelMetric[];
};

type Props = {
    averageMetrics: ModelMetric[]; // average per model
    predictionMetrics: PredictionMetrics[]; // per prediction
};



const formatMetric = (value: number | string | null, digits = 4) => {
    if (value === null || value === undefined || value === '') return '—';
    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) return '—';
    return num.toFixed(digits);
};

export default function Analytics({ averageMetrics, predictionMetrics }: Props) {
    const hasAverages = Array.isArray(averageMetrics) && averageMetrics.length > 0;
    const hasPredictions = Array.isArray(predictionMetrics) && predictionMetrics.length > 0;
    const groupedPredictions = React.useMemo(() => {
        const map = new Map<string, PredictionMetrics>();

        predictionMetrics.forEach((pred) => {
            const start = pred.academic_year_start ?? pred.academic_year ?? '';
            const end = pred.academic_year_end ?? pred.academic_year ?? '';
            const key = `${pred.program_name}__${start}__${end}`;

            if (!map.has(key)) {
                map.set(key, {
                    prediction_id: pred.prediction_id,
                    program_name: pred.program_name,
                    academic_year_start: start,
                    academic_year_end: end,
                    metrics: [...pred.metrics],
                });
            } else {
                const existing = map.get(key)!;

                // merge metrics; keep latest per model_name
                const merged = new Map<string, ModelMetric>();
                existing.metrics.forEach((m) => merged.set(m.model_name, m));
                pred.metrics.forEach((m) => merged.set(m.model_name, m));

                existing.metrics = Array.from(merged.values());
            }
        });

        return Array.from(map.values());
    }, [predictionMetrics]);

    return (
        <>
            <Head title="Analytics" />

            <PublicLayout>
                <div className="flex gap-4 md:gap-6">
                    <Sidebar />

                    <main className="min-w-0 flex-1">
                        <div className="mt-6 flex flex-col gap-6">
                            {/* --- HEADER --- */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Analytics</h2>
                                <p className="text-sm text-slate-500">
                                    Evaluation metrics for all models and predictions.
                                </p>
                            </div>

                            {/* --- TOP SECTION: AVERAGE METRICS --- */}
                            <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800">
                                            Average Metrics (per Model)
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Lower is better for MAE/RMSE/MAPE/RMSLE/Theil‑U, higher is better for R².
                                        </p>
                                    </div>

                                    {hasAverages ? (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                            {averageMetrics.map((m) => (
                                                <div
                                                    key={m.model_name}
                                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                                >
                                                    <h4 className="mb-3 text-sm font-semibold text-slate-700">
                                                        {m.model_name}
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                        <div>MAE: <span className="font-medium text-slate-800">{formatMetric(m.mae)}</span></div>
                                                        <div>RMSE: <span className="font-medium text-slate-800">{formatMetric(m.rmse)}</span></div>
                                                        <div>MAPE: <span className="font-medium text-slate-800">{formatMetric(m.mape)}</span></div>
                                                        <div>R²: <span className="font-medium text-slate-800">{formatMetric(m.r2)}</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                                            No average metrics available.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- BOTTOM SECTION: PER PREDICTION --- */}
                            <div className="mt-2">
                                <h3 className="mb-4 text-lg font-semibold text-slate-800">Metrics by Prediction</h3>

                                {hasPredictions ? (
                                    <div className="grid grid-cols-1 gap-6">
                                        {groupedPredictions.map((pred) => (
                                            <div
                                                key={pred.prediction_id}
                                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                            >
                                                <div className="mb-4 flex flex-col gap-1">
                                                    <h4 className="text-base font-semibold text-slate-800">
                                                        {pred.program_name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500">
                                                        Prediction #{pred.prediction_id} • AY{' '}
                                                        {pred.academic_year_start ?? pred.academic_year} -{' '}
                                                        {pred.academic_year_end ?? pred.academic_year}
                                                    </p>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse text-sm">
                                                        <thead>
                                                            <tr className="text-left text-xs uppercase text-slate-500">
                                                                <th className="pb-2 pr-3">Model</th>
                                                                <th className="pb-2 pr-3">MAE</th>
                                                                <th className="pb-2 pr-3">RMSE</th>
                                                                <th className="pb-2 pr-3">MAPE</th>
                                                                <th className="pb-2 pr-3">R²</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pred.metrics.map((m) => (
                                                                <tr key={m.model_name} className="border-t border-slate-100">
                                                                    <td className="py-2 pr-3 font-medium text-slate-700">{m.model_name}</td>
                                                                    <td className="py-2 pr-3">{formatMetric(m.mae)}</td>
                                                                    <td className="py-2 pr-3">{formatMetric(m.rmse)}</td>
                                                                    <td className="py-2 pr-3">{formatMetric(m.mape)}</td>
                                                                    <td className="py-2 pr-3">{formatMetric(m.r2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
                                        No prediction metrics available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </PublicLayout>
        </>
    );
}

Analytics.layout = (page: React.ReactNode) => <>{page}</>;