import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    const protect = async () => {
      const loggedIn = await AsyncStorage.getItem("isLoggedIn");

      if (loggedIn !== "true") {
        router.replace("/login");
      }
    };

    protect();
  }, []);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF9800",
        tabBarStyle: {
          backgroundColor: "#0A1931",
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
        },
      }}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer" size={size} color={color} />
          ),
        }}
      />

      {/* Conveyors */}
      <Tabs.Screen
        name="conveyors"
        options={{
          title: "Danh sách băng chuyền",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cog" size={size} color={color} />
          ),
        }}
      />

      {/* Alerts */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Sự cố",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle" size={size} color={color} />
          ),
        }}
      />

      {/* Workers */}
      <Tabs.Screen
        name="fixers"
        options={{
          title: "Thợ sửa chữa",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
