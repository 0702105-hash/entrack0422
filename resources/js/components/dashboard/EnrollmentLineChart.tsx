import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type TrendItem = {
  period: string;
  predicted: number;
  baseline: number;
};

type Props = {
  data: TrendItem[];
};

export default function EnrollmentLineChart({ data }: Props) {
  // Graceful fallback
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm min-h-[350px]">
        <p className="text-gray-400">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-800">
        Enrollment Trend (Baseline vs Predicted)
      </h3>
      
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            
            <XAxis 
              dataKey="period" 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false}
              dx={-10}
            />
            
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            <Legend 
              verticalAlign="top" 
              height={40} 
              iconType="circle"
              wrapperStyle={{ fontSize: '13px', paddingBottom: '10px' }}
            />
            
            {/* Baseline Line */}
            <Line
              type="monotone"
              dataKey="baseline"
              name="Historical Baseline"
              stroke="#9ca3af" // Gray
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            
            {/* Predicted Line */}
            <Line
              type="monotone"
              dataKey="predicted"
              name="AI Prediction"
              stroke="#0284c7" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: '#0284c7', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}