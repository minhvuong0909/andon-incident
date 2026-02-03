import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        // Check user đã lưu chưa
        const user = await AsyncStorage.getItem("user");

        if (user) {
          // Đã login → vào home
          router.replace("/home");
        } else {
          // Chưa login → vào login
          router.replace("/login");
        }
      } catch (error) {
        // Nếu storage lỗi → quay về login
        router.replace("/login");
      }
    };

    checkLogin();
  }, []);

  return null;
}
