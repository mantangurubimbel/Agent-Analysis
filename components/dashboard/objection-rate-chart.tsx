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
import type { ObjectionHandledRate } from "@/lib/supabase/queries";

const OBJECTION_LABELS: Record<string, string> = {
  price: "Harga",
  trust: "Kepercayaan",
  timing: "Waktu",
  need: "Kebutuhan",
  competitor: "Kompetitor",
  product_fit: "Kesesuaian",
  other: "Lainnya",
};

export function ObjectionRateChart({ data }: { data: ObjectionHandledRate[] }) {
  const chartData = data.slice(0, 7).map((d) => ({
    name: OBJECTION_LABELS[d.type] ?? d.type,
    rate: d.rate,
    total: d.total,
    handled: d.handled,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
          🚧 Objection Handled Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-12">
            Belum ada data objection.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
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
                domain={[0, 100]}
                tick={{ fill: "var(--chart-axis-muted)", fontSize: 12 }}
                stroke="var(--chart-grid)"
                tickFormatter={(v) => `${v}%`}
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
                formatter={(value: any, name: any, props: any) => [
                  `${value}% (${props.payload.handled}/${props.payload.total})`,
                  "Handled Rate",
                ]}
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.rate >= 70
                        ? "var(--chart-primary)"
                        : entry.rate >= 50
                        ? "var(--chart-tertiary)"
                        : "var(--chart-fifth)"
                    }
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
