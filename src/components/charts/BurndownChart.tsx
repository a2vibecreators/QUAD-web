'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface BurndownPoint {
  date: string;
  ideal: number;
  actual: number | null;
  completed: number;
}

interface BurndownChartProps {
  title: string;
  data: BurndownPoint[];
  height?: number;
  metric?: string;
}

export default function BurndownChart({ title, data, height = 350, metric = 'points' }: BurndownChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No burndown data available
        </div>
      </div>
    );
  }

  // Find today's position
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = data.findIndex(d => d.date === today);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={{
              value: metric === 'points' ? 'Story Points' : 'Tickets',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#6B7280' }
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            formatter={(value, name) => {
              if (value === null || value === undefined) return ['No data', String(name)];
              return [Number(value).toFixed(1), String(name)];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />

          {/* Ideal burndown line (dashed) */}
          <Line
            type="monotone"
            dataKey="ideal"
            name="Ideal"
            stroke="#9CA3AF"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
          />

          {/* Actual burndown line */}
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual Remaining"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2 }}
            activeDot={{ r: 8 }}
            connectNulls={false}
          />

          {/* Today reference line */}
          {todayIndex >= 0 && (
            <ReferenceLine
              x={today}
              stroke="#EF4444"
              strokeDasharray="3 3"
              label={{
                value: 'Today',
                position: 'top',
                fill: '#EF4444',
                fontSize: 12
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-6 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-400" style={{ borderTop: '2px dashed #9CA3AF' }} />
          <span className="text-gray-600">Ideal Burndown</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-blue-500" />
          <span className="text-gray-600">Actual Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0 border-t-2 border-red-500 border-dashed" />
          <span className="text-gray-600">Today</span>
        </div>
      </div>
    </div>
  );
}
