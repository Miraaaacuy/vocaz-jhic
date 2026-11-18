"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BRAND = ["#123e3d", "#175d5a", "#1a7370", "#229085", "#45ad9f", "#7ccbc0"];
const MIXED = ["#1a7370", "#f25c12", "#10b981", "#0284c7", "#7c3aed", "#63726e"];

const tooltipStyle = { borderRadius: 10, border: "1px solid #e2e8e5", fontSize: 12, boxShadow: "0 8px 24px -12px rgb(0 0 0 / .2)" };

export function BarChartCard({ data, height = 260, horizontal }: { data: { name: string; value: number }[]; height?: number; horizontal?: boolean }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} stroke="#e8eeeb" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#5b6b67" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#374845" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f6f8f7" }} />
          <Bar dataKey="value" name="Jumlah" radius={[0, 6, 6, 0]} fill="#1a7370" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 4, left: -18 }}>
        <CartesianGrid vertical={false} stroke="#e8eeeb" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5b6b67" }} axisLine={false} tickLine={false} interval={0} height={48} angle={-12} textAnchor="end" />
        <YAxis tick={{ fontSize: 11, fill: "#5b6b67" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f6f8f7" }} />
        <Bar dataKey="value" name="Pelamar" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= max * 0.7 ? BRAND[0] : d.value >= max * 0.4 ? BRAND[2] : BRAND[4]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AreaChartCard({ data, height = 240, keys }: { data: Record<string, string | number>[]; height?: number; keys: { key: string; label: string; color?: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -18 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k.key} id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.color ?? MIXED[i]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={k.color ?? MIXED[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="#e8eeeb" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5b6b67" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#5b6b67" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {keys.map((k, i) => (
          <Area key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={k.color ?? MIXED[i]} strokeWidth={2} fill={`url(#g-${k.key})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 220 }: { data: { name: string; value: number }[]; height?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={MIXED[i % MIXED.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{total}</span>
          <span className="text-xs text-muted">total</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: MIXED[i % MIXED.length] }} />
            <span className="text-body">{d.name}</span>
            <span className="font-semibold text-ink">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
