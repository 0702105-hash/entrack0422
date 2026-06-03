import React, { useState } from 'react'
import { Head } from '@inertiajs/react'
import PublicLayout from '@/layouts/PublicLayout'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import MetricCard from '@/components/dashboard/MetricCard'
import DonutResourcesChart from '@/components/dashboard/DonutResourcesChart'
import EnrollmentLineChart from '@/components/dashboard/EnrollmentLineChart'
import PredictPanel from '@/components/dashboard/PredictPanel'

type Summary = {
  total_predicted: number
  total_male: number
  total_female: number
  avg_confidence: number
}

type ProgramDistributionItem = {
  name: string
  value: number
}

type TrendItem = {
  period: string
  predicted: number
  baseline: number
}

type DashboardProps = {
  summary: Summary
  programDistribution: ProgramDistributionItem[]
  trendData: TrendItem[]
}

export default function Dashboard({
  summary: initialSummary,
  programDistribution: initialProgramDistribution,
  trendData: initialTrendData,
}: DashboardProps) {
  // State for live front-end update
  const [summary, setSummary] = useState(initialSummary)
  const [programDistribution, setProgramDistribution] = useState(initialProgramDistribution)
  const [trendData, setTrendData] = useState(initialTrendData)

  const handlePredictResults = (result: any) => {
    if (!result || !Array.isArray(result.predictions)) return;

    let total_predicted = 0;
    let total_male = 0;
    let total_female = 0;
    let confidences: number[] = [];

    // For Donut chart: total for each program for the first semester, future year 1
    const progDist: ProgramDistributionItem[] = [];
    // For trend chart: all programs, all 3 semesters
    const trend: TrendItem[] = [];

    result.predictions.forEach((program: any) => {
      const ensemble = program.ensemble;
      if (!ensemble || !ensemble.predictions) return;
      // Sum across all three semesters in first predicted year
      for (let i = 0; i < 3; ++i) {
        const semesterPred = Number(ensemble.predictions[i] ?? 0);
        total_predicted += semesterPred;

        // Gender-specific sums if available as arrays (Python script may output arrays for male/female prediction!)
        if (Array.isArray(ensemble.predicted_male) && Array.isArray(ensemble.predicted_female)) {
          total_male += Number(ensemble.predicted_male[i] ?? 0);
          total_female += Number(ensemble.predicted_female[i] ?? 0);
        }
      }
      // Donut = just FIRST semester for each program
      progDist.push({
        name: program.program_name || ("Program " + program.program_id),
        value: Number(ensemble.predictions[0] ?? 0),
      });

      // Confidence
      const conf = Number(ensemble.metrics?.Confidence ?? ensemble.metrics?.confidence ?? 0);
      if (conf) confidences.push(conf);

      // Trend chart: for this program, all three future semesters
      (ensemble.predictions || []).slice(0, 3).forEach((pred: any, i: number) => {
        trend.push({
          period: `${program.program_name || program.program_id} ${["First", "Second", "Summer"][i]}`,
          predicted: Number(pred),
          baseline: 0
        });
      });
    });

    // If NO gender-specific info at all, estimate from totals (fallback!)
    if (total_male === 0 && total_female === 0 && total_predicted > 0) {
      total_male = Math.round(total_predicted * 0.5);
      total_female = total_predicted - total_male;
    }

    setSummary({
      total_predicted,
      total_male,
      total_female,
      avg_confidence: confidences.length ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100) : 0
    });

    setProgramDistribution(progDist);
    setTrendData(trend);
  };

  return (
    <>
      <Head title="Dashboard" />

      <PublicLayout>
        <div className="flex gap-4 md:gap-6">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <Topbar />

            <PredictPanel onSuccess={handlePredictResults} />

            <div className="mt-5 grid grid-cols-12 gap-4 md:gap-5">
              <section className="col-span-10 xl:col-span-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <MetricCard
                    title="Predicted Male"
                    value={summary.total_male}
                    change="+8%"
                    tone="emerald"
                  />

                  <MetricCard
                    title="Total Predicted"
                    value={summary.total_predicted}
                    change="+12%"
                    tone="amber"
                  />
                  <MetricCard
                    title="Predicted Female"
                    value={summary.total_female}
                    change="+10%"
                    tone="sky"
                  />

                  <MetricCard
                    title="Avg Confidence"
                    value={`${summary.avg_confidence}%`}
                    change="+2.1%"
                    tone="violet"
                  />
                </div>
              </section>

              <section className="col-span-12 xl:col-span-6">
                <DonutResourcesChart data={programDistribution} />
              </section>
              <section className="col-span-12 xl">
                <EnrollmentLineChart data={trendData} />
              </section>

            </div>
          </main>
        </div>
      </PublicLayout>
    </>
  )
}