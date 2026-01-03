'use client';

import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  title: string;
  data: PieChartData[];
  showLegend?: boolean;
  height?: number;
}

export default function PieChart({ title, data, showLegend = true, height = 300 }: PieChartProps) {
  // Filter out zero values and convert to recharts format
  const filteredData = data.filter(d => d.value > 0).map(d => ({
    name: d.label,
    value: d.value,
    color: d.color
  }));

  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const total = filteredData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPie>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} (${((Number(value) / total) * 100).toFixed(1)}%)`,
              String(name)
            ]}
          />
          {showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
            />
          )}
        </RechartsPie>
      </ResponsiveContainer>
      {/* Summary below chart */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center">
          {filteredData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">
                {item.name}: <strong className="text-gray-900">{item.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
