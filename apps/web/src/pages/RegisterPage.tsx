import { useState } from "react";
import {
  UserPlus,
  Factory,
  Shield,
  User,
  Lock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
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

      // reset form
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

  const roleOptions = [
    { value: "fixer", label: "Người sửa (Fixer)", color: "text-blue-700" },
    { value: "user", label: "Người dùng (User)", color: "text-gray-700" },
    // { value: "admin", label: "Quản trị viên (Admin)", color: "text-purple-700" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header Card */}
      <div className="rounded-2xl border-2 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <UserPlus className="size-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Đăng kí tài khoản mới
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              Tạo tài khoản người dùng cho hệ thống Andon
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="rounded-2xl border-2 shadow-lg overflow-hidden">
        {/* Form Header */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b-2">
          <h2 className="text-lg font-bold text-gray-900">
            Thông tin tài khoản
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Điền đầy đủ thông tin bên dưới để tạo tài khoản
          </p>
        </div>

        <form onSubmit={handleRegister} className="p-6 space-y-6">
          {/* Grid Layout for better organization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Factory ID */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Factory className="size-4 text-blue-600" />
                Xưởng
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Factory className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                  type="number"
                  value={form.factory_id}
                  onChange={(e) =>
                    handleChange("factory_id", Number(e.target.value))
                  }
                  className="pl-12 h-12 rounded-xl border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-medium"
                  disabled={loading}
                  min={1}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Số xưởng làm việc</p>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Building2 className="size-4 text-green-600" />
                Phòng ban
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="VD: VDC, Bảo trì, Cơ điện..."
                  className="pl-12 h-12 rounded-xl border-2 focus:border-green-500 focus:ring-4 focus:ring-green-100 font-medium"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Tên phòng ban hoặc bộ phận
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User className="size-4 text-purple-600" />
              Họ và tên đầy đủ
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="pl-12 h-12 rounded-xl border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 font-medium"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500">Tên hiển thị trong hệ thống</p>
          </div>

          {/* Username & Password Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <User className="size-4 text-indigo-600" />
                Tên đăng nhập
                <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="VD: admin123"
                className="h-12 rounded-xl border-2 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-medium"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Username để đăng nhập</p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Lock className="size-4 text-red-600" />
                Mật khẩu
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="pl-12 h-12 rounded-xl border-2 focus:border-red-500 focus:ring-4 focus:ring-red-100 font-medium"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500">Tối thiểu 6 ký tự</p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Shield className="size-4 text-amber-600" />
              Vai trò trong hệ thống
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 z-10" />
              <select
                value={form.role}
                onChange={(e) =>
                  handleChange(
                    "role",
                    e.target.value as RegisterPayload["role"],
                  )
                }
                className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                disabled={loading}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="size-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Chọn quyền hạn cho tài khoản này
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-2 border-red-200 rounded-xl"
            >
              <AlertCircle className="size-5" />
              <AlertDescription className="font-semibold">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-2 border-green-200 text-green-800 rounded-xl">
              <CheckCircle2 className="size-5" />
              <AlertDescription className="font-semibold">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t-2">
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 mr-2 animate-spin" />
                  Đang tạo tài khoản...
                </>
              ) : (
                <>
                  <UserPlus className="size-5 mr-2" />
                  Tạo tài khoản
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Info Card */}
      <div className="mt-6 rounded-2xl border-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Shield className="size-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Lưu ý quan trọng</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  <strong>Fixer:</strong> Người sửa chữa, có thể nhận và xử lý
                  công việc
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  <strong>User:</strong> Người dùng thông thường, xem thông tin
                  cơ bản
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Tất cả thông tin có dấu (*) là bắt buộc</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Mật khẩu nên có ít nhất 6 ký tự để đảm bảo bảo mật</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
