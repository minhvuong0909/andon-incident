// định nghĩa các nút
export type ButtonName = "RESET" | "ENTER";

export type ButtonEvent = {
  deviceId: string;
  button: ButtonName;
  pressed: boolean;
  createdAt: Date;
  updatedAt: number;
};

export type LedCommand = {
  deviceId: string;
  led: "ON" | "OFF";
  createdAt: number;
};
