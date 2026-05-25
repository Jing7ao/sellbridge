"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  data: Record<string, string | number>[];
  platformColors: Record<string, string>;
}

export default function PriceChart({ data, platformColors }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <p className="text-center text-sm text-slate-400 py-10">没有匹配的数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
      <h3 className="font-semibold text-sm text-slate-800 mb-4 flex items-center gap-2">
        跨平台价格对比
        <span className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent ml-2" />
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 28)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="product" tick={{ fontSize: 10 }} width={100} />
          <Tooltip formatter={(value) => [`¥${Number(value).toFixed(2)}`, ""]} />
          <Legend />
          {Object.entries(platformColors).map(([name, color]) => (
            <Bar key={name} dataKey={name} fill={color} radius={[0, 4, 4, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
