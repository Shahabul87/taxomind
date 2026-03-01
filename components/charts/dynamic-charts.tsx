"use client";

import dynamic from "next/dynamic";

// Dynamic recharts imports - only loaded when chart components mount
// This prevents recharts (200KB+) from being included in the initial JS bundle

export const DynamicLineChart = dynamic(
  () => import("recharts").then((m) => m.LineChart),
  { ssr: false }
);

export const DynamicBarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);

export const DynamicAreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false }
);

export const DynamicPieChart = dynamic(
  () => import("recharts").then((m) => m.PieChart),
  { ssr: false }
);

export const DynamicRadarChart = dynamic(
  () => import("recharts").then((m) => m.RadarChart),
  { ssr: false }
);

export const DynamicResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);

// Re-export non-component items that don't need dynamic loading
// These are lightweight and used as children of chart components
export {
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
