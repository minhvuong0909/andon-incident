import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

type ConveyorStatus = "running" | "stopped";

export interface Incident {
  id: number;
  factory_id: number;
  name: string;
  status: ConveyorStatus;
  created_at: string;
}

type ApiResponse = {
  result: Incident[];
};

export function IncidentList() {
  const [data, setData] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ call API
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch("http://localhost:4000/conveyor");
        if (!res.ok) throw new Error("Fetch incidents failed");

        const json: ApiResponse = await res.json();
        setData(json.result || []);
      } catch (err) {
        console.error("Incident API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  //  lấy stopped làm incident list
  const stoppedList = useMemo(() => {
    return data
      .filter((x) => x.status === "stopped")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [data]);

  if (loading) {
    return <div className="text-sm text-gray-500">Đang tải sự cố...</div>;
  }

  if (stoppedList.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        ✅ Không có sự cố nào (tất cả đang running)
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stoppedList.map((incident) => (
        <Card
          key={incident.id}
          className="p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-2xl p-2 bg-red-50 border border-red-200">
              <AlertCircle className="size-5 text-red-600" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold text-gray-900 truncate">
                  {incident.name}
                </h4>

                <Badge variant="destructive">Tạm dừng</Badge>

                <Badge variant="secondary">Xưởng {incident.factory_id}</Badge>
              </div>

              <p className="text-sm text-gray-700 mb-2">
                Băng truyền đang dừng. Cần kiểm tra ngay.
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {new Date(incident.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
