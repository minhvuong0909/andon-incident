import { io } from "socket.io-client";

export const socket = io("http://192.168.0.122:4000", {
  transports: ["websocket"],
});
