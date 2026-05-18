import React, { useMemo } from 'react';
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

const getAbbreviation = (fullName: string) => {
  const upperName = fullName.toUpperCase().trim();
  return PROGRAM_ABBREVIATIONS[upperName] || fullName;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: payload[0].color }}
          ></div>
          <p className="font-semibold text-slate-800">{data.shortName}</p>
        </div>
        <p className="ml-5 text-sm text-slate-600">
          {data.value} Predicted <span className="text-slate-400">({(data.percent * 100).toFixed(1)}%)</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DonutResourcesChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      ...item,
      shortName: getAbbreviation(item.name),
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-full w-full min-h-[300px] items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-gray-400">No program data available</p>
      </div>
    );
  }

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
              cx="35%" // Shifted left to make room for the legend on the right
              cy="50%" 
              innerRadius={70} 
              outerRadius={100} 
              paddingAngle={2}
              dataKey="value"
              nameKey="shortName"
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
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}