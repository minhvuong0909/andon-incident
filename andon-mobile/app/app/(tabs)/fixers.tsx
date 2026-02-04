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

  // Fetch Today Assignments
  const fetchAssignmentsToday = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const name = await AsyncStorage.getItem("userName");

      if (name) setFixerName(name);

      const res = await axios.get(`${API_URL}/assignment/today`);

      setAssignments(res.data.result || []);
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

  // Count Status
  const readyCount = assignments.filter((a) => a.status === "ready").length;
  const assignedCount = assignments.filter(
    (a) => a.status === "assigned",
  ).length;
  const doneCount = assignments.filter((a) => a.status === "done").length;
  const totalCount = assignments.length;

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    const config: any = {
      ready: {
        text: "Sẵn sàng",
        icon: "●",
        color: "#4caf50",
        bg: "#e8f5e9",
      },
      assigned: {
        text: "Đang xử lý",
        icon: "▶",
        color: "#ff9800",
        bg: "#fff3e0",
      },
      done: {
        text: "Hoàn thành",
        icon: "✓",
        color: "#2196f3",
        bg: "#e3f2fd",
      },
    };

    const badge = config[status] || config.assigned;

    return (
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeIcon, { color: badge.color }]}>
          {badge.icon}
        </Text>
        <Text style={[styles.badgeText, { color: badge.color }]}>
          {badge.text}
        </Text>
      </View>
    );
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority: string) => {
    if (!priority) return null;

    const config: any = {
      high: { text: "Cao", color: "#f44336", bg: "#ffebee" },
      medium: { text: "Trung bình", color: "#ff9800", bg: "#fff3e0" },
      low: { text: "Thấp", color: "#4caf50", bg: "#e8f5e9" },
    };

    const badge = config[priority] || config.medium;

    return (
      <View style={[styles.priorityBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.priorityText, { color: badge.color }]}>
          {badge.text}
        </Text>
      </View>
    );
  };

  // Loading UI
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color="#ffa500" />
        </View>
        <Text style={styles.loadingText}>Đang tải nhiệm vụ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>NHIỆM VỤ HÔM NAY</Text>
            <Text style={styles.headerSubtitle}>
              {fixerName ? `Chào ${fixerName}` : "Fixer Task System"}
            </Text>
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
              <View style={[styles.cardIconWrapper, styles.cardIconGreen]}>
                <Text style={styles.cardIconText}>●</Text>
              </View>
              <Text style={styles.cardNumber}>{readyCount}</Text>
              <Text style={styles.cardLabel}>Sẵn sàng</Text>
            </View>

            <View style={[styles.card, styles.cardOrange]}>
              <View style={[styles.cardIconWrapper, styles.cardIconOrange]}>
                <Text style={styles.cardIconText}>▶</Text>
              </View>
              <Text style={styles.cardNumber}>{assignedCount}</Text>
              <Text style={styles.cardLabel}>Đang xử lý</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.card, styles.cardBlue]}>
              <View style={[styles.cardIconWrapper, styles.cardIconBlue]}>
                <Text style={styles.cardIconText}>✓</Text>
              </View>
              <Text style={styles.cardNumber}>{doneCount}</Text>
              <Text style={styles.cardLabel}>Hoàn thành</Text>
            </View>

            <View style={[styles.card, styles.cardGray]}>
              <View style={[styles.cardIconWrapper, styles.cardIconGray]}>
                <Text style={styles.cardIconText}>≡</Text>
              </View>
              <Text style={styles.cardNumber}>{totalCount}</Text>
              <Text style={styles.cardLabel}>Tổng nhiệm vụ</Text>
            </View>
          </View>
        </View>

        {/* TASK LIST */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 DANH SÁCH CÔNG VIỆC</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{assignments.length}</Text>
            </View>
          </View>

          {assignments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Không có nhiệm vụ nào</Text>
            </View>
          ) : (
            assignments.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.taskItem}
                activeOpacity={0.7}
              >
                {/* Header */}
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleRow}>
                    <Text style={styles.taskIcon}>⚙</Text>
                    <View style={styles.taskTitleContainer}>
                      <Text style={styles.taskTitle}>
                        {item.conveyor_name || `Task #${item.id}`}
                      </Text>
                      <Text style={styles.taskId}>#{item.id}</Text>
                    </View>
                  </View>
                  {renderStatusBadge(item.status)}
                </View>

                {/* Priority */}
                {item.priority && (
                  <View style={styles.priorityRow}>
                    <Text style={styles.priorityLabel}>Độ ưu tiên:</Text>
                    {renderPriorityBadge(item.priority)}
                  </View>
                )}

                {/* Fixer Info */}
                <View style={styles.taskMeta}>
                  <Text style={styles.metaIcon}>👤</Text>
                  <Text style={styles.metaLabel}>Người thực hiện:</Text>
                  <Text style={styles.metaValue}>{item.fixer_name}</Text>
                </View>

                {/* Issue */}
                {item.issue && (
                  <View style={styles.taskMeta}>
                    <Text style={styles.metaIcon}>⚠</Text>
                    <Text style={styles.metaLabel}>Sự cố:</Text>
                    <Text style={styles.metaValue}>{item.issue}</Text>
                  </View>
                )}

                {/* Description */}
                {item.description && (
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                      {item.description}
                    </Text>
                  </View>
                )}

                {/* Time Footer */}
                <View style={styles.taskFooter}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeIcon}>🕐</Text>
                    <Text style={styles.timeText}>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })
                        : "N/A"}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.miniButton}>
                      <Text style={styles.miniButtonText}>Chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingSpinner: {
    padding: 20,
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
    alignItems: "center",
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
  dateContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 165, 0, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dateIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#ffa500",
    fontWeight: "700",
  },

  /* CONTENT */
  content: {
    flex: 1,
  },

  /* DASHBOARD */
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGreen: { borderLeftWidth: 5, borderLeftColor: "#4caf50" },
  cardOrange: { borderLeftWidth: 5, borderLeftColor: "#ff9800" },
  cardBlue: { borderLeftWidth: 5, borderLeftColor: "#2196f3" },
  cardGray: { borderLeftWidth: 5, borderLeftColor: "#757575" },

  cardIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIconGreen: { backgroundColor: "#e8f5e9" },
  cardIconOrange: { backgroundColor: "#fff3e0" },
  cardIconBlue: { backgroundColor: "#e3f2fd" },
  cardIconGray: { backgroundColor: "#f5f5f5" },

  cardIconText: {
    fontSize: 28,
    fontWeight: "900",
  },
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

  /* LIST SECTION */
  listSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1a1a2e",
    letterSpacing: 0.5,
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

  /* TASK ITEM */
  taskItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffa500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  taskTitleContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  taskId: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },

  /* BADGES */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeIcon: {
    fontSize: 10,
    marginRight: 6,
    fontWeight: "900",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  priorityLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* META INFO */
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  metaLabel: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
    marginRight: 6,
  },
  metaValue: {
    fontSize: 13,
    color: "#1a1a2e",
    fontWeight: "600",
    flex: 1,
  },

  /* DESCRIPTION */
  descriptionBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#ffa500",
  },
  descriptionText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    lineHeight: 18,
  },

  /* FOOTER */
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  timeText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },

  /* ACTION BUTTONS */
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  miniButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
  },
  miniButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffa500",
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    fontWeight: "500",
  },
});
