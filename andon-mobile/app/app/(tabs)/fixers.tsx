import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../login";

export default function FixersScreen() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fixerName, setFixerName] = useState("");

  const fetchAssignmentsToday = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      const name = await AsyncStorage.getItem("userName");

      if (name) setFixerName(name);

      if (!userId) return;

      const res = await axios.get(`${API_URL}/assignment/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAssignments(res.data.assignments || []);
    } catch (error: any) {
      console.log("API Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsToday();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignmentsToday();
  };

  const readyCount = assignments.filter(
    (a) => a.status?.toLowerCase() === "ready",
  ).length;

  const assignedCount = assignments.filter(
    (a) => a.status?.toLowerCase() === "assigned",
  ).length;

  const doneCount = assignments.filter(
    (a) => a.status?.toLowerCase() === "done",
  ).length;

  const totalCount = assignments.length;

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "ready") return { border: "#4caf50", bg: "#e8f5e9" };
    if (s === "assigned") return { border: "#ff9800", bg: "#fff3e0" };
    if (s === "done") return { border: "#2196f3", bg: "#e3f2fd" };
    return { border: "#ccc", bg: "#f5f5f5" };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffa500" />
        <Text style={styles.loadingText}>Đang tải nhiệm vụ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fixer Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {fixerName ? `Xin chào ${fixerName}` : ""}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ffa500"]}
          />
        }
      >
        {/* DASHBOARD CARDS */}
        <View style={styles.dashboard}>
          <View style={[styles.statCard, { backgroundColor: "#e8f5e9" }]}>
            <Text style={styles.statNumber}>{readyCount}</Text>
            <Text style={styles.statLabel}>Sẵn sàng</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#fff3e0" }]}>
            <Text style={styles.statNumber}>{assignedCount}</Text>
            <Text style={styles.statLabel}>Đang xử lý</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#e3f2fd" }]}>
            <Text style={styles.statNumber}>{doneCount}</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: "#f3f3f3" }]}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Tổng</Text>
          </View>
        </View>

        {/* TASK LIST */}
        <View style={styles.listContainer}>
          {assignments.map((item) => {
            const statusStyle = getStatusStyle(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.taskCard,
                  { borderLeftColor: statusStyle.border },
                ]}
                activeOpacity={0.85}
              >
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>
                    Băng chuyền #{item.conveyor_id}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: statusStyle.border,
                      }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.taskId}>Mã nhiệm vụ: #{item.id}</Text>

                <Text style={styles.taskTime}>
                  {new Date(item.created_at).toLocaleString("vi-VN")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  header: {
    backgroundColor: "#1a1a2e",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    color: "#ffa500",
    marginTop: 6,
  },

  dashboard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
  },
  statCard: {
    width: "48%",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#555",
  },

  listContainer: {
    paddingHorizontal: 16,
  },

  taskCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  taskId: {
    marginTop: 6,
    color: "#777",
    fontSize: 13,
  },
  taskTime: {
    marginTop: 6,
    fontSize: 12,
    color: "#999",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
});
