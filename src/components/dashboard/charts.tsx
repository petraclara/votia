"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DashboardCharts({
  votes,
  topContestants,
}: {
  votes: { date: string; votes: number }[];
  topContestants: { name: string; votes: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Votes over time">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={votes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area dataKey="votes" stroke="#00C2B8" fill="#E6FAF8" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Top contestants">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topContestants}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="votes" fill="#00C2B8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
      <h3 className="mb-4 font-semibold text-navy">{title}</h3>
      {children}
    </div>
  );
}
