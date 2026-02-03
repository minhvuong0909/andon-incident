import { View, Text } from "react-native";

export default function AlertsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 22 }}>🚨 Alerts & Incidents</Text>
      <Text>Danh sách sự cố trong ngày</Text>
    </View>
  );
}
