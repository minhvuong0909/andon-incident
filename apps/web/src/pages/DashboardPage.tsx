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
  Download,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
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

async function fetchConveyorsApi() {
  const res = await fetch(`${API_BASE}/conveyor`, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch conveyors failed");
  const json: ApiResponse<ConveyorApi> = await res.json();
  return json.result || [];
}

async function fetchConveyorsByFactoryApi(factoryId: number) {
  const res = await fetch(`${API_BASE}/conveyor/factory/${factoryId}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Fetch conveyors by factory failed");
  const json: ApiResponse<ConveyorApi> = await res.json();
  return json.result || [];
}

async function fetchFixersApi() {
  const res = await fetch(`${API_BASE}/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch users failed");

  const json: ApiResponse<Technician> = await res.json();

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

function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-3 animate-pulse">
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
      <div className="h-20 bg-gray-100 rounded-xl" />
    </div>
  );
}

function speakVN(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "vi-VN";
  utter.rate = 1;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

type StationWithISO = AndonStationProps & {
  lastUpdateISO?: string;
};

export function DashboardPage() {
  const role = String(localStorage.getItem("userRole") || "").toLowerCase();
  const factoryId = Number(localStorage.getItem("factoryId"));

  const isStaff = role === "staff";

  const allowedTabs = useMemo(() => {
    if (isStaff) return ["stations"];
    return ["stations", "incidents", "analytics", "statistics"];
  }, [isStaff]);

  const [tabValue, setTabValue] = useState<string>(allowedTabs[0]);

  useEffect(() => {
    if (!allowedTabs.includes(tabValue)) {
      setTabValue(allowedTabs[0]);
    }
  }, [allowedTabs, tabValue]);

  const [conveyors, setConveyors] = useState<ConveyorApi[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] =
    useState<AndonStationProps | null>(null);

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [, setLoadingTechs] = useState(false);

  const [readyAssignmentMap, setReadyAssignmentMap] = useState<
    Record<number, number>
  >({});

  const [search, setSearch] = useState("");
  const [statsSearch, setStatsSearch] = useState("");
  const [statsPage, setStatsPage] = useState(1);
  const pageSize = 10;

  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportTodayOnly, setExportTodayOnly] = useState(true);

  const [alertCountMap, setAlertCountMap] = useState<Record<string, number>>(
    {},
  );
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let fetching = false;

    const fetchConveyors = async () => {
      if (fetching) return;
      fetching = true;

      try {
        let list: ConveyorApi[] = [];

        if (isStaff) {
          if (!factoryId || Number.isNaN(factoryId)) {
            console.error("❌ Staff không có factoryId trong localStorage");
            toast.error("Staff thiếu factoryId, vui lòng đăng nhập lại!");
            return;
          }
          list = await fetchConveyorsByFactoryApi(factoryId);
        } else {
          list = await fetchConveyorsApi();
        }

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
  }, [isStaff, factoryId]);

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

  const stations: StationWithISO[] = useMemo(() => {
    return latestConveyors.map((c) => ({
      id: String(c.id),
      name: c.name,
      area: `Xưởng ${c.factory_id}`,
      lastUpdate: new Date(c.created_at).toLocaleString("vi-VN"),
      lastUpdateISO: c.created_at,
      status: c.status === "running" ? "running" : "stopped",
      issue:
        c.status === "stopped"
          ? "Băng truyền đang dừng"
          : "Băng truyền hoạt động bình thường",
    }));
  }, [latestConveyors]);

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

      const map: Record<number, number> = {};
      for (const a of readyAssignments) map[a.user_id] = a.id;
      setReadyAssignmentMap(map);

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

    const sorted = Array.from(map.entries()).sort((a, b) => {
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

  useEffect(() => {
    if (isStaff) return;

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
  }, [stations, alertCountMap, isStaff]);

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

  const exportStatisticsExcel = () => {
    const today = new Date().toISOString().slice(0, 10);

    const from = exportTodayOnly ? today : exportFrom;
    const to = exportTodayOnly ? today : exportTo;

    if (!from || !to) {
      toast.error("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }

    const baseStations = stations;

    const inRange = (isoStr: string) => {
      const time = new Date(isoStr).getTime();
      const f = new Date(from).setHours(0, 0, 0, 0);
      const t = new Date(to).setHours(23, 59, 59, 999);
      return time >= f && time <= t;
    };

    const incidentsFiltered = baseStations.filter(
      (s) => s.status === "stopped" && inRange(String(s.lastUpdateISO || "")),
    );

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

    if (statsRange.length === 0 && incidentsFiltered.length === 0) {
      toast.warning("Khoảng ngày này không có dữ liệu để xuất!");
    }

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Ngày", "Tổng băng truyền", "Đang chạy", "Đang lỗi"],
    ]);
    if (statsRange.length > 0) {
      XLSX.utils.sheet_add_json(ws1, statsRange, {
        origin: "A2",
        skipHeader: true,
      });
    }

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
      {/* Header Section with Gradient */}
      <div className="rounded-2xl border bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-lg p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-3 shadow-lg">
              <Activity className="size-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Andon Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Giám sát băng truyền theo thời gian thực
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm băng truyền hoặc khu vực..."
              className="w-full rounded-2xl border-2 border-gray-200 bg-white pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="rounded-2xl border bg-white shadow-lg p-6">
        <AndonSummary />
      </div>

      {/* Tabs */}
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <div className="sticky top-20 z-40 pb-4 ">
          <TabsList
            className={`grid w-full max-w-3xl mx-auto ${
              allowedTabs.length === 1 ? "grid-cols-1" : "grid-cols-4"
            } rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 p-0.5 shadow-md border`}
          >
            <TabsTrigger
              value="stations"
              className="rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
            >
              <LayoutGrid className="size-4" />
              <span className="font-semibold">Băng truyền</span>
            </TabsTrigger>

            {!isStaff && (
              <>
                <TabsTrigger
                  value="incidents"
                  className="rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                >
                  <AlertTriangle className="size-4" />
                  <span className="font-semibold">Sự cố</span>
                  {incidentStations.length > 0 && (
                    <Badge className="ml-1 bg-red-600 text-white shadow-sm">
                      {incidentStations.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="analytics"
                  className="rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                >
                  <BarChart3 className="size-4" />
                  <span className="font-semibold">Phân tích</span>
                </TabsTrigger>

                <TabsTrigger
                  value="statistics"
                  className="rounded-xl flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                >
                  <Table2 className="size-4" />
                  <span className="font-semibold">Thống kê</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* Stations Tab */}
        <TabsContent value="stations" className="mt-6">
          {loadingStations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {stationsByFactory.map((factory) => (
                <div key={factory.factoryName} className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-2 shadow-md">
                      <Factory className="size-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {factory.factoryName}
                    </h2>
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                      {factory.list.length} thiết bị
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {factory.list.map((station) => (
                        <motion.div
                          key={station.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="cursor-pointer group"
                          onClick={() => {
                            setSelectedId(Number(station.id));
                            setOpenDetail(true);
                          }}
                        >
                          <div className="rounded-2xl border-2 bg-white shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 p-3 group-hover:scale-[1.02]">
                            <AndonStation {...station} onAssign={undefined} />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              {stationsByFactory.length === 0 && (
                <div className="text-center py-20 rounded-2xl border-2 border-dashed bg-gray-50">
                  <Activity className="size-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-500">
                    Không có dữ liệu băng truyền
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {!isStaff && (
          <>
            {/* Incidents Tab */}
            <TabsContent value="incidents" className="mt-6">
              {incidentStations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incidentStations.map((station) => (
                    <motion.div
                      key={station.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-all cursor-pointer p-3"
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
                <div className="rounded-2xl border-2 bg-gradient-to-br from-green-50 to-white shadow-lg p-16 text-center">
                  <div className="size-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg">
                    <CheckCircle2 className="size-10 text-white" />
                  </div>

                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    Hệ thống hoạt động ổn định
                  </p>

                  <p className="text-gray-600">
                    Tất cả băng truyền đang vận hành bình thường
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="rounded-2xl border bg-white shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-2 shadow-md">
                    <TrendingUp className="size-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Phân tích hiệu suất
                  </h2>
                </div>
                <AndonStats
                  dailyIncidents={dailyIncidentsData}
                  statusDistribution={statusDistribution}
                />
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="mt-6 space-y-6">
              {/* Export Section */}
              <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-white shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-2.5 shadow-md">
                      <Download className="size-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">
                        Xuất báo cáo Excel
                      </h2>
                      <p className="text-sm text-gray-600">
                        Chọn khoảng thời gian để tải xuống dữ liệu thống kê
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-xl border-2 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={exportTodayOnly}
                        onChange={(e) => setExportTodayOnly(e.target.checked)}
                        className="size-4 rounded"
                      />
                      Chỉ hôm nay
                    </label>

                    {!exportTodayOnly && (
                      <>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                            <Calendar className="size-3" />
                            Từ ngày
                          </label>
                          <input
                            type="date"
                            value={exportFrom}
                            onChange={(e) => setExportFrom(e.target.value)}
                            className="border-2 rounded-xl px-3 py-2 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                            <Calendar className="size-3" />
                            Đến ngày
                          </label>
                          <input
                            type="date"
                            value={exportTo}
                            onChange={(e) => setExportTo(e.target.value)}
                            className="border-2 rounded-xl px-3 py-2 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                          />
                        </div>
                      </>
                    )}

                    <Button
                      onClick={exportStatisticsExcel}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl shadow-md hover:shadow-lg transition-all px-6 py-2.5 font-semibold"
                    >
                      <Download className="size-4 mr-2" />
                      Xuất Excel
                    </Button>
                  </div>
                </div>
              </div>

              {/* Daily Stats Table */}
              <div className="rounded-2xl border bg-white shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="size-5 text-blue-600" />
                    Thống kê theo ngày
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Click vào từng ngày để xem chi tiết băng truyền
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold">Ngày</th>
                        <th className="px-6 py-4 text-center font-bold">
                          Tổng
                        </th>
                        <th className="px-6 py-4 text-center font-bold">
                          <span className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="size-4 text-green-600" />
                            Đang chạy
                          </span>
                        </th>
                        <th className="px-6 py-4 text-center font-bold">
                          <span className="flex items-center justify-center gap-1">
                            <XCircle className="size-4 text-red-600" />
                            Đang lỗi
                          </span>
                        </th>
                        <th className="px-6 py-4 text-right font-bold">
                          Chi tiết
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {statsByDate.map((row) => {
                        const isOpen = expandedDate === row.date;

                        return (
                          <>
                            <tr
                              key={row.date}
                              className="border-t hover:bg-blue-50 transition-colors cursor-pointer"
                              onClick={() =>
                                setExpandedDate((prev) =>
                                  prev === row.date ? null : row.date,
                                )
                              }
                            >
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {row.date}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge className="bg-gray-900 text-white">
                                  {row.total}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  {row.running}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge className="bg-red-100 text-red-700 border-red-200">
                                  {row.stopped}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  className="text-blue-600 font-semibold hover:bg-blue-100 rounded-lg"
                                >
                                  {isOpen ? "Ẩn bớt" : "Xem chi tiết"}
                                </Button>
                              </td>
                            </tr>

                            {isOpen && (
                              <tr className="border-t bg-gray-50">
                                <td colSpan={5} className="px-6 py-6">
                                  <div className="rounded-xl border-2 bg-white shadow-md overflow-hidden">
                                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                                      <p className="font-bold text-gray-900">
                                        Chi tiết ngày {row.date}
                                      </p>
                                      <Badge className="bg-blue-600 text-white shadow-sm">
                                        {row.conveyors.length} băng truyền
                                      </Badge>
                                    </div>

                                    <div className="max-h-96 overflow-auto">
                                      <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-gray-100 text-gray-700 z-10">
                                          <tr>
                                            <th className="px-4 py-3 text-left font-semibold">
                                              Tên băng truyền
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold">
                                              Khu vực
                                            </th>
                                            <th className="px-4 py-3 text-center font-semibold">
                                              Trạng thái
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold">
                                              Cập nhật lúc
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {row.conveyors.map((c) => (
                                            <tr
                                              key={c.id}
                                              className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                                              onClick={() => {
                                                setSelectedId(Number(c.id));
                                                setOpenDetail(true);
                                              }}
                                            >
                                              <td className="px-4 py-3 font-semibold text-gray-900">
                                                {c.name}
                                              </td>
                                              <td className="px-4 py-3 text-gray-700">
                                                {c.area}
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                {c.status === "running" ? (
                                                  <Badge className="bg-green-600 text-white shadow-sm">
                                                    Hoạt động
                                                  </Badge>
                                                ) : (
                                                  <Badge className="bg-red-600 text-white shadow-sm animate-pulse">
                                                    Dừng
                                                  </Badge>
                                                )}
                                              </td>
                                              <td className="px-4 py-3 text-gray-600">
                                                {c.lastUpdate}
                                              </td>
                                            </tr>
                                          ))}
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
                            className="px-6 py-16 text-center text-gray-500"
                          >
                            <Activity className="size-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-semibold">Chưa có dữ liệu</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Incidents Table */}
              <div className="rounded-2xl border bg-white shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gradient-to-r from-red-50 to-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="size-5 text-red-600" />
                      Băng truyền đang gặp sự cố
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Danh sách các băng truyền đang dừng hoạt động
                    </p>
                  </div>

                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      value={statsSearch}
                      onChange={(e) => {
                        setStatsSearch(e.target.value);
                        setStatsPage(1);
                      }}
                      placeholder="Tìm kiếm sự cố..."
                      className="w-full rounded-xl border-2 bg-white pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 z-10">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold">
                          Tên băng truyền
                        </th>
                        <th className="px-6 py-4 text-left font-bold">
                          Khu vực
                        </th>
                        <th className="px-6 py-4 text-left font-bold">
                          Thời gian
                        </th>
                        <th className="px-6 py-4 text-left font-bold">Mô tả</th>
                      </tr>
                    </thead>

                    <tbody>
                      {incidentPaged.map((s) => (
                        <tr
                          key={s.id}
                          className="border-t cursor-pointer hover:bg-red-50 transition-colors"
                          onClick={() => {
                            setSelectedId(Number(s.id));
                            setOpenDetail(true);
                          }}
                        >
                          <td className="px-6 py-4">
                            <span className="font-bold text-red-600">
                              {s.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{s.area}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {s.lastUpdate}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{s.issue}</td>
                        </tr>
                      ))}

                      {incidentPaged.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-16 text-center text-gray-500"
                          >
                            <CheckCircle2 className="size-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-semibold">Không có sự cố nào</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {incidentTotalPages > 1 && (
                  <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                    <p className="text-sm text-gray-600 font-medium">
                      Trang {statsPage} / {incidentTotalPages}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        disabled={statsPage <= 1}
                        onClick={() => setStatsPage((p) => Math.max(1, p - 1))}
                        className="rounded-xl disabled:opacity-40 font-semibold"
                      >
                        ← Trước
                      </Button>

                      <Button
                        variant="outline"
                        disabled={statsPage >= incidentTotalPages}
                        onClick={() =>
                          setStatsPage((p) =>
                            Math.min(incidentTotalPages, p + 1),
                          )
                        }
                        className="rounded-xl disabled:opacity-40 font-semibold"
                      >
                        Sau →
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Dialogs */}
      <ConveyorDetailDialog
        open={openDetail}
        conveyorId={selectedId}
        onClose={() => setOpenDetail(false)}
      />

      {!isStaff && (
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
      )}
    </div>
  );
}
