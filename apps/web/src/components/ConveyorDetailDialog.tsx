import { useEffect, useState } from "react";
import { Card } from "./ui/card";

type ConveyorStatus = "running" | "stopped";

type ConveyorDetail = {
  id: number;
  factory_id: number;
  name: string;
  status: ConveyorStatus;
  created_at: string;
};

type ApiResponse = {
  conveyor: ConveyorDetail;
};

export function ConveyorDetailDialog({
  open,
  conveyorId,
  onClose,
}: {
  open: boolean;
  conveyorId: number | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<ConveyorDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !conveyorId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/conveyor/${conveyorId}`);
        if (!res.ok) throw new Error("Fetch detail failed");

        const json: ApiResponse = await res.json();
        setData(json.conveyor);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [open, conveyorId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* modal */}
      <Card className="relative z-10 w-[92%] max-w-lg rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chi tiết băng truyền</h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500">Đang tải...</p>}

        {!loading && !data && (
          <p className="text-sm text-red-500">Không lấy được dữ liệu</p>
        )}

        {!loading && data && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Factory</span>
              <span className="font-medium">{data.factory_id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Tên</span>
              <span className="font-medium">{data.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Trạng thái</span>
              <span
                className={`font-medium ${
                  data.status === "running" ? "text-green-600" : "text-red-600"
                }`}
              >
                {data.status}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Cập nhật lúc</span>
              <span className="font-medium">
                {new Date(data.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
