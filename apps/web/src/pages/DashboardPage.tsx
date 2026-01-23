import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Factory,
  LayoutGrid,
  Search,
  Table2,
} from "lucide-react";

import {
  AndonStation,
  type AndonStationProps,
} from "../components/AndonStation";
import { AndonSummary } from "../components/AndonSummary";
import { AndonStats } from "../components/AndonStats";
import { ConveyorDetailDialog } from "../components/ConveyorDetailDialog";
import { AssignTechnicianDialog } from "../components/AssignFixer";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

type ConveyorStatus = "running" | "stopped";

type ConveyorApi = {
  id: number;
  factory_id: number;
  name: string;
  status: ConveyorStatus;
  created_at: string;
};

type ApiResponse<T> = {
  result: T[];
};

type UserRole = "Staff" | "Admin" | "Fixer";
type UserStatus = "Active" | "Inactive";

type Technician = {
  id: number;
  factory_id: number;
  department: string;
  name: string;
  username: string;
  role: UserRole;
  status: UserStatus;
};

// Assignment
type AssignmentStatus = "Ready" | "Assigned" | "Done";

type AssignmentApi = {
  id: number;
  user_id: number;
  conveyor_id: number | null;
  status: AssignmentStatus;
  created_at?: string;
};

const dailyIncidentsData = [
  { time: "00:00", count: 2 },
  { time: "04:00", count: 1 },
  { time: "08:00", count: 5 },
  { time: "12:00", count: 8 },
  { time: "16:00", count: 4 },
  { time: "20:00", count: 3 },
];

const API_BASE = "http://localhost:4000";

