import { useEffect, useMemo, useState } from "react";
import {
  AndonStation,
  type AndonStationProps,
} from "../components/AndonStation";
import { AndonSummary } from "../components/AndonSummary";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { AndonStats } from "../components/AndonStats";
import { ConveyorDetailDialog } from "../components/ConveyorDetailDialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { AssignTechnicianDialog } from "../components/AssignFixer";

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

// ✅ Assignment
type AssignmentStatus = "Ready" | "Assigned" | "Busy" | "Done";

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

async function fetchFixersApi() {
  const res = await fetch(`${API_BASE}/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch users failed");

  const json: ApiResponse<Technician> = await res.json();

  // ✅ chỉ lấy Fixer ACTIVE
  const fixers = (json.result || []).filter(
    (u) =>
      u.role?.toLowerCase() === "fixer" && u.status?.toLowerCase() === "active",
  );

  return fixers;
}

async function fetchAllAssignmentsApi() {
  const res = await fetch(`${API_BASE}/assignment`, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch assignments failed");

  const json: ApiResponse<AssignmentApi> = await res.json();
  return json.result || [];
}

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

  // ✅ Map user_id -> assignment_id (Ready)
  const [readyAssignmentMap, setReadyAssignmentMap] = useState<
    Record<number, number>
  >({});

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
  const stations: AndonStationProps[] = useMemo(() => {
    return latestConveyors.map((c) => ({
      id: String(c.id),
      name: c.name,
      area: `Xưởng ${c.factory_id}`,
      lastUpdate: new Date(c.created_at).toLocaleString(),
      status: c.status === "running" ? "running" : "stopped",
      issue:
        c.status === "stopped"
          ? "Băng truyền đang dừng"
          : "Băng truyền hoạt động bình thường",
    }));
  }, [latestConveyors]);

  const stationsByFactory = useMemo(() => {
    const map = new Map<string, AndonStationProps[]>();

    stations.forEach((s) => {
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
  }, [stations]);

  const incidentStations = useMemo(() => {
    return stations.filter((s) => s.status === "stopped");
  }, [stations]);

  const normalStations = useMemo(() => {
    return stations.filter((s) => s.status === "running").length;
  }, [stations]);

  const statusDistribution = useMemo(() => {
    return [
      { name: "Bình thường", value: normalStations, color: "#22c55e" },
      { name: "Sự cố", value: incidentStations.length, color: "#ef4444" },
    ];
  }, [normalStations, incidentStations.length]);

  // ======================
  // OPEN ASSIGN DIALOG
  // ✅ load fixer ACTIVE + assignment READY
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

      // ✅ READY assignments
      const readyAssignments = (assignments || []).filter(
        (a) => String(a.status || "").toLowerCase() === "ready",
      );

      // ✅ Map user_id -> assignment_id
      const map: Record<number, number> = {};
      for (const a of readyAssignments) {
        map[a.user_id] = a.id;
      }
      setReadyAssignmentMap(map);

      // ✅ Chỉ show fixers: Active + có assignment Ready
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

    // ✅ guard: map chưa có dữ liệu thì không cho assign
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
            status: "Assigned", // ✅ phải đúng enum backend (Assigned)
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
            console.error("Update assignment failed payload:", payload, data);
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

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <AndonSummary />
        </div>
      </div>

      <Tabs defaultValue="stations" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="stations">Băng truyền</TabsTrigger>

          <TabsTrigger value="incidents">
            Sự cố
            {incidentStations.length > 0 && (
              <Badge className="ml-2 bg-red-600">
                {incidentStations.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        {/* TAB Băng truyền (show full, KHÔNG phân công) */}
        <TabsContent value="stations" className="mt-6">
          {loadingStations ? (
            <div className="text-sm text-gray-500">
              Đang tải danh sách băng truyền...
            </div>
          ) : (
            <div className="space-y-6">
              {stationsByFactory.map((factory) => (
                <div key={factory.factoryName} className="space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {factory.factoryName}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {factory.list.map((station) => (
                      <div
                        key={station.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedId(Number(station.id));
                          setOpenDetail(true);
                        }}
                      >
                        <AndonStation
                          {...station}
                          onClick={() => {
                            setSelectedId(Number(station.id));
                            setOpenDetail(true);
                          }}
                          onAssign={undefined}
                        />
                      </div>
                    ))}
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
                <div
                  key={station.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedId(Number(station.id));
                    setOpenDetail(true);
                  }}
                >
                  <AndonStation
                    {...station}
                    onAssign={() => handleAssignTechnician(station.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="size-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
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
          <AndonStats
            dailyIncidents={dailyIncidentsData}
            statusDistribution={statusDistribution}
          />
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
