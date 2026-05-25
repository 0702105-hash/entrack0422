// resources/js/components/dashboard/PredictPanel.tsx
import React, { useState } from 'react';
import axios from 'axios';

type PredictPanelProps = {
  onSuccess: (result: any) => void
}

const PredictPanel: React.FC<PredictPanelProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File|null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string|null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV/XLSX file.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('data', file);

    try {
      const res = await axios.post('/predict', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      setResult(res.data);
      onSuccess(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Prediction failed!");
    }
    setLoading(false);
  };

  return (
    <div style={{padding:24, background:"#f7f7f7", borderRadius:10, marginBottom:24}}>
      <h2>Run Enrollment Predictions</h2>
      <form onSubmit={handleSubmit} style={{display:'flex', alignItems:'center', gap:16}}>
        <input type="file" accept=".csv,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button type="submit" disabled={loading}>Predict</button>
      </form>
      {loading && <p>Processing...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
    </div>
  );
};

export default PredictPanel;