import { useEffect, useMemo, useRef, useState } from "react";
import {
  Wrench,
  Clock,
  CheckCircle2,
  Search,
  Users,
  ClipboardList,
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
    <div className="rounded-2xl border bg-white shadow-sm p-4 animate-pulse space-y-3">
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
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

  // UI state
  const [search, setSearch] = useState("");
  const [factoryFilter, setFactoryFilter] = useState<string>("all");

  // ✅ cache để tránh giật khi polling
  const prevUsersRef = useRef<User[]>([]);
  const prevAssignmentsRef = useRef<Assignment[]>([]);

  // ✅ realtime polling (nhưng không setState nếu data giống nhau)
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

        // ✅ chỉ set state khi data thay đổi => đỡ giật UI
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

  // ✅ chỉ lấy Fixer Active
  const technicians = useMemo(() => {
    return users.filter((u) => u.role === "Fixer" && u.status === "Active");
  }, [users]);

  // ✅ filter + search
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

  // ✅ chỉ lấy assignment đang Assigned
  const activeAssignments = useMemo(() => {
    return assignments.filter((a) => a.status === "Assigned");
  }, [assignments]);

  // ✅ fetch conveyor name (có cache tránh gọi spam)
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
              // tránh re-render nếu đã có
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAssignments]);

  const totalTechnicians = technicians.length;
  const totalActiveJobs = activeAssignments.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="rounded-3xl border bg-white shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Quản lý Thợ Sửa Chữa
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi thợ sửa chữa & công việc đang được phân công theo thời
              gian thực
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm thợ sửa chữa</DialogTitle>
                <DialogDescription>
                  Nhập thông tin thợ sửa chữa mới vào hệ thống
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input id="name" placeholder="Nguyễn Văn A" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Phòng ban</Label>
                  <Input id="department" placeholder="Bảo trì / Cơ điện..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Xưởng</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn xưởng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Xưởng 1</SelectItem>
                      <SelectItem value="2">Xưởng 2</SelectItem>
                      <SelectItem value="3">Xưởng 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full rounded-2xl">
                  Thêm vào hệ thống
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 rounded-3xl shadow-sm border bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng thợ</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {totalTechnicians}
                </p>
              </div>
              <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center border">
                <Users className="size-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl shadow-sm border bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang được phân công</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {totalActiveJobs}
                </p>
              </div>
              <div className="size-12 rounded-2xl bg-yellow-50 flex items-center justify-center border">
                <Wrench className="size-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-3xl shadow-sm border bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Realtime</p>
                <p className="text-3xl font-bold text-green-600 mt-1">ON</p>
              </div>
              <div className="size-12 rounded-2xl bg-green-50 flex items-center justify-center border">
                <CheckCircle2 className="size-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters (sticky để kéo xuống vẫn đẹp) */}
        <div className="sticky top-3 z-30">
          <div className="rounded-3xl border bg-white/80 backdrop-blur-xl shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="size-4 text-gray-400 absolute left-3 top-3" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc username..."
                className="pl-9 rounded-2xl"
              />
            </div>

            <div className="w-full md:w-[220px]">
              <Select value={factoryFilter} onValueChange={setFactoryFilter}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Lọc theo xưởng" />
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

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Technicians */}
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-gray-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Danh sách người sửa
                </h3>
              </div>

              {loading && (
                <span className="text-xs text-gray-500">Đang tải...</span>
              )}
            </div>

            <div className="p-4 space-y-3 max-h-[560px] overflow-auto">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!loading && filteredTechnicians.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Không có thợ nào phù hợp
                </div>
              )}

              {!loading &&
                filteredTechnicians.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {t.name}
                          </h4>

                          <Badge variant="secondary" className="rounded-xl">
                            Thợ
                          </Badge>

                          <Badge className="bg-blue-600 text-white rounded-xl">
                            Xưởng {t.factory_id}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          {t.department} • @{t.username}
                        </p>
                      </div>

                      <Badge className="rounded-xl bg-green-600 text-white">
                        Hoạt động
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Assignments */}
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 text-gray-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Công việc đang thực hiện
                </h3>
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-[560px] overflow-auto">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!loading && activeAssignments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Không có công việc nào đang được phân công
                </div>
              )}

              {!loading &&
                activeAssignments.map((job) => {
                  const tech = technicians.find((u) => u.id === job.user_id);

                  return (
                    <div
                      key={job.id}
                      className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {conveyorNameMap[job.conveyor_id] ||
                                `Conveyor #${job.conveyor_id}`}
                            </h4>

                            <p className="text-sm text-gray-600 mt-1">
                              Đang xử lý bởi:{" "}
                              <span className="font-medium text-gray-800">
                                {tech?.name || "Chưa rõ"}
                              </span>
                            </p>
                          </div>

                          <Badge className="rounded-xl bg-yellow-600 text-white">
                            Assigned
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="size-3" />
                          <span>
                            Gán lúc: {new Date(job.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
