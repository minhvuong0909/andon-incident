import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Card } from "./ui/card";

type ConveyorApi = {
  id: number;
  factory_id: number;
  name: string;
  status: string;
  created_at: string;
};

type ApiResponse = {
  result: ConveyorApi[];
};

type SummaryData = {
  totalStations: number;
  activeIncidents: number;
  warnings: number;
  normalStations: number;
};

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="group relative overflow-hidden p-6 rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* soft background glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.35), transparent 60%)",
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight text-gray-900">
            {value}
          </p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>

        <div
          className={`shrink-0 rounded-2xl p-3 ${iconBg} ring-1 ring-black/5`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card
          key={idx}
          className="p-6 rounded-2xl border bg-white shadow-sm animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-3 w-32 rounded bg-gray-200" />
              <div className="h-8 w-16 rounded bg-gray-200" />
              <div className="h-3 w-44 rounded bg-gray-200" />
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gray-200" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AndonSummary() {
  const [conveyors, setConveyors] = useState<ConveyorApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConveyors = async () => {
      try {
        const res = await fetch("http://localhost:4000/conveyor");
        if (!res.ok) throw new Error("Fetch conveyor failed");

        const json: ApiResponse = await res.json();
        setConveyors(json.result || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConveyors();
    const timer = setInterval(fetchConveyors, 5000);

    return () => clearInterval(timer);
  }, []);

  // lấy trạng thái mới nhất theo từng băng truyền (theo name)
  const latestConveyors = useMemo(() => {
    const map = new Map<string, ConveyorApi>();

    for (const c of conveyors) {
      const prev = map.get(c.name);

      if (!prev) {
        map.set(c.name, c);
        continue;
      }

      const prevTime = new Date(prev.created_at).getTime();
      const curTime = new Date(c.created_at).getTime();

      if (curTime > prevTime) {
        map.set(c.name, c);
      }
    }

    return Array.from(map.values());
  }, [conveyors]);

  // thống kê
  const summary: SummaryData = useMemo(() => {
    const totalStations = latestConveyors.length;

    const activeIncidents = latestConveyors.filter(
      (c) => c.status === "stopped",
    ).length;

    const warnings = latestConveyors.filter(
      (c) => c.status === "warning",
    ).length;

    const normalStations = latestConveyors.filter(
      (c) => c.status === "running",
    ).length;

    return {
      totalStations,
      activeIncidents,
      warnings,
      normalStations,
    };
  }, [latestConveyors]);

  if (loading) return <SummarySkeleton />;

  return (
    <div className="space-y-4">
      {/* Header nhỏ cho UX */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Tổng quan hệ thống
          </h2>
          <p className="text-sm text-gray-500">
            Cập nhật theo trạng thái mới nhất của từng băng truyền
          </p>
        </div>

        {/* <div className="hidden sm:block text-xs text-gray-500">
          {latestConveyors.length > 0 ? "Realtime ✅" : "Không có dữ liệu"}
        </div> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Tổng số băng truyền"
          value={summary.totalStations}
          subtitle="Thiết bị đang theo dõi"
          icon={Activity}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Sự cố đang xử lý"
          value={summary.activeIncidents}
          subtitle="Cần ưu tiên xử lý ngay"
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <SummaryCard
          title="Cảnh báo"
          value={summary.warnings}
          subtitle="Theo dõi & kiểm tra sớm"
          icon={AlertTriangle}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <SummaryCard
          title="Hoạt động bình thường"
          value={summary.normalStations}
          subtitle="Đang chạy ổn định"
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>
    </div>
  );
}
