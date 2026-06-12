import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface MetricConfig {
  label: string;
  unit: string;
  icon: LucideIcon;
  color: string;
  gradientId: string;
}

interface TelemetryChartProps {
  chartData: ChartPoint[];
  selectedMetric: string;
  metricConfig: MetricConfig;
  theme: 'light' | 'dark';
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  chartData,
  selectedMetric,
  metricConfig,
  theme
}) => {
  const values = chartData.map(d => d.value);
  const maxValue = Math.max(...values, 1) * 1.1; // 10% padding on top
  const minValue = Math.min(...values, 0) * 0.9;
  const valueRange = maxValue - minValue;

  const width = 800;
  const height = 280;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 50;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Convert data points to SVG X, Y coordinates
  const points = chartData.map((d, index) => {
    const x = paddingLeft + (index / (chartData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.value - minValue) / valueRange) * chartHeight;
    return { x, y, label: d.label, val: d.value };
  });

  // Build bezier line and area path
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY1 = points[i - 1].y;
      const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      const cpY2 = points[i].y;
      
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
    areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  return (
    <div className="relative w-full overflow-x-auto select-none pt-2">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full min-w-[700px] h-auto overflow-visible"
      >
        <defs>
          <linearGradient id={metricConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metricConfig.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={metricConfig.color} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = paddingTop + ratio * chartHeight;
          const gridValue = (maxValue - ratio * valueRange).toFixed(selectedMetric === 'vibration' ? 2 : 1);
          return (
            <g key={index} className="opacity-40 dark:opacity-20">
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeDasharray="4 6" 
                className="text-slate-300 dark:text-slate-800"
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 fill-current"
              >
                {gridValue} {metricConfig.unit}
              </text>
            </g>
          );
        })}

        {/* X Axis Timestamps */}
        {points.map((pt, index) => {
          // Dynamic interval to render approximately 8-12 labels max on the screen
          const labelInterval = Math.max(1, Math.ceil(points.length / 10));
          if (index % labelInterval !== 0 && index !== points.length - 1) return null;
          return (
            <text
              key={index}
              x={pt.x}
              y={height - 22}
              textAnchor="end"
              transform={`rotate(-25, ${pt.x}, ${height - 22})`}
              className="text-[8.5px] font-semibold text-slate-400 dark:text-slate-500 fill-current opacity-70"
            >
              {pt.label}
            </text>
          );
        })}

        {/* Shaded Area */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#${metricConfig.gradientId})`}
          />
        )}

        {/* Main Curved Vector Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={metricConfig.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />
        )}

        {/* Interactive Highlight Nodes */}
        {points.map((pt, index) => (
          <g key={index} className="group/node cursor-pointer">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill={metricConfig.color}
              stroke={theme === 'dark' ? '#0f172a' : '#ffffff'}
              strokeWidth="2"
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r="10"
              fill={metricConfig.color}
              className="opacity-0 group-hover/node:opacity-15 transition-opacity"
            />
            
            {/* Tooltip */}
            <g className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect
                x={pt.x - 45}
                y={pt.y - 42}
                width="90"
                height="32"
                rx="8"
                fill={theme === 'dark' ? '#1e293b' : '#0f172a'}
                className="shadow-2xl"
              />
              <text
                x={pt.x}
                y={pt.y - 28}
                textAnchor="middle"
                className="text-[9.5px] font-bold fill-white"
              >
                {pt.val} {metricConfig.unit}
              </text>
              <text
                x={pt.x}
                y={pt.y - 18}
                textAnchor="middle"
                className="text-[8px] font-medium fill-slate-400"
              >
                {pt.label}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};
