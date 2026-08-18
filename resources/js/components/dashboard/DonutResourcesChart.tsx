import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

type ProgramDistributionItem = {
  name: string;
  value: number;
};

type Props = {
  data: ProgramDistributionItem[];
};

const COLORS = [
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
];

const PROGRAM_ABBREVIATIONS: Record<string, string> = {
  'BACHELOR OF ARTS IN COMMUNICATION': 'BA Comm',
  'BACHELOR OF ARTS IN ENGLISH LANGUAGE': 'BA English',
  'BACHELOR OF ARTS IN POLITICAL SCIENCE': 'BA PolSci',
  'BACHELOR OF LIBRARY AND INFORMATION SCIENCE': 'BLIS',
  'BACHELOR OF MUSIC IN MUSIC EDUCATION': 'BM Music',
  'BACHELOR OF SCIENCE IN BIOLOGY': 'BS Bio',
  'BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY': 'BSIT',
  'BACHELOR OF SCIENCE IN SOCIAL WORK': 'BS Social Work',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-lg">
        <p className="font-semibold text-slate-800">{payload[0].name}</p>
        <p className="text-sm text-slate-600">
          Predicted Students: <span className="font-bold text-sky-600">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DonutResourcesChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-gray-400">No program data available</p>
      </div>
    );
  }

  // Format the names so they fit nicely in the legend
  const chartData = data.map(item => ({
    ...item,
    formattedName: PROGRAM_ABBREVIATIONS[item.name.toUpperCase()] || item.name
  }));

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-800">
        Program Distribution
      </h3>
      
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="35%"
              cy="50%" 
              innerRadius={70} 
              outerRadius={100} 
              paddingAngle={2}
              dataKey="value"
              nameKey="formattedName" /* FIX: Properly mapped to formatted name */
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              layout="vertical"
              verticalAlign="middle" 
              align="right"
              wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}