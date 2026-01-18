import { AlertCircle, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { Card } from "./ui/card";

interface ConveyorSegment {
  id: string;
  name: string;
  status: "normal" | "warning" | "error" | "idle";
  position: { x: number; y: number };
}

const conveyorSegments: ConveyorSegment[] = [
  { id: "1", name: "BT01", status: "error", position: { x: 50, y: 50 } },
  { id: "2", name: "BT02", status: "warning", position: { x: 150, y: 50 } },
  { id: "3", name: "BT03", status: "normal", position: { x: 250, y: 50 } },
  { id: "4", name: "BT04", status: "normal", position: { x: 350, y: 50 } },
  { id: "5", name: "BT05", status: "warning", position: { x: 350, y: 150 } },
  { id: "6", name: "BT06", status: "normal", position: { x: 250, y: 150 } },
  { id: "7", name: "BT07", status: "idle", position: { x: 150, y: 150 } },
  { id: "8", name: "BT08", status: "normal", position: { x: 50, y: 150 } },
];

export function ConveyorVisual() {
  const getStatusIcon = (status: ConveyorSegment["status"]) => {
    switch (status) {
      case "normal":
        return <CheckCircle2 className="size-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="size-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="size-5 text-red-500" />;
      case "idle":
        return <Circle className="size-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ConveyorSegment["status"]) => {
    switch (status) {
      case "normal":
        return "border-green-500 bg-green-50";
      case "warning":
        return "border-yellow-500 bg-yellow-50";
      case "error":
        return "border-red-500 bg-red-50";
      case "idle":
        return "border-gray-300 bg-gray-50";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Sơ đồ Băng Truyền</h3>
      <div
        className="relative bg-gray-100 rounded-lg p-8"
        style={{ minHeight: "300px" }}
      >
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          {/* Horizontal top line */}
          <line
            x1="50"
            y1="60"
            x2="350"
            y2="60"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="5,5"
          />

          {/* Vertical right line */}
          <line
            x1="360"
            y1="60"
            x2="360"
            y2="160"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="5,5"
          />

          {/* Horizontal bottom line */}
          <line
            x1="350"
            y1="160"
            x2="50"
            y2="160"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="5,5"
          />

          {/* Vertical left line */}
          <line
            x1="40"
            y1="160"
            x2="40"
            y2="60"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="5,5"
          />

          {/* Direction arrows */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
            </marker>
          </defs>
          <line
            x1="200"
            y1="50"
            x2="220"
            y2="50"
            stroke="#64748b"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <line
            x1="370"
            y1="110"
            x2="370"
            y2="130"
            stroke="#64748b"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <line
            x1="200"
            y1="170"
            x2="180"
            y2="170"
            stroke="#64748b"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <line
            x1="30"
            y1="110"
            x2="30"
            y2="90"
            stroke="#64748b"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        </svg>

        {conveyorSegments.map((segment) => (
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
              className={`
                flex items-center justify-center
                border-2 rounded-lg
                w-16 h-16
                transition-all
                ${getStatusColor(segment.status)}
                ${segment.status === "error" || segment.status === "warning" ? "animate-pulse" : ""}
              `}
            >
              <div className="text-center">
                {getStatusIcon(segment.status)}
                <p className="text-xs font-medium mt-1">{segment.name}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-sm z-10">
          <p className="text-xs font-medium mb-2">Chú thích:</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3 text-green-500" />
              <span>Bình thường</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-3 text-yellow-500" />
              <span>Cảnh báo</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-3 text-red-500" />
              <span>Sự cố</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="size-3 text-gray-400" />
              <span>Ngừng</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
