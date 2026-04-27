import React from 'react'
import AppLayout from '@/layouts/app-layout'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import MetricCard from '@/components/dashboard/MetricCard'
import DonutResourcesChart from '@/components/dashboard/DonutResourcesChart'
import EnrollmentLineChart from '@/components/dashboard/EnrollmentLineChart'
import SideInfoCard from '@/components/dashboard/SideInfoCard'
import { Head } from '@inertiajs/react'

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
  summary,
  programDistribution,
  trendData,
}: DashboardProps) {
  return (
    <AppLayout>
      <Head title="Dashboard" />

      <div className="min-h-screen bg-sky-100 p-4 md:p-8">
        <div className="mx-auto flex w-full max-w-[1400px] gap-4 rounded-[32px] border border-white/50 bg-emerald-50/80 p-4 shadow-xl backdrop-blur md:gap-6 md:p-6">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <Topbar />

            <div className="mt-5 grid grid-cols-12 gap-4 md:gap-5">
              <section className="col-span-12 xl:col-span-7">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <MetricCard
                    title="Total Predicted"
                    value={summary.total_predicted}
                    change="+12%"
                    tone="amber"
                  />
                  <MetricCard
                    title="Predicted Male"
                    value={summary.total_male}
                    change="+8%"
                    tone="emerald"
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

              <section className="col-span-12 xl:col-span-5">
                <DonutResourcesChart data={programDistribution} />
              </section>

              <section className="col-span-12 xl:col-span-8">
                <EnrollmentLineChart data={trendData} />
              </section>

              <section className="col-span-12 xl:col-span-4">
                <div className="grid grid-cols-1 gap-4">
                  <SideInfoCard
                    title="Top Program"
                    value={
                      programDistribution.length
                        ? programDistribution[0].name
                        : 'N/A'
                    }
                    subValue={
                      programDistribution.length
                        ? `${programDistribution[0].value} students`
                        : 'No data'
                    }
                    accent="emerald"
                  />
                  <SideInfoCard
                    title="System Health"
                    value="Predictions Ready"
                    subValue={`${summary.avg_confidence}% confidence average`}
                    accent="sky"
                  />
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </AppLayout>
  )
}