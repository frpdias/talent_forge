'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TimeToHireData {
  month: string;
  days: number;
  target: number;
}

interface TimeToHireChartProps {
  data: TimeToHireData[];
}

export function TimeToHireChart({ data }: TimeToHireChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempo Médio de Contratação</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="days" 
            stroke="#1F4ED8" 
            strokeWidth={2}
            name="Dias Reais"
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="#F97316" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Meta (dias)"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Média Atual</p>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round(data.reduce((acc, item) => acc + item.days, 0) / data.length)} dias
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Meta</p>
          <p className="text-3xl font-bold text-orange-600">
            {data[0]?.target || 0} dias
          </p>
        </div>
      </div>
    </div>
  );
}
