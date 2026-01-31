import React, { useEffect } from "react";
import { View, Text } from "react-native";

export default function HomeScreen() {
  useEffect(() => {
    console.log("Loaded ✅");
  }, []);

//   return (
//     // <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//     //   <Text>Hello Mobile ✅</Text>
//     // </View>
//   );
}
