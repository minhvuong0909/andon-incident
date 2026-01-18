import { useState } from "react";

import { UserPlus, Wrench, Clock, CheckCircle2 } from "lucide-react";
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

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  status: "available" | "busy" | "offline";
  currentTask?: string;
  completedToday: number;
  avgResponseTime: string;
}

export interface Assignment {
  id: string;
  incidentId: string;
  technicianId: string;
  station: string;
  issue: string;
  assignedAt: string;
  status: "assigned" | "in-progress" | "completed";
  estimatedTime?: string;
}

const mockTechnicians: Technician[] = [
  {
    id: "t1",
    name: "Nguyễn Văn A",
    specialty: "Cơ khí băng truyền",
    status: "busy",
    currentTask: "Xử lý tắc nghẽn - Băng truyền 01",
    completedToday: 3,
    avgResponseTime: "8 phút",
  },
  {
    id: "t2",
    name: "Trần Thị B",
    specialty: "Điện động cơ",
    status: "available",
    completedToday: 5,
    avgResponseTime: "6 phút",
  },
  {
    id: "t3",
    name: "Lê Văn C",
    specialty: "Cơ khí băng truyền",
    status: "available",
    completedToday: 4,
    avgResponseTime: "7 phút",
  },
  {
    id: "t4",
    name: "Phạm Thị D",
    specialty: "Bảo trì tổng hợp",
    status: "busy",
    currentTask: "Kiểm tra rung động - Băng truyền 01",
    completedToday: 2,
    avgResponseTime: "10 phút",
  },
  {
    id: "t5",
    name: "Hoàng Văn E",
    specialty: "Điện tự động hóa",
    status: "offline",
    completedToday: 0,
    avgResponseTime: "9 phút",
  },
];

const mockAssignments: Assignment[] = [
  {
    id: "a1",
    incidentId: "i1",
    technicianId: "t1",
    station: "Băng truyền chính 01",
    issue: "Băng truyền bị kẹt",
    assignedAt: "14:35 - 14/01/2026",
    status: "in-progress",
    estimatedTime: "15 phút",
  },
  {
    id: "a2",
    incidentId: "i2",
    technicianId: "t4",
    station: "Băng truyền đóng gói 01",
    issue: "Rung động bất thường",
    assignedAt: "14:30 - 14/01/2026",
    status: "in-progress",
    estimatedTime: "20 phút",
  },
];

export function TechniciansPage() {
  const [technicians] = useState<Technician[]>(mockTechnicians);
  const [assignments] = useState<Assignment[]>(mockAssignments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const availableTechnicians = technicians.filter(
    (t) => t.status === "available",
  );
  const busyTechnicians = technicians.filter((t) => t.status === "busy");

  const getStatusColor = (status: Technician["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: Technician["status"]) => {
    switch (status) {
      case "available":
        return "Sẵn sàng";
      case "busy":
        return "Đang bận";
      case "offline":
        return "Offline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Thợ Sửa Chữa</h2>
          <p className="text-gray-600">Phân công và theo dõi công việc</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="size-4 mr-2" />
              Thêm thợ mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm Thợ Sửa Chữa Mới</DialogTitle>
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
                <Label htmlFor="specialty">Chuyên môn</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chuyên môn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mechanical">
                      Cơ khí băng truyền
                    </SelectItem>
                    <SelectItem value="electrical">Điện động cơ</SelectItem>
                    <SelectItem value="automation">Điện tự động hóa</SelectItem>
                    <SelectItem value="general">Bảo trì tổng hợp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Thêm vào hệ thống</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sẵn sàng</p>
              <p className="text-3xl font-bold text-green-600">
                {availableTechnicians.length}
              </p>
            </div>
            <CheckCircle2 className="size-12 text-green-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đang bận</p>
              <p className="text-3xl font-bold text-yellow-600">
                {busyTechnicians.length}
              </p>
            </div>
            <Wrench className="size-12 text-yellow-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng số thợ</p>
              <p className="text-3xl font-bold">{technicians.length}</p>
            </div>
            <UserPlus className="size-12 text-blue-600 opacity-20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technicians List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Danh Sách Thợ Sửa Chữa</h3>
          <div className="space-y-3">
            {technicians.map((tech) => (
              <Card key={tech.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`size-3 rounded-full ${getStatusColor(tech.status)} mt-1.5`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{tech.name}</h4>
                      <p className="text-sm text-gray-600">{tech.specialty}</p>
                      {tech.currentTask && (
                        <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                          <Wrench className="size-3" />
                          {tech.currentTask}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Hoàn thành: {tech.completedToday}</span>
                        <span>Thời gian TB: {tech.avgResponseTime}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      tech.status === "available" ? "default" : "secondary"
                    }
                  >
                    {getStatusText(tech.status)}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Assignments */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Công Việc Đang Thực Hiện
          </h3>
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const tech = technicians.find(
                (t) => t.id === assignment.technicianId,
              );
              return (
                <Card key={assignment.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{assignment.station}</h4>
                        <p className="text-sm text-gray-600">
                          {assignment.issue}
                        </p>
                      </div>
                      <Badge
                        variant={
                          assignment.status === "in-progress"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {assignment.status === "in-progress"
                          ? "Đang xử lý"
                          : assignment.status === "completed"
                            ? "Hoàn thành"
                            : "Đã phân công"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Wrench className="size-4 text-gray-500" />
                        <span className="text-gray-700">{tech?.name}</span>
                      </div>
                      {assignment.estimatedTime && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="size-3" />
                          <span className="text-xs">
                            {assignment.estimatedTime}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Phân công lúc: {assignment.assignedAt}
                    </div>
                  </div>
                </Card>
              );
            })}

            {assignments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Không có công việc nào đang thực hiện
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
