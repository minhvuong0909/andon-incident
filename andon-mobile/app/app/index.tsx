import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// check session
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    };

    checkSession();
  }, []);

  return null;
}
