import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Card } from "./ui/card";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: SummaryCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`${bgColor} rounded-full p-3`}>
          <Icon className={`size-6 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

interface AndonSummaryProps {
  totalStations: number;
  activeIncidents: number;
  warnings: number;
  normalStations: number;
}

export function AndonSummary({
  totalStations,
  activeIncidents,
  warnings,
  normalStations,
}: AndonSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Tổng số băng truyền"
        value={totalStations}
        icon={Activity}
        color="text-blue-600"
        bgColor="bg-blue-100"
      />
      <SummaryCard
        title="Sự cố đang xử lý"
        value={activeIncidents}
        icon={AlertCircle}
        color="text-red-600"
        bgColor="bg-red-100"
      />
      <SummaryCard
        title="Cảnh báo"
        value={warnings}
        icon={AlertTriangle}
        color="text-yellow-600"
        bgColor="bg-yellow-100"
      />
      <SummaryCard
        title="Hoạt động bình thường"
        value={normalStations}
        icon={CheckCircle2}
        color="text-green-600"
        bgColor="bg-green-100"
      />
    </div>
  );
}
