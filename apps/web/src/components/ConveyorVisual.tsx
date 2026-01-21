import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { Card } from "./ui/card";

type ConveyorStatus = "running" | "stopped";

type ConveyorApi = {
  id: number;
  factory_id: number;
  name: string;
  status: ConveyorStatus;
  created_at: string;
};

type ApiResponse = {
  result: ConveyorApi[];
};

type ConveyorSegment = ConveyorApi & {
  position: { x: number; y: number };
};

// ✅ vị trí theo sơ đồ (đổi theo name thật của bạn)
const conveyorPositions: Record<string, { x: number; y: number }> = {
  "băng truyền 1": { x: 50, y: 50 },
  "băng truyền 2": { x: 150, y: 50 },
  "băng truyền 3": { x: 250, y: 50 },
  "băng truyền 4": { x: 350, y: 50 },
  "băng truyền 5": { x: 350, y: 150 },
  "băng truyền 6": { x: 250, y: 150 },
  "băng truyền 7": { x: 150, y: 150 },
  "băng truyền 8": { x: 50, y: 150 },
};

function getStatusIcon(status: ConveyorStatus) {
  if (status === "running")
    return <CheckCircle2 className="size-5 text-green-600" />;
  if (status === "stopped")
    return <AlertCircle className="size-5 text-red-600" />;
  return <Circle className="size-5 text-gray-400" />;
}

function getStatusColor(status: ConveyorStatus) {
  if (status === "running") return "border-green-500 bg-green-50";
  if (status === "stopped") return "border-red-500 bg-red-50";
  return "border-gray-300 bg-gray-50";
}

export function ConveyorVisual() {
  const [conveyors, setConveyors] = useState<ConveyorApi[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ CALL API
  useEffect(() => {
    const fetchConveyors = async () => {
      try {
        const res = await fetch("http://localhost:4000/conveyor");
        if (!res.ok) throw new Error("Fetch conveyors failed");

        const json: ApiResponse = await res.json();
        setConveyors(json.result || []);
      } catch (err) {
        console.error("API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConveyors();
  }, []);

  const latestConveyors = useMemo(() => {
    const map = new Map<string, ConveyorApi>();

    for (const c of conveyors) {
      const prev = map.get(c.name);

      if (!prev) {
        map.set(c.name, c);
        continue;
      }

      if (
        new Date(c.created_at).getTime() > new Date(prev.created_at).getTime()
      ) {
        map.set(c.name, c);
      }
    }

    return Array.from(map.values());
  }, [conveyors]);

  // merge với position
  const segments: ConveyorSegment[] = useMemo(() => {
    return latestConveyors.map((c) => ({
      ...c,
      position: conveyorPositions[c.name] || { x: 200, y: 100 }, // fallback
    }));
  }, [latestConveyors]);

  return (
    <Card className="p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Sơ đồ Băng Truyền
          </h3>
          <p className="text-sm text-gray-500">Trạng thái mới nhất từ API</p>
        </div>
        <div className="text-xs text-gray-500">
          {loading ? "Loading..." : "Realtime ✅"}
        </div>
      </div>

      <div className="relative bg-gray-50 border rounded-2xl p-8 min-h-[320px] overflow-hidden">
        {/* Đường băng truyền */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          <line
            x1="50"
            y1="60"
            x2="350"
            y2="60"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="6,6"
          />
          <line
            x1="360"
            y1="60"
            x2="360"
            y2="160"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="6,6"
          />
          <line
            x1="350"
            y1="160"
            x2="50"
            y2="160"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="6,6"
          />
          <line
            x1="40"
            y1="160"
            x2="40"
            y2="60"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="6,6"
          />
        </svg>

        {/* Nodes */}
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="absolute"
            style={{
              left: `${segment.position.x}px`,
              top: `${segment.position.y}px`,
              transform: "translate(-50%, -50%)",
              zIndex: 1,
            }}
          >
            <div
              className={[
                "flex items-center justify-center",
                "border-2 rounded-2xl w-16 h-16",
                "bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
                getStatusColor(segment.status),
                segment.status === "stopped" ? "animate-pulse" : "",
              ].join(" ")}
              title={`${segment.name} • ${segment.status}`}
            >
              <div className="text-center">
                {getStatusIcon(segment.status)}
                <p className="text-xs font-semibold mt-1 text-gray-700">
                  {segment.name}
                </p>
              </div>
            </div>
          </div>
        ))}

        {!loading && segments.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
            Không có dữ liệu từ API
          </div>
        )}
      </div>
    </Card>
  );
}
