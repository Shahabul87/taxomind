"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// Elegant color palette for charts
export const ELEGANT_PALETTE = {
  primary: "#8b5cf6", // Purple
  secondary: "#3b82f6", // Blue
  tertiary: "#10b981", // Green
  accent1: "#f472b6", // Pink
  accent2: "#f59e0b", // Orange
  background: "#1e293b", // Slate-800
  text: "#cbd5e1", // Slate-300
  grid: "#475569", // Slate-600
  tooltip: "rgba(15, 23, 42, 0.7)", // Slate-900 with opacity
};

// Gradient pairs for fancy visualizations
export const GRADIENT_PAIRS = [
  ["#8b5cf6", "#c4b5fd"], // Purple gradient
  ["#3b82f6", "#93c5fd"], // Blue gradient
  ["#10b981", "#6ee7b7"], // Green gradient
  ["#f472b6", "#f9a8d4"], // Pink gradient
  ["#f59e0b", "#fcd34d"], // Amber gradient
];

// Define interfaces for chart component props
interface ChartDataPoint {
  [key: string]: any;
}

interface LineChartProps {
  data: ChartDataPoint[];
  xDataKey?: string;
  lineDataKey?: string;
  color?: string;
  [key: string]: any;
}

interface AreaChartProps {
  data: ChartDataPoint[];
  xDataKey?: string;
  areaDataKey?: string;
  color?: string;
  [key: string]: any;
}

interface BarChartProps {
  data: ChartDataPoint[];
  xDataKey?: string;
  barDataKey?: string;
  color?: string;
  [key: string]: any;
}

interface PieChartProps {
  data: ChartDataPoint[];
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  [key: string]: any;
}

// LineChart wrapper
export function ClientLineChart({ 
  data, 
  xDataKey = "name", 
  lineDataKey = "value", 
  color = ELEGANT_PALETTE.primary,
  ...props 
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        {...props}
      >
        <defs>
          <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={ELEGANT_PALETTE.grid} />
        <XAxis 
          dataKey={xDataKey} 
          stroke={ELEGANT_PALETTE.text} 
          tick={{ fill: ELEGANT_PALETTE.text }} 
        />
        <YAxis 
          stroke={ELEGANT_PALETTE.text} 
          tick={{ fill: ELEGANT_PALETTE.text }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "rgba(15, 23, 42, 0.9)", 
            borderColor: color,
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }} 
          labelStyle={{ color: "white" }}
          itemStyle={{ color: ELEGANT_PALETTE.text }}
        />
        <Legend wrapperStyle={{ color: ELEGANT_PALETTE.text }} />
        <Line 
          type="monotone" 
          dataKey={lineDataKey} 
          stroke={color} 
          strokeWidth={2}
          activeDot={{ r: 8, fill: color, stroke: "white" }} 
          dot={{ r: 4, fill: color, stroke: "white", strokeWidth: 1 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// AreaChart variation for more elegant visualization
export function ClientAreaChart({ 
  data, 
  xDataKey = "name", 
  areaDataKey = "value", 
  color = ELEGANT_PALETTE.primary,
  ...props 
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        {...props}
      >
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={ELEGANT_PALETTE.grid} />
        <XAxis 
          dataKey={xDataKey} 
          stroke={ELEGANT_PALETTE.text} 
          tick={{ fill: ELEGANT_PALETTE.text }} 
        />
        <YAxis 
          stroke={ELEGANT_PALETTE.text} 
          tick={{ fill: ELEGANT_PALETTE.text }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "rgba(15, 23, 42, 0.9)", 
            borderColor: color,
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }} 
          labelStyle={{ color: "white" }}
          itemStyle={{ color: ELEGANT_PALETTE.text }}
        />
        <Legend wrapperStyle={{ color: ELEGANT_PALETTE.text }} />
        <Area 
          type="monotone" 
          dataKey={areaDataKey} 
          stroke={color} 
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorGradient)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// BarChart wrapper
export function ClientBarChart({ 
  data, 
  xDataKey = "name", 
  barDataKey = "value", 
  color = ELEGANT_PALETTE.secondary,
  ...props 
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        {...props}
      >
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.4}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={ELEGANT_PALETTE.grid} />
        <XAxis 
          dataKey={xDataKey} 
          stroke={ELEGANT_PALETTE.text} 
          tick={{ fill: ELEGANT_PALETTE.text }} 
        />
        <YAxis 
          stroke={ELEGANT_PALETTE.text} 
          tick={{ fill: ELEGANT_PALETTE.text }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "rgba(15, 23, 42, 0.9)", 
            borderColor: color,
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }} 
          labelStyle={{ color: "white" }}
          itemStyle={{ color: ELEGANT_PALETTE.text }}
        />
        <Legend wrapperStyle={{ color: ELEGANT_PALETTE.text }} />
        <Bar 
          dataKey={barDataKey} 
          fill="url(#barGradient)" 
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// PieChart wrapper
export function ClientPieChart({ 
  data, 
  dataKey = "value", 
  nameKey = "name", 
  colors = [
    ELEGANT_PALETTE.primary, 
    ELEGANT_PALETTE.secondary, 
    ELEGANT_PALETTE.tertiary, 
    ELEGANT_PALETTE.accent1, 
    ELEGANT_PALETTE.accent2
  ],
  ...props 
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart {...props}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          paddingAngle={3}
          strokeWidth={1}
          stroke="rgba(15, 23, 42, 0.2)"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "rgba(15, 23, 42, 0.9)", 
            borderColor: ELEGANT_PALETTE.primary,
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }} 
          labelStyle={{ color: "white" }}
          itemStyle={{ color: ELEGANT_PALETTE.text }}
        />
        <Legend 
          wrapperStyle={{ color: ELEGANT_PALETTE.text }} 
          iconType="circle"
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
        />
      </PieChart>
    </ResponsiveContainer>
  );
} 