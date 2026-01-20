'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FunnelData {
  stage: string;
  candidates: number;
  conversion: number;
}

interface RecruitmentFunnelProps {
  data: FunnelData[];
}

export function RecruitmentFunnel({ data }: RecruitmentFunnelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Funil de Recrutamento</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="candidates" fill="#1F4ED8" name="Candidatos" />
          <Bar dataKey="conversion" fill="#F97316" name="Taxa de Conversão %" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <p className="text-sm text-gray-600">{item.stage}</p>
            <p className="text-2xl font-bold text-gray-900">{item.candidates}</p>
            <p className="text-xs text-green-600">+{item.conversion}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
