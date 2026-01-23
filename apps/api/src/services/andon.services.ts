import { db } from "./db";
import { CreateConveyorReqBody } from "../models/Conveyor.requests";
import { Request } from "express";
import { ErrorWithStatus } from "../models/Errors";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ButtonEvent } from "../types/iot";

// update adon status
export const updateConveyorStatus = async (
  status: string,
  req: Request,
): Promise<void> => {
  const conveyor_id = req.params.id;
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM conveyor WHERE id = ?",
    [conveyor_id],
  );

  if (rows.length === 0) {
    throw new ErrorWithStatus({
      message: "Conveyor does not exist",
      status: 400,
    });
  }

  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE conveyor SET status = ? WHERE id = ?",
    [status, conveyor_id],
  );

  if (result.affectedRows === 0) {
    throw new ErrorWithStatus({
      message: "Update failed",
      status: 400,
    });
  }
};

// create conveyor
export const createConveyor = async (
  req: CreateConveyorReqBody,
): Promise<void> => {
  // check có tồn tại trong factory
  const factory = await db.execute("SELECT * FROM factory WHERE id = ?", [
    req.factory_id,
  ]);
  if (!factory) {
    throw new ErrorWithStatus({
      message: "Factory does not exist",
      status: 400,
    });
  }
  const query = "INSERT INTO conveyor (factory_id, name) VALUES (?, ?)";
  const values = [req.factory_id, req.name];
  try {
    const [result] = await db.execute(query, values);
    console.log(`Conveyor created with ID ${(result as any).insertId}`);
  } catch (error) {
    console.error("Error creating conveyor:", error);
    throw error;
  }
};

//
const DEVICE_TO_BELT: Record<string, number> = {
  esp8266_01: 1,
  esp32_02: 2,
};
export async function updateBeltStatus(data: ButtonEvent) {
  if (!data.pressed) return;

  const beltId = DEVICE_TO_BELT[data.deviceId];
  if (!beltId) {
    console.log("Device chưa được gắn băng truyền:", data.deviceId);
    return;
  }

  let nextStatus: "running" | "stopped" | null = null;

  if (data.button === "ENTER") nextStatus = "stopped";
  if (data.button === "RESET") nextStatus = "running";

  if (!nextStatus) return;

  try {
    // Update conveyor
    const res = await fetch(`http://localhost:4000/conveyor/status/${beltId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    console.log(`Belt ${beltId} -> ${nextStatus}`, res.status);

    // Nếu RESET => update assignment luôn
    if (data.button === "RESET") {
      const res2 = await fetch(
        `http://localhost:4000/assignment/update-by-conveyor/${beltId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Done",
          }),
        },
      );

      console.log(`Assignment belt ${beltId} -> Done`, res2.status);
    }
  } catch (err) {
    console.log("Call API lỗi:", err);
  }
}