// ======================
// API FUNCTIONS
// ======================
async function fetchConveyorsApi() {
  const res = await fetch(`${API_BASE}/conveyor`, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch conveyors failed");
  const json: ApiResponse<ConveyorApi> = await res.json();
  return json.result || [];
}

async function fetchFixersApi() {
  const res = await fetch(`${API_BASE}/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch users failed");

  const json: ApiResponse<Technician> = await res.json();

  // chỉ lấy Fixer ACTIVE
  const fixers = (json.result || []).filter(
    (u) =>
      String(u.role || "").toLowerCase() === "fixer" &&
      String(u.status || "").toLowerCase() === "active",
  );

  return fixers;
}

async function fetchAllAssignmentsApi() {
  const res = await fetch(`${API_BASE}/assignment`, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch assignments failed");

  const json: ApiResponse<AssignmentApi> = await res.json();
  return json.result || [];
}

// ======================
// Skeleton
// ======================
function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-3 animate-pulse">
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
      <div className="h-20 bg-gray-100 rounded-xl" />
    </div>
  );
}

// ======================
// Helpers: Date range filter
// ======================

const toDateOnly = (isoStr: string) => {
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

// ======================
// Speech
// ======================
function speakVN(text: string) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "vi-VN";
  utter.rate = 1;
  utter.pitch = 1;

  window.speechSynthesis.speak(utter);
}

// extend station props để có lastUpdateISO
type StationWithISO = AndonStationProps & {
  lastUpdateISO?: string;
};

// ======================
// Dashboard
// ======================
export function DashboardPage() {
  const [conveyors, setConveyors] = useState<ConveyorApi[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] =
    useState<AndonStationProps | null>(null);

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);

  // chỉ show fixer có READY assignment
  const [readyAssignmentMap, setReadyAssignmentMap] = useState<
    Record<number, number>
  >({});

  // search băng truyền
  const [search, setSearch] = useState("");

  // Stats table (search + pagination)
  const [statsSearch, setStatsSearch] = useState("");
  const [statsPage, setStatsPage] = useState(1);
  const pageSize = 10;

  // Excel export range
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportTodayOnly, setExportTodayOnly] = useState(true);

  // AI voice alert 2 lần
  const [alertCountMap, setAlertCountMap] = useState<Record<string, number>>(
    {},
  );

  // expand ngày để xem full conveyor
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // ======================
  // REALTIME FETCH CONVEYORS (2s)
  // ======================
  useEffect(() => {
    let isMounted = true;
    let fetching = false;

    const fetchConveyors = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const list = await fetchConveyorsApi();
        if (isMounted) setConveyors(list);
      } catch (err) {
        console.error(err);
      } finally {
        fetching = false;
        if (isMounted) setLoadingStations(false);
      }
    };

    fetchConveyors();
    const interval = setInterval(fetchConveyors, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ======================
  // LẤY RECORD MỚI NHẤT THEO NAME
  // ======================
  const latestConveyors = useMemo(() => {
    const map = new Map<string, ConveyorApi>();

    for (const c of conveyors) {
      const key = c.name.trim().toLowerCase();
      const prev = map.get(key);

      if (!prev) {
        map.set(key, c);
        continue;
      }

      const curTime = new Date(c.created_at).getTime();
      const prevTime = new Date(prev.created_at).getTime();

      if (curTime > prevTime) map.set(key, c);
    }

    return Array.from(map.values());
  }, [conveyors]);

  // ======================
  // BUILD UI STATIONS
  // ======================
  const stations: StationWithISO[] = useMemo(() => {
    return latestConveyors.map((c) => ({
      id: String(c.id),
      name: c.name,
      area: `Xưởng ${c.factory_id}`,
      // giữ format display cho UI
      lastUpdate: new Date(c.created_at).toLocaleString("vi-VN"),
      // lưu thêm ISO để filter/export chính xác
      lastUpdateISO: c.created_at,
      status: c.status === "running" ? "running" : "stopped",
      issue:
        c.status === "stopped"
          ? "Băng truyền đang dừng"
          : "Băng truyền hoạt động bình thường",
    }));
  }, [latestConveyors]);

  // ======================
  // Filter search
  // ======================
  const filteredStations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q),
    );
  }, [stations, search]);

  const stationsByFactory = useMemo(() => {
    const map = new Map<string, StationWithISO[]>();

    filteredStations.forEach((s) => {
      const factoryKey = s.area;
      if (!map.has(factoryKey)) map.set(factoryKey, []);
      map.get(factoryKey)!.push(s);
    });

    for (const [, list] of map.entries()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return Array.from(map.entries()).map(([factoryName, list]) => ({
      factoryName,
      list,
    }));
  }, [filteredStations]);

  const incidentStations = useMemo(() => {
    return filteredStations.filter((s) => s.status === "stopped");
  }, [filteredStations]);

  const normalStations = useMemo(() => {
    return filteredStations.filter((s) => s.status === "running").length;
  }, [filteredStations]);

  const statusDistribution = useMemo(() => {
    return [
      { name: "Bình thường", value: normalStations, color: "#22c55e" },
      { name: "Sự cố", value: incidentStations.length, color: "#ef4444" },
    ];
  }, [normalStations, incidentStations.length]);

  // ======================
  // INCIDENTS STATISTICS (SEARCH + PAGINATION)
  // ======================
  const incidentFiltered = useMemo(() => {
    const q = statsSearch.trim().toLowerCase();
    if (!q) return incidentStations;

    return incidentStations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        (s.issue || "").toLowerCase().includes(q),
    );
  }, [incidentStations, statsSearch]);

  const incidentTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(incidentFiltered.length / pageSize));
  }, [incidentFiltered.length]);

  const incidentPaged = useMemo(() => {
    const start = (statsPage - 1) * pageSize;
    return incidentFiltered.slice(start, start + pageSize);
  }, [incidentFiltered, statsPage]);

  useEffect(() => {
    if (statsPage > incidentTotalPages) setStatsPage(1);
  }, [incidentTotalPages, statsPage]);

  // ======================
  // OPEN ASSIGN DIALOG
  // load fixer ACTIVE + assignment READY
  // ======================
  const handleAssignTechnician = async (stationId: string) => {
    const station = stations.find((s) => s.id === stationId);
    if (!station) return;

    setSelectedStation(station);
    setAssignDialogOpen(true);

    setLoadingTechs(true);
    try {
      const [fixers, assignments] = await Promise.all([
        fetchFixersApi(),
        fetchAllAssignmentsApi(),
      ]);

      const readyAssignments = (assignments || []).filter(
        (a) => String(a.status || "").toLowerCase() === "ready",
      );

      // Map user_id -> assignment_id
      const map: Record<number, number> = {};
      for (const a of readyAssignments) map[a.user_id] = a.id;
      setReadyAssignmentMap(map);

      // Chỉ show fixer có READY assignment
      const readyUserIds = new Set(readyAssignments.map((a) => a.user_id));
      const availableFixers = fixers.filter((f) => readyUserIds.has(f.id));

      setTechnicians(availableFixers);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách thợ sẵn sàng");
    } finally {
      setLoadingTechs(false);
    }
  };

  // ======================
  // CONFIRM ASSIGNMENT
  // update assignment READY -> ASSIGNED
  // ======================
  const handleAssignConfirm = async (technicianIds: string[]) => {
    if (!selectedStation) return;

    if (!readyAssignmentMap || Object.keys(readyAssignmentMap).length === 0) {
      toast.error("Danh sách sẵn sàng chưa tải xong, thử lại!");
      return;
    }

    try {
      await Promise.all(
        technicianIds.map(async (userIdStr) => {
          const userId = Number(userIdStr);
          const assignmentId = readyAssignmentMap[userId];

          if (!assignmentId) {
            throw new Error(
              `Fixer ID ${userId} không có assignment trạng thái READY`,
            );
          }

          const payload = {
            conveyor_id: Number(selectedStation.id),
            status: "Assigned",
          };

          const res = await fetch(
            `${API_BASE}/assignment/update/${assignmentId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );

          if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.message || "Update assignment failed");
          }

          return res.json().catch(() => ({}));
        }),
      );

      toast.success("Đã phân công thành công!", {
        description: `Đã gán ${technicianIds.length} thợ cho ${selectedStation.name}`,
      });

      setAssignDialogOpen(false);
      setSelectedStation(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Phân công thất bại", {
        description: err?.message || "Có lỗi xảy ra",
      });
    }
  };

  // ======================
  // THỐNG KÊ THEO NGÀY (CÓ FULL CONVEYOR TRONG NGÀY)
  // ======================
  const statsByDate = useMemo(() => {
    const map = new Map<string, StationWithISO[]>();

    stations.forEach((s) => {
      const iso = String(s.lastUpdateISO || "");
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return;

      const dateKey = d.toLocaleDateString("vi-VN");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(s);
    });

    // sort ngày mới -> cũ (dùng trick parse lại theo vi-VN có thể lệch, nên dùng ISO max)
    const sorted = Array.from(map.entries()).sort((a, b) => {
      // vì dateKey kiểu vi-VN khó parse, mình dùng time max của list đó
      const ta = Math.max(
        ...a[1].map((x) => new Date(String(x.lastUpdateISO || "")).getTime()),
      );
      const tb = Math.max(
        ...b[1].map((x) => new Date(String(x.lastUpdateISO || "")).getTime()),
      );
      return tb - ta;
    });

    return sorted.map(([date, list]) => {
      const total = list.length;
      const running = list.filter((x) => x.status === "running").length;
      const stopped = list.filter((x) => x.status === "stopped").length;

      // sort tên cho đẹp
      list.sort((a, b) => a.name.localeCompare(b.name));

      return {
        date,
        total,
        running,
        stopped,
        conveyors: list,
      };
    });
  }, [stations]);

  // ======================
  // AI VOICE ALERT (2 lần/station)
  // ======================
  useEffect(() => {
    const stoppedStations = stations.filter((s) => s.status === "stopped");
    if (stoppedStations.length === 0) return;

    stoppedStations.forEach((s) => {
      const count = alertCountMap[s.id] || 0;
      if (count >= 2) return;

      if (count === 0) {
        speakVN(`Cảnh báo! ${s.name} đang dừng. Vui lòng kiểm tra ngay.`);
        setAlertCountMap((prev) => ({ ...prev, [s.id]: 1 }));

        setTimeout(() => {
          const stillStopped = stations.some(
            (x) => x.id === s.id && x.status === "stopped",
          );

          if (stillStopped) {
            speakVN(`Nhắc lại! ${s.name} vẫn đang dừng. Yêu cầu xử lý ngay.`);
            setAlertCountMap((prev) => ({ ...prev, [s.id]: 2 }));
          }
        }, 12000);
      }
    });
  }, [stations, alertCountMap]);

  // reset alertCount khi station chạy lại
  useEffect(() => {
    const runningStations = stations.filter((s) => s.status === "running");
    if (runningStations.length === 0) return;

    setAlertCountMap((prev) => {
      const copy = { ...prev };
      runningStations.forEach((s) => {
        if (copy[s.id]) delete copy[s.id];
      });
      return copy;
    });
  }, [stations]);

  // ======================
  // EXCEL EXPORT (Today / Range)
  // ======================
  const exportStatisticsExcel = () => {
    const today = new Date().toISOString().slice(0, 10);

    const from = exportTodayOnly ? today : exportFrom;
    const to = exportTodayOnly ? today : exportTo;

    if (!from || !to) {
      toast.error("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }

    // ✅ luôn dùng stations gốc, KHÔNG phụ thuộc search/filter ngoài UI
    const baseStations = stations;

    // helper: check range ISO
    const inRange = (isoStr: string) => {
      const time = new Date(isoStr).getTime();
      const f = new Date(from).setHours(0, 0, 0, 0);
      const t = new Date(to).setHours(23, 59, 59, 999);
      return time >= f && time <= t;
    };

    // ✅ incidents trong range
    const incidentsFiltered = baseStations.filter(
      (s) => s.status === "stopped" && inRange(String(s.lastUpdateISO || "")),
    );

    // ✅ stats theo ngày trong range
    const map = new Map<
      string,
      { total: number; running: number; stopped: number }
    >();

    baseStations.forEach((s) => {
      const iso = String(s.lastUpdateISO || "");
      if (!iso) return;
      if (!inRange(iso)) return;

      const dateKey = new Date(iso).toLocaleDateString("vi-VN");

      if (!map.has(dateKey)) {
        map.set(dateKey, { total: 0, running: 0, stopped: 0 });
      }

      const row = map.get(dateKey)!;
      row.total += 1;
      if (s.status === "running") row.running += 1;
      if (s.status === "stopped") row.stopped += 1;
    });

    const statsRange = Array.from(map.entries()).map(([date, v]) => ({
      Ngày: date,
      "Tổng băng truyền": v.total,
      "Đang chạy": v.running,
      "Đang lỗi": v.stopped,
    }));

    console.log("EXPORT:", { from, to });
    console.log("stations:", baseStations.length);
    console.log("statsRange rows:", statsRange.length);
    console.log("incidentsFiltered rows:", incidentsFiltered.length);

    // ✅ nếu rỗng thì báo rõ
    if (statsRange.length === 0 && incidentsFiltered.length === 0) {
      toast.warning("Khoảng ngày này không có dữ liệu để xuất!");
    }

    const wb = XLSX.utils.book_new();

    // ✅ Sheet 1: luôn có header
    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Ngày", "Tổng băng truyền", "Đang chạy", "Đang lỗi"],
    ]);
    if (statsRange.length > 0) {
      XLSX.utils.sheet_add_json(ws1, statsRange, {
        origin: "A2",
        skipHeader: true,
      });
    }

    // ✅ Sheet 2: luôn có header
    const ws2 = XLSX.utils.aoa_to_sheet([
      ["Tên băng truyền", "Khu vực", "Cập nhật lúc", "Mô tả sự cố"],
    ]);
    if (incidentsFiltered.length > 0) {
      XLSX.utils.sheet_add_json(
        ws2,
        incidentsFiltered.map((s) => ({
          "Tên băng truyền": s.name,
          "Khu vực": s.area,
          "Cập nhật lúc": s.lastUpdate,
          "Mô tả sự cố": s.issue,
        })),
        { origin: "A2", skipHeader: true },
      );
    }

    XLSX.utils.book_append_sheet(wb, ws1, "ThongKeTheoNgay");
    XLSX.utils.book_append_sheet(wb, ws2, "SuCoTrongKhoang");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, `Andon_ThongKe_${from}_to_${to}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="rounded-2xl border bg-gradient-to-r from-white to-gray-50 shadow-sm p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Andon Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Giám sát băng truyền theo thời gian thực
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm băng truyền / khu vực..."
            className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border bg-white shadow-sm p-4">
        <AndonSummary />
      </div>

      <Tabs defaultValue="stations" className="w-full">
        <div className="sticky top-3 z-50">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 rounded-2xl bg-gray-100 p-1 shadow-inner">
            <TabsTrigger
              value="stations"
              className="rounded-xl flex items-center gap-2"
            >
              <LayoutGrid className="size-4" />
              Băng truyền
            </TabsTrigger>

            <TabsTrigger
              value="incidents"
              className="rounded-xl flex items-center gap-2"
            >
              <AlertTriangle className="size-4" />
              Sự cố
              {incidentStations.length > 0 && (
                <Badge className="ml-2 bg-red-600">
                  {incidentStations.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="analytics"
              className="rounded-xl flex items-center gap-2"
            >
              <BarChart3 className="size-4" />
              Phân tích
            </TabsTrigger>

            <TabsTrigger
              value="statistics"
              className="rounded-xl flex items-center gap-2"
            >
              <Table2 className="size-4" />
              Thống kê
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB Băng truyền */}
        <TabsContent value="stations" className="mt-6">
          {loadingStations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {stationsByFactory.map((factory) => (
                <div key={factory.factoryName} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Factory className="size-4 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {factory.factoryName}
                    </h2>
                    <Badge className="bg-gray-900 text-white">
                      {factory.list.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {factory.list.map((station) => (
                        <motion.div
                          key={station.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedId(Number(station.id));
                            setOpenDetail(true);
                          }}
                        >
                          <div className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-2">
                            <AndonStation {...station} onAssign={undefined} />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              {stationsByFactory.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  Không có dữ liệu băng truyền
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB Sự cố */}
        <TabsContent value="incidents" className="mt-6">
          {incidentStations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidentStations.map((station) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border bg-red-50 shadow-sm hover:shadow-md transition cursor-pointer p-2"
                  onClick={() => {
                    setSelectedId(Number(station.id));
                    setOpenDetail(true);
                  }}
                >
                  <AndonStation
                    {...station}
                    onAssign={() => handleAssignTechnician(station.id)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-white shadow-sm p-10 text-center">
              <div className="size-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                <span className="text-green-600 text-xl">✓</span>
              </div>

              <p className="text-base font-semibold text-gray-800">
                Không có sự cố
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Hệ thống đang hoạt động ổn định, chưa ghi nhận cảnh báo nào.
              </p>
            </div>
          )}
        </TabsContent>

        {/* TAB analytics */}
        <TabsContent value="analytics" className="mt-6">
          <div className="rounded-2xl border bg-white shadow-sm p-4">
            <AndonStats
              dailyIncidents={dailyIncidentsData}
              statusDistribution={statusDistribution}
            />
          </div>
        </TabsContent>

        {/* TAB thống kê */}
        <TabsContent value="statistics" className="mt-6 space-y-6">
          {/* KPI mini */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-white shadow-sm p-5">
              <p className="text-sm text-gray-500">Tổng băng truyền</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stations.length}
              </p>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm p-5">
              <p className="text-sm text-gray-500">Đang chạy</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {normalStations}
              </p>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm p-5">
              <p className="text-sm text-gray-500">Đang lỗi</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {incidentStations.length}
              </p>
            </div>
          </div>

          {/* Export Range UI */}
          <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Xuất thống kê Excel
              </h2>
              <p className="text-sm text-gray-500">
                Chọn khoảng thời gian để xuất dữ liệu
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={exportTodayOnly}
                  onChange={(e) => setExportTodayOnly(e.target.checked)}
                />
                Chỉ hôm nay
              </label>

              {!exportTodayOnly && (
                <>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Từ ngày</span>
                    <input
                      type="date"
                      value={exportFrom}
                      onChange={(e) => setExportFrom(e.target.value)}
                      className="border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Đến ngày</span>
                    <input
                      type="date"
                      value={exportTo}
                      onChange={(e) => setExportTo(e.target.value)}
                      className="border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              <Button
                onClick={exportStatisticsExcel}
                className="bg-green-600 hover:bg-green-700 rounded-xl"
              >
                Xuất Excel
              </Button>
            </div>
          </div>

          {/* TABLE theo ngày (CLICK XEM FULL CONVEYOR TRONG NGÀY) */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold text-gray-900">
                Thống kê theo ngày (Xem chi tiết)
              </h2>
              <p className="text-sm text-gray-500">
                Bấm vào ngày để xem toàn bộ conveyor trong ngày đó
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Ngày</th>
                    <th className="px-4 py-3 text-center">Tổng</th>
                    <th className="px-4 py-3 text-center">Đang chạy</th>
                    <th className="px-4 py-3 text-center">Đang lỗi</th>
                    <th className="px-4 py-3 text-right">Chi tiết</th>
                  </tr>
                </thead>

                <tbody>
                  {statsByDate.map((row) => {
                    const isOpen = expandedDate === row.date;

                    return (
                      <>
                        <tr
                          key={row.date}
                          className="border-t hover:bg-gray-50 transition cursor-pointer"
                          onClick={() =>
                            setExpandedDate((prev) =>
                              prev === row.date ? null : row.date,
                            )
                          }
                        >
                          <td className="px-4 py-3 font-medium">{row.date}</td>
                          <td className="px-4 py-3 text-center">{row.total}</td>
                          <td className="px-4 py-3 text-center text-green-600 font-semibold">
                            {row.running}
                          </td>
                          <td className="px-4 py-3 text-center text-red-600 font-semibold">
                            {row.stopped}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-blue-600 font-medium hover:underline">
                              {isOpen ? "Ẩn" : "Xem"}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="border-t bg-gray-50/40">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                                <div className="p-3 border-b flex items-center justify-between">
                                  <p className="text-sm font-semibold text-gray-900">
                                    Danh sách băng truyền ngày {row.date}
                                  </p>
                                  <Badge className="bg-gray-900 text-white">
                                    {row.conveyors.length} conveyor
                                  </Badge>
                                </div>

                                <div className="max-h-[360px] overflow-auto">
                                  <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50 text-gray-600 z-10">
                                      <tr>
                                        <th className="px-4 py-3 text-left">
                                          Tên
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                          Khu vực
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                          Trạng thái
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                          Cập nhật
                                        </th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {row.conveyors.map((c) => (
                                        <tr
                                          key={c.id}
                                          className="border-t hover:bg-gray-50 cursor-pointer"
                                          onClick={() => {
                                            setSelectedId(Number(c.id));
                                            setOpenDetail(true);
                                          }}
                                        >
                                          <td className="px-4 py-3 font-medium">
                                            {c.name}
                                          </td>
                                          <td className="px-4 py-3">
                                            {c.area}
                                          </td>
                                          <td className="px-4 py-3">
                                            {c.status === "running" ? (
                                              <Badge className="bg-green-600 text-white">
                                                Running
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-red-600 text-white">
                                                Stopped
                                              </Badge>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-gray-500">
                                            {c.lastUpdate}
                                          </td>
                                        </tr>
                                      ))}

                                      {row.conveyors.length === 0 && (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-gray-500"
                                          >
                                            Không có conveyor trong ngày này
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}

                  {statsByDate.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE lỗi */}
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Danh sách băng truyền đang lỗi
                </h2>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    value={statsSearch}
                    onChange={(e) => {
                      setStatsSearch(e.target.value);
                      setStatsPage(1);
                    }}
                    placeholder="Tìm tên / khu vực / mô tả..."
                    className="w-full rounded-xl border bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-gray-600 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left">Tên</th>
                    <th className="px-4 py-3 text-left">Khu vực</th>
                    <th className="px-4 py-3 text-left">Cập nhật</th>
                    <th className="px-4 py-3 text-left">Mô tả</th>
                  </tr>
                </thead>

                <tbody>
                  {incidentPaged.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => {
                        setSelectedId(Number(s.id));
                        setOpenDetail(true);
                      }}
                    >
                      <td className="px-4 py-3 font-semibold text-red-600">
                        {s.name}
                      </td>
                      <td className="px-4 py-3">{s.area}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.lastUpdate}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.issue}</td>
                    </tr>
                  ))}

                  {incidentPaged.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        Không có dữ liệu phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Trang {statsPage}/{incidentTotalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={statsPage <= 1}
                  onClick={() => setStatsPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-40"
                >
                  Trước
                </button>

                <button
                  disabled={statsPage >= incidentTotalPages}
                  onClick={() =>
                    setStatsPage((p) => Math.min(incidentTotalPages, p + 1))
                  }
                  className="rounded-xl border bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog chi tiết */}
      <ConveyorDetailDialog
        open={openDetail}
        conveyorId={selectedId}
        onClose={() => setOpenDetail(false)}
      />

      {/* Assign dialog */}
      <AssignTechnicianDialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) setSelectedStation(null);
        }}
        stationName={selectedStation?.name || ""}
        stationIssue={selectedStation?.issue}
        technicians={technicians.map((t) => ({
          id: String(t.id),
          name: t.name,
          specialty: t.department,
          status: t.status,
        }))}
        onAssign={(ids) => handleAssignConfirm(ids)}
      />

      {assignDialogOpen && loadingTechs && (
        <div className="text-xs text-gray-500">Đang tải danh sách Fixer...</div>
      )}
    </div>
  );
}
