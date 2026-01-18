import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

export interface Incident {
  id: string;
  station: string;
  area: string;
  type: "error" | "warning";
  description: string;
  timestamp: string;
  duration: string;
  status: "active" | "resolved";
}

interface IncidentListProps {
  incidents: Incident[];
}

export function IncidentList({ incidents }: IncidentListProps) {
  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <Card key={incident.id} className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-full p-2 ${
                incident.type === "error" ? "bg-red-100" : "bg-yellow-100"
              }`}
            >
              {incident.type === "error" ? (
                <AlertCircle className="size-5 text-red-600" />
              ) : (
                <AlertTriangle className="size-5 text-yellow-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold">{incident.station}</h4>
                <Badge
                  variant={
                    incident.status === "active" ? "destructive" : "secondary"
                  }
                >
                  {incident.status === "active" ? "Đang xử lý" : "Đã xử lý"}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-1">{incident.area}</p>

              <p className="text-sm text-gray-800 mb-2">
                {incident.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {incident.timestamp}
                </span>
                <span>Thời lượng: {incident.duration}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
