import React from 'react'
import { Head, router, usePage } from '@inertiajs/react'
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
  predicted: number | null
  baseline: number | null
}

type DashboardProps = {
  summary: Summary
  programDistribution: ProgramDistributionItem[]
  trendData: TrendItem[]
}

export default function Dashboard(props: DashboardProps) {
  const { summary, programDistribution, trendData } = props
  const page = usePage()
  const flash = page.props.flash as any

  // Handle prediction success - reload dashboard data
  const handlePredictSuccess = () => {
    router.reload({ only: ['summary', 'programDistribution', 'trendData'] })
  }

  return (
    <>
      <Head title="Dashboard" />
      <PublicLayout>
        <div className="flex min-h-screen bg-[#f8fafc]">
          <Sidebar />

          <main className="flex-1 p-6 transition-all md:ml-64">
            <div className="mx-auto max-w-7xl">
              <Topbar />

              {/* Success Flash Message */}
              {flash?.success && (
                <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                  {flash.success}
                </div>
              )}

              {/* Predict Panel */}
              <div className="mt-6">
                <PredictPanel onSuccess={handlePredictSuccess} />
              </div>

              {/* Metrics Grid */}
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

                <section className="col-span-12">
                  <EnrollmentLineChart data={trendData} />
                </section>
              </div>
            </div>
          </main>
        </div>
      </PublicLayout>
    </>
  )
}
