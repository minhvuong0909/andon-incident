import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, []),
  );

  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem("name");
      const role = await AsyncStorage.getItem("role");
      const id = await AsyncStorage.getItem("userId");

      if (name) setUserName(name);
      if (role) setUserRole(role);
      if (id) setUserId(id);
    } catch (error) {
      console.log("Error loading user info:", error);
    }
  };

  // Role label map
  const roleLabel: any = {
    admin: "Quản trị viên",
    manager: "Quản lý",
    operator: "Công nhân",
  };

  // Logout chuẩn
  const handleLogout = async () => {
    // xóa toàn bộ session
    await AsyncStorage.clear();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={55} color="#1a1a2e" />
        </View>
        <Text style={styles.headerTitle}>THÔNG TIN CÁ NHÂN</Text>
      </View>

      {/* CONTENT */}
      <ScrollView style={styles.content}>
        {/* USER INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên người dùng</Text>
            <Text style={styles.infoValue}>{userName || "Chưa cập nhật"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID</Text>
            <Text style={styles.infoValue}>#{userId || "N/A"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vai trò</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {roleLabel[userRole] || "Người dùng"}
              </Text>
            </View>
          </View>
        </View>

        {/* ACTIONS SECTION */}
        <Text style={styles.sectionTitle}>⚙ THAO TÁC</Text>

        {/* Export CSV */}
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
          <View style={[styles.actionIconWrapper, styles.iconBlue]}>
            <MaterialCommunityIcons
              name="file-chart-outline"
              size={26}
              color="#2196f3"
            />
          </View>

          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Xuất báo cáo CSV</Text>
            <Text style={styles.actionSubtitle}>
              Tải xuống dữ liệu thiết bị
            </Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={26} color="#ccc" />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert("Thông báo", "Tính năng đang phát triển")}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconWrapper, styles.iconGray]}>
            <MaterialCommunityIcons name="cog-outline" size={26} color="#666" />
          </View>

          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Cài đặt</Text>
            <Text style={styles.actionSubtitle}>Tùy chỉnh ứng dụng</Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={26} color="#ccc" />
        </TouchableOpacity>

        {/* Help */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert("Thông báo", "Tính năng đang phát triển")}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconWrapper, styles.iconGreen]}>
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={26}
              color="#4caf50"
            />
          </View>

          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Trợ giúp</Text>
            <Text style={styles.actionSubtitle}>Hướng dẫn sử dụng</Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={26} color="#ccc" />
        </TouchableOpacity>

        {/* LOGOUT SECTION */}
        <Text style={styles.sectionTitle}>🔐 BẢO MẬT</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            console.log("✅ Click nút Đăng xuất");
            handleLogout();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconWrapper}>
            <MaterialCommunityIcons name="logout" size={26} color="#fff" />
          </View>
          <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>

        {/* APP VERSION */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
          <Text style={styles.versionSubtext}>Andon Production System</Text>
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

  header: {
    backgroundColor: "#1a1a2e",
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "#ffa500",
  },

  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffa500",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 8,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },

  content: {
    flex: 1,
    padding: 20,
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: "#ffa500",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  infoValue: {
    fontSize: 16,
    color: "#1a1a2e",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },

  roleBadge: {
    backgroundColor: "#ffa500",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  roleText: {
    fontSize: 13,
    color: "#1a1a2e",
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1a1a2e",
    marginBottom: 15,
  },

  actionButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },

  actionIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  iconBlue: { backgroundColor: "#e3f2fd" },
  iconGray: { backgroundColor: "#f5f5f5" },
  iconGreen: { backgroundColor: "#e8f5e9" },

  actionTextContainer: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
  },

  actionSubtitle: {
    fontSize: 13,
    color: "#999",
  },

  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#f44336",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 6,
  },

  logoutIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  logoutText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
  },

  versionContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },

  versionText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },

  versionSubtext: {
    fontSize: 12,
    color: "#ccc",
  },
});
