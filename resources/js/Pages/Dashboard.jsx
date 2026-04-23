import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import StatCard from '@/Components/cards/StatCard';
import ProgramPredictionBarChart from '@/Components/charts/ProgramPredictionBarChart';

export default function Dashboard({ summary, chartData }) {
  const cards = [
    {
      title: 'Total Predicted Enrollment',
      value: summary.total_predicted ?? 0,
      subtitle: 'Next Academic Year',
      tone: 'blue',
    },
    {
      title: 'Predicted Male',
      value: summary.total_male ?? 0,
      subtitle: 'Next Academic Year',
      tone: 'indigo',
    },
    {
      title: 'Predicted Female',
      value: summary.total_female ?? 0,
      subtitle: 'Next Academic Year',
      tone: 'pink',
    },
    {
      title: 'Average Confidence',
      value: `${summary.avg_confidence ?? 0}%`,
      subtitle: 'Model confidence',
      tone: 'emerald',
    },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Enrollment Prediction Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Overview of projected enrollments for the upcoming academic year.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                tone={card.tone}
              />
            ))}
          </div>

          {/* Charts Section */}
          <div className="mt-8 grid grid-cols-1 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Predicted Enrollment by Program
                </h2>
                <p className="text-sm text-slate-500">
                  Program-level comparison for next academic year.
                </p>
              </div>

              <ProgramPredictionBarChart data={chartData ?? []} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}