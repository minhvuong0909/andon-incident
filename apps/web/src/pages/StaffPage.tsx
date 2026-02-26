import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { API_URL } from "../App";

type StaffUser = {
  id: number;
  factory_id: number;
  department: string;
  name: string;
  username: string;
  role: string; // Staff
  status: string;
  created_at: string;
};

type ApiResponse = {
  message?: string;
  result?: StaffUser[];
  users?: StaffUser[];
};

export function StaffManagementPage() {
  const [staffs, setStaffs] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const fetchStaffs = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/users`);
      const data: ApiResponse = await res.json();

      const list = data.result || data.users || [];

      const onlyStaff = list.filter(
        (u) => String(u.role).toLowerCase() === "staff",
      );

      setStaffs(onlyStaff);
    } catch (err) {
      console.error("Fetch staff error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  const filteredStaffs = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return staffs;

    return staffs.filter((s) => {
      return (
        s.name.toLowerCase().includes(key) ||
        s.username.toLowerCase().includes(key) ||
        s.department.toLowerCase().includes(key) ||
        String(s.factory_id).includes(key)
      );
    });
  }, [staffs, keyword]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="size-6 text-blue-600" />
            Quản lý nhân viên (Staff)
          </h1>
          <p className="text-sm text-gray-500">
            Danh sách tài khoản có role Staff trong hệ thống
          </p>
        </div>

        <Badge className="bg-blue-600">Tổng: {filteredStaffs.length}</Badge>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Tìm theo tên / username / phòng ban / xưởng..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="h-11"
        />
      </Card>

      {/* Table */}
      <Card className="p-4 overflow-x-auto">
        {loading ? (
          <div className="text-sm text-gray-500">
            Đang tải danh sách staff...
          </div>
        ) : filteredStaffs.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-10">
            Không có nhân viên Staff nào
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-3 text-left">Họ tên</th>
                <th className="py-3 text-left">Tên người dùng</th>
                <th className="py-3 text-left">Phòng ban</th>
                <th className="py-3 text-left">Xưởng</th>
                <th className="py-3 text-left">Trạng thái</th>
                <th className="py-3 text-left">Role</th>
              </tr>
            </thead>

            <tbody>
              {filteredStaffs.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{s.id}</td>
                  <td className="py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 text-gray-700">@{s.username}</td>
                  <td className="py-3">{s.department}</td>
                  <td className="py-3">Xưởng {s.factory_id}</td>
                  <td className="py-3">
                    <Badge
                      className={
                        s.status === "Active" ? "bg-green-600" : "bg-gray-500"
                      }
                    >
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Badge className="bg-blue-600">{s.role}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
