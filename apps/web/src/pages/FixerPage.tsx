import { useEffect, useMemo, useState } from "react";
import { UserPlus, Wrench, Clock, CheckCircle2, Search } from "lucide-react";

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
  DialogTrigger,
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

  // realtime polling
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

        if (isMounted) {
          setUsers(userJson.result || []);
          setAssignments(assignmentJson.result || []);
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

  // chỉ lấy Fixer
  const technicians = useMemo(() => {
    return users.filter((u) => u.role === "Fixer" && u.status === "Active");
  }, [users]);

  // filter + search
  const filteredTechnicians = useMemo(() => {
    return technicians.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.username.toLowerCase().includes(search.toLowerCase());

      const matchFactory =
        factoryFilter === "all" ? true : String(t.factory_id) === factoryFilter;

      return matchSearch && matchFactory;
    });
  }, [technicians, search, factoryFilter]);

  // map assignment -> thông tin hiển thị
  const activeAssignments = useMemo(() => {
    return assignments.filter((a) => a.status === "Assigned");
  }, [assignments]);
  // map conveyor id thành name
  const getConveyorById = async (id: number) => {
    const res = await fetch(`http://localhost:4000/conveyor/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Fetch conveyor failed");

    return res.json(); // trả về { result: { id, name } } hoặc gì đó
  };
  // thống kê UI
  useEffect(() => {
    const loadConveyorNames = async () => {
      const conveyorIds = [
        ...new Set(activeAssignments.map((a) => a.conveyor_id)),
      ];

      for (const id of conveyorIds) {
        if (conveyorNameMap[id]) continue;

        try {
          const data = await getConveyorById(id);

          const name = data?.conveyor?.name || `Conveyor #${id}`;

          setConveyorNameMap((prev) => ({
            ...prev,
            [id]: name,
          }));
        } catch (err) {
          console.log("getConveyorById error:", err);
        }
      }
    };

    loadConveyorNames();
  }, [activeAssignments]);

  const totalTechnicians = technicians.length;
  const totalActiveJobs = activeAssignments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Quản lý Thợ Sửa Chữa
          </h2>
          <p className="text-gray-600">
            Theo dõi Fixer & công việc đang được phân công
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild></DialogTrigger>

          <DialogContent>
            <DialogHeader>
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

              <Button className="w-full">Thêm vào hệ thống</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng thợ (Fixer)</p>
              <p className="text-3xl font-bold">{totalTechnicians}</p>
            </div>
            <UserPlus className="size-12 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đang được phân công</p>
              <p className="text-3xl font-bold text-yellow-600">
                {totalActiveJobs}
              </p>
            </div>
            <Wrench className="size-12 text-yellow-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Realtime</p>
              <p className="text-3xl font-bold text-green-600">ON</p>
            </div>
            <CheckCircle2 className="size-12 text-green-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="size-4 text-gray-400 absolute left-3 top-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc username..."
            className="pl-9"
          />
        </div>

        <div className="w-full md:w-[220px]">
          <Select value={factoryFilter} onValueChange={setFactoryFilter}>
            <SelectTrigger>
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

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technicians */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Danh sách người sửa</h3>
            {loading && (
              <span className="text-xs text-gray-500">Đang tải...</span>
            )}
          </div>

          <div className="space-y-3">
            {!loading && filteredTechnicians.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Không có thợ nào phù hợp
              </div>
            )}

            {filteredTechnicians.map((t) => (
              <Card
                key={t.id}
                className="p-4 rounded-2xl hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {t.name}
                      </h4>

                      <Badge variant="secondary">Fixer</Badge>
                      <Badge className="bg-blue-600">
                        Xưởng {t.factory_id}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600">
                      {t.department} • @{t.username}
                    </p>
                  </div>

                  <Badge variant="default">Active</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Assignments */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Công việc đang thực hiện
          </h3>

          <div className="space-y-3">
            {!loading && activeAssignments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Không có công việc nào đang được phân công
              </div>
            )}

            {activeAssignments.map((job) => {
              const tech = technicians.find((u) => u.id === job.user_id);

              return (
                <Card
                  key={job.id}
                  className="p-4 rounded-2xl hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {conveyorNameMap[job.conveyor_id] ||
                            `Conveyor #${job.conveyor_id}`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Đang xử lý bởi:{" "}
                          <span className="font-medium text-gray-800">
                            {tech?.name || "Chưa rõ"}
                          </span>
                        </p>
                      </div>

                      <Badge className="bg-yellow-600">Assigned</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="size-3" />
                      <span>
                        Gán lúc: {new Date(job.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
