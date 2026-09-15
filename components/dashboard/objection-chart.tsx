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
import type { ObjectionStat } from "@/lib/supabase/queries";

const OBJECTION_LABELS: Record<string, string> = {
  price: "Harga",
  trust: "Kepercayaan",
  timing: "Waktu",
  need: "Kebutuhan",
  competitor: "Kompetitor",
  product_fit: "Kesesuaian",
  other: "Lainnya",
};

const CHART_COLORS = [
  "var(--chart-primary)",
  "var(--chart-secondary)",
  "var(--chart-tertiary)",
  "var(--chart-quaternary)",
  "var(--chart-fifth)",
  "var(--chart-sixth)",
];

export function ObjectionChart({ data }: { data: ObjectionStat[] }) {
  const chartData = data
    .slice(0, 6)
    .map((d) => ({
      name: OBJECTION_LABELS[d.type] ?? d.type,
      count: d.count,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Objections</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Belum ada objection terdeteksi.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "var(--chart-axis-muted)", fontSize: 12 }}
                stroke="var(--chart-grid)"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "var(--chart-axis-muted)", fontSize: 12 }}
                stroke="var(--chart-grid)"
                width={80}
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
                labelStyle={{
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
                itemStyle={{
                  color: "var(--text-secondary)",
                }}
              />
              <Bar dataKey="count" name="Jumlah" radius={[0, 4, 4, 0]}>
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
