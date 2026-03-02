import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { socket } from "@/services/socket";
import { API_URL } from "../login";

export default function HomeScreen() {
  const [conveyors, setConveyors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load user info
  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem("userName");
      if (name) setUserName(name);
    } catch (error) {
      console.log("Error loading user info:", error);
    }
  };

  const fetchConveyors = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_URL}/conveyor`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setConveyors(res.data.result || []);
    } catch (error: any) {
      console.log("API Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
    fetchConveyors();

    const listener = (data: any) => {
      console.log("Realtime Button Event:", data);

      if (data.status === "stopped") {
        Alert.alert(
          "🚨 SỰ CỐ KHẨN CẤP",
          `Băng chuyền ${data.device_id} đã DỪNG!`,
          [{ text: "OK" }],
        );
      }

      fetchConveyors();
    };

    socket.on("button:event", listener);

    return () => {
      socket.off("button:event", listener);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConveyors();
  };

  // Thống kê theo status
  const runningCount = conveyors.filter((c) => c.status === "running").length;
  const warningCount = conveyors.filter((c) => c.status === "warning").length;
  const errorCount = conveyors.filter(
    (c) => c.status === "error" || c.status === "stopped",
  ).length;
  const totalCount = conveyors.length;

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig: any = {
      running: {
        bg: "#e8f5e9",
        color: "#4caf50",
        text: "Hoạt động",
        icon: "check-circle",
      },
      warning: {
        bg: "#fff3e0",
        color: "#ffa500",
        text: "Cảnh báo",
        icon: "alert-circle",
      },
      error: {
        bg: "#ffebee",
        color: "#f44336",
        text: "Lỗi",
        icon: "close-circle",
      },
      stopped: {
        bg: "#ffebee",
        color: "#f44336",
        text: "Dừng",
        icon: "stop-circle",
      },
    };

    const config = statusConfig[status] || statusConfig.warning;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <MaterialCommunityIcons
          name={config.icon}
          size={16}
          color={config.color}
          style={{ marginRight: 5 }}
        />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading UI
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffa500" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>TỔNG QUAN HỆ THỐNG</Text>
            <Text style={styles.headerSubtitle}>
              {userName
                ? `Xin chào, ${userName}`
                : "Andon Production Monitoring"}
            </Text>
          </View>

          {/* ✅ Realtime Clock */}
          <View style={styles.clockContainer}>
            <View style={styles.timeWrapper}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#ffa500"
              />
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          </View>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ffa500"]}
            tintColor="#ffa500"
          />
        }
      >
        {/* DASHBOARD CARDS */}
        <View style={styles.dashboardSection}>
          <View style={styles.row}>
            <View style={[styles.card, styles.cardGreen]}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={38}
                  color="#4caf50"
                />
              </View>
              <Text style={styles.cardNumber}>{runningCount}</Text>
              <Text style={styles.cardLabel}>Đang hoạt động</Text>
            </View>

            <View style={[styles.card, styles.cardOrange]}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={38}
                  color="#ffa500"
                />
              </View>
              <Text style={styles.cardNumber}>{warningCount}</Text>
              <Text style={styles.cardLabel}>Cần xử lý</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.card, styles.cardRed]}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons
                  name="alarm-light"
                  size={38}
                  color="#f44336"
                />
              </View>
              <Text style={styles.cardNumber}>{errorCount}</Text>
              <Text style={styles.cardLabel}>Khẩn cấp</Text>
            </View>

            <View style={[styles.card, styles.cardBlue]}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons
                  name="factory"
                  size={38}
                  color="#2196f3"
                />
              </View>
              <Text style={styles.cardNumber}>{totalCount}</Text>
              <Text style={styles.cardLabel}>Tổng thiết bị</Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTION */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>⚡ THAO TÁC NHANH</Text>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <View style={styles.actionIconWrapper}>
              <MaterialCommunityIcons
                name="file-document-alert-outline"
                size={24}
                color="#1a1a2e"
              />
            </View>

            <Text style={styles.actionText}>Báo cáo sự cố mới</Text>

            <MaterialCommunityIcons
              name="chevron-right"
              size={28}
              color="#1a1a2e"
            />
          </TouchableOpacity>
        </View>

        {/* LIST CONVEYORS */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏭 DANH SÁCH BĂNG CHUYỀN</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{conveyors.length}</Text>
            </View>
          </View>

          {conveyors.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={70}
                color="#bbb"
              />
              <Text style={styles.emptyText}>Không có thiết bị nào</Text>
            </View>
          ) : (
            conveyors.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.deviceItem}
                activeOpacity={0.7}
              >
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.name}</Text>
                    <Text style={styles.deviceId}>#{item.id}</Text>
                  </View>

                  {renderStatusBadge(item.status)}
                </View>

                {/* LOCATION */}
                {item.location && (
                  <View style={styles.deviceMeta}>
                    <MaterialCommunityIcons
                      name="map-marker-radius-outline"
                      size={18}
                      color="#666"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                )}

                {/* TIME */}
                {item.updated_at && (
                  <View style={styles.deviceMeta}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color="#666"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.metaText}>
                      Cập nhật:{" "}
                      {new Date(item.updated_at).toLocaleString("vi-VN")}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  content: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  /* HEADER */
  header: {
    backgroundColor: "#1a1a2e",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: "#ffa500",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  headerLeft: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#ffa500",
    marginTop: 5,
    fontWeight: "600",
  },

  /* ✅ CLOCK STYLES */
  clockContainer: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 165, 0, 0.3)",
  },

  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  timeText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffa500",
    marginLeft: 8,
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },

  dateText: {
    fontSize: 11,
    color: "#ffa500",
    fontWeight: "600",
    textAlign: "right",
  },

  dashboardSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  cardGreen: { borderLeftWidth: 5, borderLeftColor: "#4caf50" },
  cardOrange: { borderLeftWidth: 5, borderLeftColor: "#ffa500" },
  cardRed: { borderLeftWidth: 5, borderLeftColor: "#f44336" },
  cardBlue: { borderLeftWidth: 5, borderLeftColor: "#2196f3" },

  cardIconWrapper: { marginBottom: 10 },

  cardNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1a1a2e",
    marginBottom: 4,
  },

  cardLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
  },

  actionSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1a1a2e",
    marginBottom: 15,
    letterSpacing: 0.5,
  },

  actionButton: {
    flexDirection: "row",
    backgroundColor: "#ffa500",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#ffa500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(26, 26, 46, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    letterSpacing: 0.5,
  },

  listSection: {
    paddingHorizontal: 20,
    marginTop: 25,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  countBadge: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 40,
    alignItems: "center",
  },

  countText: {
    color: "#ffa500",
    fontSize: 14,
    fontWeight: "900",
  },

  deviceItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffa500",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  deviceInfo: {
    flex: 1,
  },

  deviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 4,
  },

  deviceId: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  deviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  metaText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 10,
  },

  emptyText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "700",
    marginTop: 10,
  },
});
