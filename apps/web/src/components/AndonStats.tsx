import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "./ui/card";

/* ================= TYPES ================= */

interface DailyIncident {
  time: string;
  count: number;
}

interface StatusItem {
  name: string;
  value: number;
}

interface AndonStatsProps {
  dailyIncidents: DailyIncident[];
  statusDistribution: StatusItem[];
}

/* ================= CONFIG ================= */

const STATUS_COLORS: Record<string, string> = {
  running: "#22c55e",
  stopped: "#ef4444",
  warning: "#f59e0b",
  unknown: "#94a3b8",
};

const DEFAULT_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

/* ================= COMPONENT ================= */

export function AndonStats({
  dailyIncidents,
  statusDistribution,
}: AndonStatsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ===== BAR CHART ===== */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Sự cố trong 24h qua</h3>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyIncidents}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              fill="#3b82f6"
              isAnimationActive
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ===== PIE CHART ===== */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Phân bổ trạng thái</h3>

        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={statusDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="70%"
              paddingAngle={4}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {statusDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    STATUS_COLORS[entry.name.toLowerCase()] ||
                    DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                  }
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
