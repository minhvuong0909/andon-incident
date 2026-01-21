import { CheckCircle2, AlertCircle, UserPlus } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

export type StationStatus = "running" | "stopped";

export interface AndonStationProps {
  id: string;
  name: string;
  status: StationStatus;
  area: string;
  lastUpdate?: string;
  issue?: string;
  onClick?: () => void;
  onAssign?: () => void; // ✅ nếu có thì mới hiện nút phân công
}

export function AndonStation({
  name,
  status,
  area,
  lastUpdate,
  issue,
  onClick,
  onAssign,
}: AndonStationProps) {
  const statusConfig = {
    running: {
      bg: "bg-green-500",
      text: "text-green-700",
      icon: CheckCircle2,
      label: "Hoạt động bình thường",
      pulse: false,
      border: "border-green-500",
    },
    stopped: {
      bg: "bg-red-500",
      text: "text-red-700",
      icon: AlertCircle,
      label: "Sự cố",
      pulse: true,
      border: "border-red-500",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // - status đang stopped
  // - và có truyền onAssign (tab Sự cố mới truyền)
  const showAssignButton =
    status === "stopped" && typeof onAssign === "function";

  return (
    <Card
      className={[
        "p-4 cursor-pointer transition-all border-2",
        "hover:shadow-lg active:scale-[0.99]",
        config.border,
      ].join(" ")}
      onClick={onClick}
      role="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={[
                config.bg,
                "rounded-full p-1.5",
                config.pulse ? "animate-pulse" : "",
              ].join(" ")}
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

          {showAssignButton && (
            <Button
              type="button"
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onAssign();
              }}
            >
              <UserPlus className="size-4 mr-2" />
              Phân công thợ
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
