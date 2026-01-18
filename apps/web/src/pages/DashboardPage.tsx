import { useState } from "react";
import {
  AndonStation,
  type AndonStationProps,
} from "../components/AndonStation";
import { IncidentList, type Incident } from "../components/IncidentList";
import { AndonSummary } from "../components/AndonSummary";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { AndonStats } from "../components/AndonStats";

// Mock data
const generateMockStations = (): AndonStationProps[] => [
  {
    id: "1",
    name: "Băng truyền chính 01",
    area: "Khu vực A - Dây chuyền lắp ráp",
    status: "error",
    lastUpdate: "2 phút trước",
    issue: "Băng truyền bị kẹt - Vật liệu tắc nghẽn",
  },
  {
    id: "2",
    name: "Băng truyền phụ 02",
    area: "Khu vực A - Dây chuyền lắp ráp",
    status: "warning",
    lastUpdate: "5 phút trước",
    issue: "Tốc độ băng truyền giảm 20%",
  },
  {
    id: "3",
    name: "Băng truyền chính 03",
    area: "Khu vực B - Phân loại",
    status: "normal",
    lastUpdate: "1 phút trước",
  },
  {
    id: "4",
    name: "Băng truyền kiểm tra 01",
    area: "Khu vực B - Kiểm tra chất lượng",
    status: "normal",
    lastUpdate: "3 phút trước",
  },
  {
    id: "5",
    name: "Băng truyền đóng gói 01",
    area: "Khu vực C - Đóng gói",
    status: "warning",
    lastUpdate: "8 phút trước",
    issue: "Cảm biến phát hiện rung động bất thường",
  },
  {
    id: "6",
    name: "Băng truyền vận chuyển 01",
    area: "Khu vực C - Vận chuyển nội bộ",
    status: "normal",
    lastUpdate: "2 phút trước",
  },
  {
    id: "7",
    name: "Băng truyền phụ 05",
    area: "Khu vực D - Kho nguyên liệu",
    status: "idle",
    lastUpdate: "30 phút trước",
  },
  {
    id: "8",
    name: "Băng truyền xuất hàng 01",
    area: "Khu vực D - Kho thành phẩm",
    status: "normal",
    lastUpdate: "1 phút trước",
  },
];

const generateMockIncidents = (): Incident[] => [
  {
    id: "i1",
    station: "Băng truyền chính 01",
    area: "Khu vực A - Dây chuyền lắp ráp",
    type: "error",
    description:
      "Băng truyền bị kẹt do vật liệu tắc nghẽn. Động cơ tự động dừng để bảo vệ.",
    timestamp: "14:32 - 14/01/2026",
    duration: "2 phút",
    status: "active",
  },
  {
    id: "i2",
    station: "Băng truyền phụ 02",
    area: "Khu vực A - Dây chuyền lắp ráp",
    type: "warning",
    description:
      "Tốc độ băng truyền giảm 20% so với tốc độ chuẩn. Có thể do ma sát tăng.",
    timestamp: "14:29 - 14/01/2026",
    duration: "5 phút",
    status: "active",
  },
  {
    id: "i3",
    station: "Băng truyền đóng gói 01",
    area: "Khu vực C - Đóng gói",
    type: "warning",
    description: "Cảm biến phát hiện rung động bất thường. Cần kiểm tra ổ đỡ.",
    timestamp: "14:26 - 14/01/2026",
    duration: "8 phút",
    status: "active",
  },
  {
    id: "i4",
    station: "Băng truyền kiểm tra 02",
    area: "Khu vực B - Kiểm tra chất lượng",
    type: "error",
    description: "Motor băng truyền quá tải. Đã tự động ngắt để bảo vệ.",
    timestamp: "13:45 - 14/01/2026",
    duration: "12 phút",
    status: "resolved",
  },
  {
    id: "i5",
    station: "Băng truyền vận chuyển 03",
    area: "Khu vực C - Vận chuyển nội bộ",
    type: "warning",
    description: "Băng truyền bị lệch, cần căn chỉnh lại con lăn.",
    timestamp: "13:20 - 14/01/2026",
    duration: "8 phút",
    status: "resolved",
  },
];

const dailyIncidentsData = [
  { time: "00:00", count: 2 },
  { time: "04:00", count: 1 },
  { time: "08:00", count: 5 },
  { time: "12:00", count: 8 },
  { time: "16:00", count: 4 },
  { time: "20:00", count: 3 },
];

export function DashboardPage() {
  const [stations] = useState<AndonStationProps[]>(generateMockStations());
  const [incidents] = useState<Incident[]>(generateMockIncidents());

  // Calculate statistics
  const totalStations = stations.length;
  const activeIncidents = stations.filter((s) => s.status === "error").length;
  const warnings = stations.filter((s) => s.status === "warning").length;
  const normalStations = stations.filter((s) => s.status === "normal").length;

  const statusDistribution = [
    {
      name: "Bình thường",
      value: normalStations,
      color: "#22c55e",
    },
    { name: "Cảnh báo", value: warnings, color: "#eab308" },
    { name: "Sự cố", value: activeIncidents, color: "#ef4444" },
    {
      name: "Ngừng",
      value: stations.filter((s) => s.status === "idle").length,
      color: "#9ca3af",
    },
  ];

  const activeIncidentsList = incidents.filter((i) => i.status === "active");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <AndonSummary
        totalStations={totalStations}
        activeIncidents={activeIncidents}
        warnings={warnings}
        normalStations={normalStations}
      />

      {/* Tabs */}
      <Tabs defaultValue="stations" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="stations">Băng truyền</TabsTrigger>
          <TabsTrigger value="incidents">
            Sự cố
            {activeIncidentsList.length > 0 && (
              <Badge className="ml-2 bg-red-600">
                {activeIncidentsList.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        <TabsContent value="stations" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stations.map((station) => (
              <AndonStation key={station.id} {...station} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          {incidents.length > 0 ? (
            <IncidentList incidents={incidents} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              Không có sự cố nào được ghi nhận
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AndonStats
            dailyIncidents={dailyIncidentsData}
            statusDistribution={statusDistribution}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
