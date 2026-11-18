import { Head, router, usePage } from '@inertiajs/react'
import React from 'react'
import DonutResourcesChart from '@/components/dashboard/DonutResourcesChart'
import type { TrendItem } from '@/components/dashboard/EnrollmentLineChart';
import EnrollmentLineChart from '@/components/dashboard/EnrollmentLineChart'
import MetricCard from '@/components/dashboard/MetricCard'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import PublicLayout from '@/layouts/PublicLayout'

type Summary = {
  total_predicted: number
  total_male: number
  total_female: number
  avg_confidence: number
  batches_counted: number
}

type ProgramDistributionItem = {
  name: string
  value: number
}

type DashboardProps = {
  summary: Summary
  programDistribution: ProgramDistributionItem[]
  trendData: TrendItem[]
  period: string
}

export default function Dashboard({ summary, programDistribution, trendData, period }: DashboardProps) {
  const page = usePage()
  const flash = page.props.flash as any

  const handlePeriodChange = (newPeriod: string) => {
    router.get('/dashboard', { period: newPeriod }, { preserveState: true, preserveScroll: true, replace: true })
  }

  const forecastNote = summary.batches_counted === 0
    ? 'No forecasts in this period'
    : `Based on ${summary.batches_counted} forecast${summary.batches_counted === 1 ? '' : 's'}`

  return (
    <>
      <Head title="Dashboard" />
      <PublicLayout>
        <div className="flex min-h-screen flex-col gap-4 bg-[#f8fafc] p-4 sm:p-6 md:flex-row md:gap-6">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-7xl">
              <Topbar period={period} onPeriodChange={handlePeriodChange} />

              {/* Success Flash Message */}
              {flash?.success && (
                <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                  {flash.success}
                </div>
              )}

              {/* Metrics Grid */}
              <div className="mt-5 grid grid-cols-12 gap-4 md:gap-5">
                <section className="col-span-12 xl:col-span-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <MetricCard
                      title="Predicted Male"
                      value={summary.total_male.toLocaleString()}
                      footnote={forecastNote}
                      tone="emerald"
                    />

                    <MetricCard
                      title="Total Predicted"
                      value={summary.total_predicted.toLocaleString()}
                      footnote={forecastNote}
                      tone="amber"
                    />
                    <MetricCard
                      title="Predicted Female"
                      value={summary.total_female.toLocaleString()}
                      footnote={forecastNote}
                      tone="sky"
                    />

                    <MetricCard
                      title="Avg Confidence"
                      value={`${summary.avg_confidence}%`}
                      footnote={forecastNote}
                      tone="violet"
                    />
                  </div>
                </section>

                <section className="col-span-12 xl:col-span-6">
                  <DonutResourcesChart data={programDistribution} />
                </section>

                <section className="col-span-12 min-h-[380px] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                  <h3 className="mb-1 text-lg font-semibold text-slate-800">Enrollment Trend</h3>
                  <p className="mb-4 text-sm text-slate-500">Historical baseline vs. AI prediction (average of LSTM, XGBoost & Ensemble)</p>
                  <div className="h-[320px]">
                    <EnrollmentLineChart data={trendData} />
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </PublicLayout>
    </>
  )
}
