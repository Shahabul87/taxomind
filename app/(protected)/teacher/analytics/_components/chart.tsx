"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

interface ChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

// Lazy-load the recharts-dependent chart content to reduce initial bundle size.
// Recharts components must be rendered together, so we wrap the entire chart
// section in a single dynamic import rather than importing individual components.
const ChartContent = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } = mod;

      function ChartContentInner({ data }: ChartProps) {
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      return { default: ChartContentInner };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading chart...</span>
      </div>
    ),
  }
);

export const Chart = ({ data }: ChartProps) => {
  return (
    <Card className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md p-2">
      <ChartContent data={data} />
    </Card>
  );
};
