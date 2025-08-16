import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

interface ProgressData {
  name: string;
  completed: number;
  total: number;
}

interface ProgressChartProps {
  data?: ProgressData[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  // Sample data if no data is provided
  const defaultData: ProgressData[] = [
    {
      name: "Week 1",
      completed: 4,
      total: 5,
    },
    {
      name: "Week 2",
      completed: 3,
      total: 5,
    },
    {
      name: "Week 3",
      completed: 5,
      total: 5,
    },
    {
      name: "Week 4",
      completed: 2,
      total: 5,
    },
  ];

  const chartData = data || defaultData;

  // Calculate completion percentage for each item
  const processedData = chartData.map((item) => ({
    ...item,
    percentage: Math.round((item.completed / item.total) * 100),
  }));

  const CustomTooltip = ({
    active,
    payload,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.completed} of {data.total} completed
          </p>
          <p className="text-sm font-medium text-blue-500">
            {data.percentage}% complete
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Learning Progress
        </h3>
      </div>
      <div className="p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="percentage"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Completion"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Overall Progress
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(
                (processedData.reduce((acc, curr) => acc + curr.completed, 0) /
                  processedData.reduce((acc, curr) => acc + curr.total, 0)) *
                  100
              )}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Items Completed
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {processedData.reduce((acc, curr) => acc + curr.completed, 0)} /{" "}
              {processedData.reduce((acc, curr) => acc + curr.total, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 