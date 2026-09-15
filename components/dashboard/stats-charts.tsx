"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint } from "@/lib/supabase/queries";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tren 14 Hari</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            Belum ada data untuk ditampilkan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren 14 Hari</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--chart-axis-muted)", fontSize: 12 }}
              stroke="var(--chart-grid)"
            />
            <YAxis
              tick={{ fill: "var(--chart-axis-muted)", fontSize: 12 }}
              stroke="var(--chart-grid)"
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
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "var(--chart-axis-muted)" }}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Total Chat"
              stroke="var(--chart-secondary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="closed"
              name="Closed"
              stroke="var(--chart-primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="closing_rate"
              name="Closing Rate (%)"
              stroke="var(--chart-tertiary)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
