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
    // ---- Parse and transform the result into Dashboard shapes ----
    // result.predictions: array of program objects (your Python output)
    // We’ll do ENSEMBLE summary across all programs

    // 1. Metrics Summary
    let total_predicted = 0, total_male = 0, total_female = 0, confidences: number[] = []
    result.predictions?.forEach((program: any) => {
      const ensemble = program.ensemble;
      if (!ensemble || !ensemble.predictions) return;
      // sum up predicted for all predicted semesters in future year 1 for this program
      for (let i = 0; i < 3; ++i) {
        total_predicted += parseInt(ensemble.predictions[i] ?? 0);
      }
      // Estimate gender split using predicted_male/female if you have them (optionally use your backend logic for more accuracy)
      // For now, let's parse from the first prediction if present, otherwise estimate 50%
      if (ensemble.predicted_male && ensemble.predicted_female) {
        total_male += parseInt(ensemble.predicted_male[0]);
        total_female += parseInt(ensemble.predicted_female[0]);
      } else {
        // fallback estimate: 50/50 split
        total_male += Math.round(ensemble.predictions[0] * 0.5);
        total_female += Math.round(ensemble.predictions[0] * 0.5);
      }
      if (ensemble.metrics?.Confidence) {
        confidences.push(Number(ensemble.metrics.Confidence))
      }
    })
    setSummary({
      total_predicted,
      total_male,
      total_female,
      avg_confidence: Math.round((confidences.reduce((a, b) => a + b, 0) / (confidences.length || 1)) * 100)
    })

    // 2. Breakdown for DonutResourcesChart (programDistribution)
    const progDist = result.predictions?.map((program: any) => ({
      name: program.program_name || ("Program " + program.program_id),
      value: program.ensemble?.predictions?.[0] ?? 0     // First semester, first year only
    })) || []
    setProgramDistribution(progDist)

    // 3. EnrollmentLineChart data (trendData)
    const trend: TrendItem[] = []
    result.predictions?.forEach((program: any) => {
      const programName = program.program_name || ("Program " + program.program_id)
      // Baseline and predicted, for each semester in future year 1
      ;(program.ensemble?.predictions || []).slice(0, 3).forEach((pred: any, i: number) => {
        trend.push({
          period: `${programName} ${["First", "Second", "Summer"][i]}`,
          predicted: Number(pred),
          baseline: 0  // Set if you have actual historical baselines
        })
      })
    })
    setTrendData(trend)
  }

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