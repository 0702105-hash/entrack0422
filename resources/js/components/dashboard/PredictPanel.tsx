// resources/js/components/dashboard/PredictPanel.tsx
import React, { useState } from 'react';
import { router } from '@inertiajs/react';

type PredictPanelProps = {
  onSuccess: () => void;
};

const PredictPanel: React.FC<PredictPanelProps> = ({ onSuccess }) => {
  const [programId, setProgramId] = useState<string>('');
  const [model, setModel] = useState<string>('ensemble');
  const [yearStart, setYearStart] = useState<string>('');
  const [yearEnd, setYearEnd] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!programId || !yearStart || !yearEnd) {
      setError('Please fill in all fields');
      return;
    }

    if (parseInt(yearEnd) <= parseInt(yearStart)) {
      setError('End year must be greater than start year');
      return;
    }

    setLoading(true);

    try {
      // Submit the form using Inertia
      router.post('/predict', {
        program_id: programId,
        model: model,
        year_start: yearStart,
        year_end: yearEnd,
      }, {
        onSuccess: () => {
          setSuccess('Prediction generated successfully!');
          setProgramId('');
          setYearStart('');
          setYearEnd('');
          setModel('ensemble');
          // Callback to refresh dashboard
          onSuccess();
        },
        onError: (errors: any) => {
          setError(errors.prediction || 'Prediction failed!');
        },
        onFinish: () => {
          setLoading(false);
        },
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Run Enrollment Predictions</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Program ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Program ID</label>
            <input
              type="number"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              placeholder="e.g., 1"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ensemble">Ensemble</option>
              <option value="lstm">LSTM</option>
              <option value="xgboost">XGBoost</option>
            </select>
          </div>

          {/* Year Start */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Start Year</label>
            <input
              type="number"
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              placeholder="e.g., 2025"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Year End */}
          <div>
            <label className="block text-sm font-medium text-slate-700">End Year</label>
            <input
              type="number"
              value={yearEnd}
              onChange={(e) => setYearEnd(e.target.value)}
              placeholder="e.g., 2026"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? 'Predicting...' : 'Run Prediction'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PredictPanel;