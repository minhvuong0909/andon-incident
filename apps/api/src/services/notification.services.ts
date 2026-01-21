import { RowDataPacket } from "mysql2";
import { db } from "./db";
import { ErrorWithStatus } from "../models/Errors";
import HTTP_STATUS from "../constants/httpStatus";
import { io } from "../socket";
export const sendNotify = async (conveyor_id: number) => {
  const [conveyors] = await db.execute<RowDataPacket[]>(
    "SELECT id, status FROM conveyor WHERE id = ? AND status = 'stopped'",
    [conveyor_id],
  );

  if (conveyors.length === 0) {
    throw new ErrorWithStatus({
      message: "Conveyor is not available",
      status: HTTP_STATUS.CONFLICT,
    });
  }

  const [users] = await db.execute<RowDataPacket[]>(
    "SELECT id, name, status, role FROM user WHERE status = 'Active'",
  );

  if (users.length === 0) {
    throw new ErrorWithStatus({
      message: "User is not available",
      status: HTTP_STATUS.CONFLICT,
    });
  }
  // tạo mảng mới
  const values = users.map((user) => [conveyor_id, user.id]);
  // tạo thông báo
  await db.query("INSERT INTO notification (conveyor_id, user_id) VALUES ?", [
    values,
  ]);
  // realtime
  values.forEach(([_, userId]) =>
    io?.to(userId).emit("notification", {
      time: new Date(),
    }),
  );
};
