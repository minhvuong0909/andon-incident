import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function exportToCSV(data: any[]) {
  const csv =
    "id,name,status\n" +
    data.map((d) => `${d.id},${d.name},${d.status}`).join("\n");

  const fileUri = FileSystem + "conveyors.csv";

  await FileSystem.writeAsStringAsync(fileUri, csv);

  await Sharing.shareAsync(fileUri);
}
