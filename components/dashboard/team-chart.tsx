"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamStats } from "@/lib/supabase/queries";

const CHART_COLORS = [
  "var(--chart-primary)",
  "var(--chart-secondary)",
  "var(--chart-tertiary)",
  "var(--chart-quaternary)",
  "var(--chart-fifth)",
  "var(--chart-sixth)",
];

export function TeamChart({ data }: { data: TeamStats[] }) {
  const chartData = data.slice(0, 8).map((d) => ({
    name:
      d.team_name.length > 25
        ? d.team_name.slice(0, 25) + "..."
        : d.team_name,
    fullName: d.team_name,
    closing_rate: d.closing_rate,
    total: d.total,
    avg_score: d.avg_score,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
          👥 Perbandingan Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-12">
            Belum ada data team. Pastikan user sudah punya team.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "var(--chart-axis-muted)", fontSize: 12 }}
                stroke="var(--chart-grid)"
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "var(--chart-axis-muted)", fontSize: 11 }}
                stroke="var(--chart-grid)"
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text-primary)",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
                labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                formatter={(value: any, name: any, props: any) => [
                  `${value}% (${props.payload.total} chat)`,
                  "Closing Rate",
                ]}
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.fullName || label
                }
              />
              <Bar dataKey="closing_rate" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
