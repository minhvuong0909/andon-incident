import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Factory, Bell, LayoutDashboard, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

export function Layout() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const activeIncidents = 3; // This would come from your state management

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navigation = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Quản lý Thợ",
      path: "/technicians",
      icon: Users,
    },
  ];

  return (
    <div className="w-full min-h-screen mx-auto bg-gray-50">
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
              {activeIncidents > 0 && (
                <div className="relative">
                  <Bell className="size-6 text-red-600 animate-pulse" />
                  <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 bg-red-600">
                    {activeIncidents}
                  </Badge>
                </div>
              )}
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
