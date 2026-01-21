import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Factory,
  Bell,
  LayoutDashboard,
  Users,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "./ui/utils";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());

  // ✅ LẤY ĐÚNG KEY
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
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "staff":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "user":
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("displayName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };

  const activeIncidents = 3;

  const navigation = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Quản lý Thợ", path: "/technicians", icon: Users },
    // admin mới có
    ...(userRoleRaw === "admin"
      ? [{ name: "Đăng kí User", path: "/register", icon: User }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Factory className="size-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Hệ thống Andon - Băng Truyền
                </h1>
                <p className="text-sm text-gray-600">
                  Giám sát băng truyền theo thời gian thực
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Thời gian</p>
                <p className="font-semibold">
                  {currentTime.toLocaleTimeString("vi-VN")}
                </p>
                <p className="text-xs text-gray-500">
                  {currentTime.toLocaleDateString("vi-VN")}
                </p>
              </div>

              <div className="border-l border-gray-300 h-12" />

              {activeIncidents > 0 && (
                <div className="relative">
                  <Bell className="size-6 text-red-600 animate-pulse" />
                  <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 bg-red-600">
                    {activeIncidents}
                  </Badge>
                </div>
              )}

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-3 h-auto py-2 px-3 hover:bg-gray-100"
                  >
                    <Avatar className="size-10 bg-gradient-to-br from-blue-600 to-blue-700">
                      <AvatarFallback className="bg-transparent text-white font-semibold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-left">
                      <p className="font-semibold text-sm">{displayName}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-normal",
                          getRoleBadgeColor(userRoleRaw),
                        )}
                      >
                        {userRole}
                      </Badge>
                    </div>

                    <ChevronDown className="size-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-gray-500">@{username}</p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="cursor-pointer">
                    <User className="size-4 mr-2" />
                    Thông tin cá nhân
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* End dropdown */}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 py-4 border-b-2 transition-colors",
                    isActive
                      ? "border-blue-600 text-blue-600 font-medium"
                      : "border-transparent text-gray-600 hover:text-gray-900",
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
      <div className="container mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}
