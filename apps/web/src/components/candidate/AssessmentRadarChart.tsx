'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

interface RadarDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

interface AssessmentRadarChartProps {
  data: RadarDataPoint[];
  title: string;
  accentColor: string;
  showPercent?: boolean;
}

export default function AssessmentRadarChart({
  data,
  title,
  accentColor,
  showPercent = true,
}: AssessmentRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid stroke="#E5E5DC" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#555', fontSize: 11 }}
        />
        <Radar
          name={title}
          dataKey="A"
          stroke={accentColor}
          fill={accentColor}
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <RechartsTooltip
          formatter={(v: unknown) => [`${v}${showPercent ? '%' : ''}`, 'Score']}
          contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E5E5DC' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
