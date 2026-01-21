import { useState } from "react";
import { UserPlus, Factory, Shield, User } from "lucide-react";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";

type RegisterPayload = {
  factory_id: number;
  department: string;
  name: string;
  username: string;
  password: string;
  role: "admin" | "user" | "fixer";
};

export function RegisterUserPage() {
  const [form, setForm] = useState<RegisterPayload>({
    factory_id: 1,
    department: "VDC",
    name: "",
    username: "",
    password: "",
    role: "fixer",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (key: keyof RegisterPayload, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:4000/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Đăng kí thất bại");
        return;
      }

      setSuccess("Tạo tài khoản thành công!");

      // reset nhẹ
      setForm((prev) => ({
        ...prev,
        name: "",
        username: "",
        password: "",
        role: "fixer",
      }));
    } catch (err) {
      setError("Không thể kết nối server, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <UserPlus className="size-6 text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Đăng kí tài khoản
            </h1>
            <p className="text-sm text-gray-500">
              Tạo tài khoản mới theo hệ thống Andon
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* factory_id */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Xưởng</Label>
            <div className="relative">
              <Factory className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                type="number"
                value={form.factory_id}
                onChange={(e) =>
                  handleChange("factory_id", Number(e.target.value))
                }
                className="pl-10 h-11"
                disabled={loading}
              />
            </div>
          </div>

          {/* department */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Phòng ban
            </Label>
            <Input
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="VD: VDC"
              className="h-11"
              disabled={loading}
            />
          </div>

          {/* name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Họ tên</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="VD: admin"
                className="pl-10 h-11"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* username */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Username
            </Label>
            <Input
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="VD: admin123"
              className="h-11"
              required
              disabled={loading}
            />
          </div>

          {/* password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Nhập mật khẩu"
              className="h-11"
              required
              disabled={loading}
            />
          </div>

          {/* role */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Role</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <select
                value={form.role}
                onChange={(e) =>
                  handleChange(
                    "role",
                    e.target.value as RegisterPayload["role"],
                  )
                }
                className="w-full h-11 pl-10 pr-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="fixer">Người sửa</option>
                <option value="user">Người dùng</option>
                {/* <option value="admin">Quản trị viên</option> */}
              </select>
            </div>
          </div>

          {/* alerts */}
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
