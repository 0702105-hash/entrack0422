import React, { useState } from 'react'
import { Head, router } from '@inertiajs/react' // <-- Added router
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
  summary,
  programDistribution,
  trendData,
}: DashboardProps) {

  // FIX: When PredictPanel finishes, tell Inertia to fetch fresh data from the DB
  const handlePredictResults = () => {
    router.reload({ only: ['summary', 'programDistribution', 'trendData'] });
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

              {/* Predict Panel Trigger */}
              <div className="mt-6">
                <PredictPanel onSuccess={handlePredictResults} />
              </div>

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
            </div>
          </main>
        </div>
      </PublicLayout>
    </>
  )
}