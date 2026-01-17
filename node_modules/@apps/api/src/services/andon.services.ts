import { db } from "./db";
import { CreateConveyorReqBody } from "../models/Conveyor.requests";
import { Request } from "express";
import { ErrorWithStatus } from "../models/Errors";
import { ResultSetHeader, RowDataPacket } from "mysql2";

// update adon status
export const updateConveyorStatus = async (
  status: string,
  req: Request
): Promise<void> => {
  const conveyor_id = req.params.id;
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM conveyor WHERE id = ?",
    [conveyor_id]
  );

  if (rows.length === 0) {
    throw new ErrorWithStatus({
      message: "Conveyor does not exist",
      status: 400,
    });
  }

  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE conveyor SET status = ? WHERE id = ?",
    [status, conveyor_id]
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
  req: CreateConveyorReqBody
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
