import { AlertTriangle, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card } from "./ui/card";

export type StationStatus = "normal" | "warning" | "error" | "idle";

export interface AndonStationProps {
  id: string;
  name: string;
  status: StationStatus;
  area: string;
  lastUpdate?: string;
  issue?: string;
  onClick?: () => void;
}

export function AndonStation({
  name,
  status,
  area,
  lastUpdate,
  issue,
  onClick,
}: AndonStationProps) {
  const statusConfig = {
    normal: {
      bg: "bg-green-500",
      text: "text-green-700",
      icon: CheckCircle2,
      label: "Hoạt động bình thường",
      pulse: false,
    },
    warning: {
      bg: "bg-yellow-500",
      text: "text-yellow-700",
      icon: AlertTriangle,
      label: "Cảnh báo",
      pulse: true,
    },
    error: {
      bg: "bg-red-500",
      text: "text-red-700",
      icon: AlertCircle,
      label: "Sự cố",
      pulse: true,
    },
    idle: {
      bg: "bg-gray-400",
      text: "text-gray-700",
      icon: Clock,
      label: "Ngừng hoạt động",
      pulse: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
        status === "error"
          ? "border-red-500"
          : status === "warning"
            ? "border-yellow-500"
            : "border-transparent"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`${config.bg} rounded-full p-1.5 ${config.pulse ? "animate-pulse" : ""}`}
            >
              <Icon className="size-4 text-white" />
            </div>
            <h3 className="font-semibold truncate">{name}</h3>
          </div>

          <p className="text-sm text-gray-600 mb-1">{area}</p>

          <div className={`text-sm font-medium ${config.text}`}>
            {config.label}
          </div>

          {issue && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{issue}</p>
          )}

          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-2">Cập nhật: {lastUpdate}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
