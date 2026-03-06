'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SourceData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

interface SourceEffectivenessProps {
  data: SourceData[];
}

export function SourceEffectiveness({ data }: SourceEffectivenessProps) {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6">
      <h3 className="text-lg font-semibold text-[#141042] mb-4">Efetividade por Origem</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {data.map((source, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-[#FAFAF8] rounded-lg">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: source.color }}
              />
              <span className="text-sm font-medium text-[#666666]">{source.name}</span>
            </div>
            <span className="text-sm font-bold text-[#141042]">{source.value} candidatos</span>
          </div>
        ))}
      </div>
    </div>
  );
}
