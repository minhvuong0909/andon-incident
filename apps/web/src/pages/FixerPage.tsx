import { useEffect, useMemo, useRef, useState } from "react";
import {
  Wrench,
  Clock,
  CheckCircle2,
  Search,
  Users,
  ClipboardList,
  UserPlus,
  Activity,
  Filter,
  User,
  MapPin,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

type UserRole = "Staff" | "Admin" | "Fixer";
type UserStatus = "Active" | "Inactive";
type AssignmentStatus = "Assigned" | "Done";

export interface User {
  id: number;
  factory_id: number;
  department: string;
  name: string;
  username: string;
  password: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
}

export interface Assignment {
  id: number;
  user_id: number;
  conveyor_id: number;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
}

type ApiResponse<T> = {
  result: T[];
};

function shallowEqualJson(a: any, b: any) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border bg-gradient-to-r from-gray-50 to-white shadow-sm p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export function TechniciansPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [conveyorNameMap, setConveyorNameMap] = useState<
    Record<number, string>
  >({});

  const [search, setSearch] = useState("");
  const [factoryFilter, setFactoryFilter] = useState<string>("all");

  const prevUsersRef = useRef<User[]>([]);
  const prevAssignmentsRef = useRef<Assignment[]>([]);

  useEffect(() => {
    let isMounted = true;
    let fetching = false;

    const fetchAll = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const [userRes, assignmentRes] = await Promise.all([
          fetch("http://localhost:4000/users", { cache: "no-store" }),
          fetch("http://localhost:4000/assignment", { cache: "no-store" }),
        ]);

        if (!userRes.ok) throw new Error("Fetch users failed");
        if (!assignmentRes.ok) throw new Error("Fetch assignments failed");

        const userJson: ApiResponse<User> = await userRes.json();
        const assignmentJson: ApiResponse<Assignment> =
          await assignmentRes.json();

        const nextUsers = userJson.result || [];
        const nextAssignments = assignmentJson.result || [];

        if (isMounted) {
          if (!shallowEqualJson(prevUsersRef.current, nextUsers)) {
            prevUsersRef.current = nextUsers;
            setUsers(nextUsers);
          }

          if (!shallowEqualJson(prevAssignmentsRef.current, nextAssignments)) {
            prevAssignmentsRef.current = nextAssignments;
            setAssignments(nextAssignments);
          }
        }
      } catch (err) {
        console.error("API error:", err);
      } finally {
        fetching = false;
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const technicians = useMemo(() => {
    return users.filter((u) => u.role === "Fixer" && u.status === "Active");
  }, [users]);

  const filteredTechnicians = useMemo(() => {
    const q = search.trim().toLowerCase();

    return technicians.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q);

      const matchFactory =
        factoryFilter === "all" ? true : String(t.factory_id) === factoryFilter;

      return matchSearch && matchFactory;
    });
  }, [technicians, search, factoryFilter]);

  const activeAssignments = useMemo(() => {
    return assignments.filter((a) => a.status === "Assigned");
  }, [assignments]);

  const getConveyorById = async (id: number) => {
    const res = await fetch(`http://localhost:4000/conveyor/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Fetch conveyor failed");
    return res.json();
  };

  useEffect(() => {
    let cancelled = false;

    const loadConveyorNames = async () => {
      const conveyorIds = [
        ...new Set(activeAssignments.map((a) => a.conveyor_id)),
      ];

      for (const id of conveyorIds) {
        if (cancelled) return;
        if (conveyorNameMap[id]) continue;

        try {
          const data = await getConveyorById(id);
          const name = data?.conveyor?.name || `Conveyor #${id}`;

          if (!cancelled) {
            setConveyorNameMap((prev) => {
              if (prev[id]) return prev;
              return { ...prev, [id]: name };
            });
          }
        } catch (err) {
          console.log("getConveyorById error:", err);
        }
      }
    };

    loadConveyorNames();
    return () => {
      cancelled = true;
    };
  }, [activeAssignments, conveyorNameMap]);

  const totalTechnicians = technicians.length;
  const totalActiveJobs = activeAssignments.length;
  const availableTechs = totalTechnicians - totalActiveJobs;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 via-white to-blue-50 shadow-lg p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-3 shadow-lg">
              <Users className="size-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Quản lý Thợ Sửa Chữa
              </h1>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                Theo dõi thợ sửa chữa & công việc theo thời gian thực
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 rounded-2xl shadow-md border-2 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Tổng số thợ
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {totalTechnicians}
              </p>
              <p className="text-xs text-gray-500 mt-1">Đang hoạt động</p>
            </div>
            <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Users className="size-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-md border-2 bg-gradient-to-br from-yellow-50 to-white hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Đang bận
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {totalActiveJobs}
              </p>
              <p className="text-xs text-gray-500 mt-1">Công việc đang làm</p>
            </div>
            <div className="size-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-md">
              <Wrench className="size-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-md border-2 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Sẵn sàng
              </p>
              <p className="text-3xl font-bold text-green-600">
                {availableTechs}
              </p>
              <p className="text-xs text-gray-500 mt-1">Có thể phân công</p>
            </div>
            <div className="size-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <CheckCircle2 className="size-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-md border-2 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Trạng thái
              </p>
              <p className="text-3xl font-bold text-purple-600">LIVE</p>
              <p className="text-xs text-gray-500 mt-1">Cập nhật realtime</p>
            </div>
            <div className="size-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
              <Activity className="size-7 text-white animate-pulse" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section - Sticky */}
      <div className="sticky top-20 z-30">
        <div className="rounded-2xl border-2 bg-white/95 backdrop-blur-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="size-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo tên hoặc username..."
                className="pl-12 pr-4 py-3 rounded-xl border-2 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Filter className="size-4" />
                <span className="hidden md:inline">Lọc:</span>
              </div>
              <Select value={factoryFilter} onValueChange={setFactoryFilter}>
                <SelectTrigger className="w-full md:w-[200px] rounded-xl border-2 font-medium">
                  <SelectValue placeholder="Chọn xưởng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả xưởng</SelectItem>
                  <SelectItem value="1">Xưởng 1</SelectItem>
                  <SelectItem value="2">Xưởng 2</SelectItem>
                  <SelectItem value="3">Xưởng 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Technicians List */}
        <div className="rounded-2xl border-2 bg-white shadow-lg overflow-hidden">
          <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-2 shadow-md">
                  <Users className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Danh sách thợ
                  </h3>
                  <p className="text-xs text-gray-600">
                    {filteredTechnicians.length} thợ đang hoạt động
                  </p>
                </div>
              </div>

              {loading && (
                <Badge className="bg-blue-600 text-white animate-pulse">
                  Đang tải...
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[600px] overflow-auto">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && filteredTechnicians.length === 0 && (
              <div className="text-center py-16 rounded-2xl bg-gray-50">
                <User className="size-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-500">
                  Không tìm thấy thợ nào
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </div>
            )}

            {!loading &&
              filteredTechnicians.map((t) => {
                const isWorking = activeAssignments.some(
                  (a) => a.user_id === t.id,
                );

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border-2 bg-gradient-to-r from-white to-gray-50 p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                          {t.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-gray-900 truncate">
                              {t.name}
                            </h4>
                            {isWorking && (
                              <Badge className="bg-yellow-600 text-white text-[10px] px-2 py-0.5">
                                ĐANG LÀM
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <span className="font-medium">{t.department}</span>
                            <span>•</span>
                            <span>@{t.username}</span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold border-blue-200 text-blue-700 bg-blue-50"
                            >
                              <MapPin className="size-3 mr-1" />
                              Xưởng {t.factory_id}
                            </Badge>
                            <Badge className="bg-green-600 text-white text-xs font-semibold">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Active Assignments */}
        <div className="rounded-2xl border-2 bg-white shadow-lg overflow-hidden">
          <div className="p-5 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-2 shadow-md">
                  <ClipboardList className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Công việc đang làm
                  </h3>
                  <p className="text-xs text-gray-600">
                    {activeAssignments.length} nhiệm vụ đang thực hiện
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[600px] overflow-auto">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && activeAssignments.length === 0 && (
              <div className="text-center py-16 rounded-2xl bg-gray-50">
                <CheckCircle2 className="size-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-500">
                  Không có công việc nào
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Tất cả thợ đang rảnh và sẵn sàng nhận việc mới
                </p>
              </div>
            )}

            {!loading &&
              activeAssignments.map((job) => {
                const tech = technicians.find((u) => u.id === job.user_id);

                return (
                  <div
                    key={job.id}
                    className="rounded-2xl border-2 bg-gradient-to-r from-white to-yellow-50 p-4 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="size-4 text-yellow-600 flex-shrink-0" />
                            <h4 className="font-bold text-gray-900 truncate">
                              {conveyorNameMap[job.conveyor_id] ||
                                `Conveyor #${job.conveyor_id}`}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <User className="size-4 text-gray-500" />
                            <span className="text-gray-600">
                              Thợ:{" "}
                              <span className="font-semibold text-gray-900">
                                {tech?.name || "Chưa rõ"}
                              </span>
                            </span>
                          </div>
                        </div>

                        <Badge className="bg-yellow-600 text-white font-semibold shadow-sm">
                          Đang làm
                        </Badge>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="size-3.5" />
                          <span className="font-medium">
                            Bắt đầu:{" "}
                            {new Date(job.created_at).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Thêm thợ sửa chữa mới
            </DialogTitle>
            <DialogDescription>
              Nhập đầy đủ thông tin để thêm thợ vào hệ thống
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold">
                Họ và tên *
              </Label>
              <Input
                id="name"
                placeholder="Nguyễn Văn A"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="font-semibold">
                Phòng ban *
              </Label>
              <Input
                id="department"
                placeholder="Bảo trì, Cơ điện..."
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="factory" className="font-semibold">
                Xưởng *
              </Label>
              <Select>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Chọn xưởng làm việc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Xưởng 1</SelectItem>
                  <SelectItem value="2">Xưởng 2</SelectItem>
                  <SelectItem value="3">Xưởng 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 font-semibold shadow-md mt-6">
              <UserPlus className="size-4 mr-2" />
              Thêm vào hệ thống
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
