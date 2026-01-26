import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Factory,
  Bell,
  LayoutDashboard,
  Users,
  LogOut,
  User,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "./ui/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type NotificationItem = {
  id: number;
  title?: string;
  message?: string;
  created_at?: string;
  status?: string;
  is_read?: boolean;
};

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeIncidents, setActiveIncidents] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const displayName = localStorage.getItem("displayName") || "User";
  const userRoleRaw = localStorage.getItem("userRole") || "user";
  const username = localStorage.getItem("username") || "user";

  const formatRole = (role: string) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "staff":
        return "Nhân viên";
      case "user":
        return "Người dùng";
      default:
        return role;
    }
  };

  const userRole = formatRole(userRoleRaw);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "staff":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "user":
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:4000/notifications/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        const list: NotificationItem[] = Array.isArray(data)
          ? data
          : data?.notifications || [];

        setNotifications(list);

        const unreadCount = list.filter(
          (n) => n.status === "unread" || n.is_read === false,
        ).length;

        setActiveIncidents(unreadCount > 0 ? unreadCount : list.length);
      } catch (err) {
        console.log("❌ Notifications API lỗi:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("displayName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("factoryId");
    localStorage.removeItem("department");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const handleGoProfile = async () => {
    if (loadingProfile) return;

    setUserMenuOpen(false); // Đóng menu

    try {
      setLoadingProfile(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId) {
        alert("❌ Không tìm thấy userId, vui lòng đăng nhập lại!");
        return;
      }

      const res = await fetch(`http://localhost:4000/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        alert("Không lấy được thông tin user");
        return;
      }

      const user = await res.json();
      localStorage.setItem("displayName", user.name);
      localStorage.setItem("username", user.username);
      localStorage.setItem("userRole", user.role.toLowerCase());
      localStorage.setItem("factoryId", String(user.factory_id));
      localStorage.setItem("department", user.department);

      navigate("/profile");
    } catch (err) {
      alert("Lỗi kết nối server");
    } finally {
      setLoadingProfile(false);
    }
  };

  const navigation = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Quản lý Thợ", path: "/technicians", icon: Users },
    ...(userRoleRaw === "admin"
      ? [{ name: "Đăng kí User", path: "/register", icon: User }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-2.5 shadow-lg shadow-blue-200">
                <Factory className="size-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Hệ thống Andon
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Giám sát băng truyền theo thời gian thực
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-6">
              {/* Time Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white border rounded-xl px-4 py-2.5 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-0.5">
                  Thời gian hệ thống
                </p>
                <p className="font-bold text-lg text-gray-900">
                  {currentTime.toLocaleTimeString("vi-VN")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {currentTime.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Notifications */}
              <Popover open={notifMenuOpen} onOpenChange={setNotifMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                    className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                    title="Thông báo"
                  >
                    <Bell
                      className={cn(
                        "size-6 transition-all duration-200",
                        activeIncidents > 0
                          ? "text-red-600 animate-pulse"
                          : "text-gray-600 group-hover:text-gray-900",
                      )}
                    />
                    {activeIncidents > 0 && (
                      <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 bg-gradient-to-br from-red-500 to-red-600 border-2 border-white shadow-lg text-[10px] font-bold">
                        {activeIncidents}
                      </Badge>
                    )}
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="end"
                  className="w-96 p-0 z-50 shadow-xl border-gray-200"
                >
                  <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
                    <p className="font-semibold text-gray-900">Thông báo</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Bạn có {activeIncidents} thông báo mới
                    </p>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="size-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Không có thông báo nào
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="size-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                {n.title || "Thông báo mới"}
                              </p>
                              {n.message && (
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                  {n.message}
                                </p>
                              )}
                              {n.created_at && (
                                <p className="text-[11px] text-gray-400 mt-1.5">
                                  {n.created_at}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* User Info - Click để vào profile */}
              <button
                type="button"
                onClick={handleGoProfile}
                disabled={loadingProfile}
                className="flex items-center gap-3 py-2 px-3 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <Avatar className="size-10 bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
                  <AvatarFallback className="bg-transparent text-white font-bold text-sm">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-left">
                  <p className="font-semibold text-sm text-gray-900">
                    {displayName}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium mt-0.5",
                      getRoleBadgeColor(userRoleRaw),
                    )}
                  >
                    {userRole}
                  </Badge>
                </div>
              </button>

              {/* Divider */}
              <div className="border-l border-gray-300 h-10" />

              {/* Logout Button */}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-gray-700 font-medium"
              >
                <LogOut className="size-5" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6">
          <nav className="flex gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-4 border-b-2 transition-all duration-200 rounded-t-lg",
                    isActive
                      ? "border-blue-600 text-blue-600 font-semibold bg-blue-50/50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  )}
                >
                  <Icon className="size-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Outlet />
      </div>
    </div>
  );
}
