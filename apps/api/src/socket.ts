import { Server } from "socket.io";
import type { ButtonEvent } from "./types/iot";

let io: Server | null = null;

export function initSocket(httpServer: any) {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("Web connected:", socket.id);
  });

  return io;
}

export function emitButtonEvent(data: ButtonEvent) {
  if (!io) return;
  io.emit("button:event", data);
}
