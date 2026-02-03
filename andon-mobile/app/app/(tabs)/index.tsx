import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import axios from "axios";

import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function HomeScreen() {
  const [conveyors, setConveyors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConveyors = async () => {
    try {
      const res = await axios.get("http://localhost:4000/conveyor");
      setConveyors(res.data.result);
    } catch (error: any) {
      console.log("API Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConveyors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConveyors();
  };

  // ✅ Thống kê theo status
  const runningCount = conveyors.filter((c) => c.status === "running").length;
  const warningCount = conveyors.filter((c) => c.status === "warning").length;
  const errorCount = conveyors.filter(
    (c) => c.status === "error" || c.status === "stopped",
  ).length;
  const totalCount = conveyors.length;

  // Render status badge (FIX ICON)
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
        <Text style={styles.headerTitle}>TỔNG QUAN HỆ THỐNG</Text>
        <Text style={styles.headerSubtitle}>Andon Production Monitoring</Text>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
          <Text style={styles.sectionTitle}>THAO TÁC NHANH</Text>

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
            <Text style={styles.sectionTitle}>DANH SÁCH BĂNG CHUYỀN</Text>
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
                  {/*  REMOVE deviceInfo */}
                  <View>
                    <Text style={styles.deviceName}>{item.name}</Text>
                    <Text style={styles.deviceId}>ID: {item.id}</Text>
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
                {item.lastUpdate && (
                  <View style={styles.deviceMeta}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color="#666"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.metaText}>
                      Cập nhật:{" "}
                      {new Date(item.lastUpdate).toLocaleString("vi-VN")}
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

  header: {
    backgroundColor: "#1a1a2e",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: "#ffa500",
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
  },

  actionButton: {
    flexDirection: "row",
    backgroundColor: "#ffa500",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    elevation: 6,
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
  },

  listSection: {
    paddingHorizontal: 20,
    marginTop: 25,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  countBadge: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  countText: {
    color: "#ffa500",
    fontSize: 14,
    fontWeight: "700",
  },

  deviceItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffa500",
    elevation: 2,
  },

  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    fontWeight: "500",
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
  },

  emptyText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "600",
    marginTop: 10,
  },
});
