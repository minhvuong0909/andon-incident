import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { API_URL } from "../login";

export default function AlertScreen() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch conveyor rồi filter status lỗi
  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_URL}/conveyor`);

      const conveyors = res.data.result;

      // Filter chỉ lấy stopped
      const filtered = conveyors.filter((c: any) => c.status === "stopped");

      setAlerts(filtered);
    } catch (error: any) {
      console.log("API Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  // Badge theo status
  const renderBadge = (status: string) => {
    const config: any = {
      warning: {
        color: "#ffa500",
        bg: "#fff3e0",
        icon: "alert-circle-outline",
        text: "Cảnh báo",
      },
      error: {
        color: "#f44336",
        bg: "#ffebee",
        icon: "close-circle-outline",
        text: "Lỗi",
      },
      stopped: {
        color: "#d50000",
        bg: "#ffebee",
        icon: "stop-circle-outline",
        text: "Dừng khẩn cấp",
      },
    };

    const badge = config[status] || config.warning;

    return (
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <MaterialCommunityIcons
          name={badge.icon}
          size={16}
          color={badge.color}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.badgeText, { color: badge.color }]}>
          {badge.text}
        </Text>
      </View>
    );
  };

  // Loading UI
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffa500" />
        <Text style={styles.loadingText}>Đang tải sự cố...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DANH SÁCH SỰ CỐ</Text>
        <Text style={styles.headerSubtitle}>Băng chuyền gặp sự cố</Text>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* EMPTY */}
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={80}
              color="#bbb"
            />
            <Text style={styles.emptyText}>Không có băng chuyền gặp sự</Text>
          </View>
        ) : (
          alerts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.alertCard}
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  "Chi tiết thiết bị",
                  `Tên: ${item.name}\nTrạng thái: ${item.status}\nVị trí: ${
                    item.location || "Chưa có"
                  }`,
                )
              }
            >
              {/* HEADER ROW */}
              <View style={styles.cardHeader}>
                <Text style={styles.deviceName}>{item.name}</Text>
                {renderBadge(item.status)}
              </View>

              {/* LOCATION */}
              {item.location && (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons
                    name="map-marker-radius-outline"
                    size={16}
                    color="#666"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.metaText}>{item.location}</Text>
                </View>
              )}

              {/* UPDATE TIME */}
              {item.updated_at && (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
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

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    backgroundColor: "#1a1a2e",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: "#ffa500",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffa500",
    marginTop: 6,
    fontWeight: "600",
  },

  content: { flex: 1, padding: 20 },

  alertCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#ffa500",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  deviceName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a2e",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
  },

  metaText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#666",
  },
});
