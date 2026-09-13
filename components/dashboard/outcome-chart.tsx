"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OutcomeData {
  name: string;
  value: number;
  color: string;
}

export function OutcomeChart({
  closed,
  no_response,
  rejected,
  pending,
}: {
  closed: number;
  no_response: number;
  rejected: number;
  pending: number;
}) {
  const data: OutcomeData[] = [
    { name: "Closed", value: closed, color: "var(--chart-primary)" },
    { name: "No Response", value: no_response, color: "var(--chart-target)" },
    { name: "Rejected", value: rejected, color: "var(--chart-sixth)" },
    { name: "Pending", value: pending, color: "var(--chart-tertiary)" },
  ].filter((d) => d.value > 0);

  const total = closed + no_response + rejected + pending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi Outcome</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Belum ada data.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  color: "var(--chart-axis-muted)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
