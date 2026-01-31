import { RowDataPacket } from "mysql2";
import HTTP_STATUS from "../constants/httpStatus";
import { ErrorWithStatus } from "../models/Errors";
import { db } from "./db";

export const createAssignment = async (user_id: number) => {
  const [userRows] = await db.execute<RowDataPacket[]>(
    "SELECT id, name, status, role FROM user WHERE id = ? AND status = 'Active' AND role = 'Fixer'",
    [user_id],
  );

  if (userRows.length === 0) {
    throw new ErrorWithStatus({
      message: "User is not available",
      status: HTTP_STATUS.CONFLICT,
    });
  }
  // insert assignment
  return await db.execute(
    "INSERT INTO assignment (user_id, status) VALUES (?, 'Ready')",
    [user_id],
  );
};

export const updateAssignment = async (
  assignment_id: number,
  conveyor_id: number,
  status: string,
) => {
  const [conveyorRows] = await db.execute<RowDataPacket[]>(
    "SELECT id, status FROM conveyor WHERE id = ? AND status = 'stopped'",
    [conveyor_id],
  );

  if (conveyorRows.length === 0) {
    throw new ErrorWithStatus({
      message: "Conveyor is not available",
      status: HTTP_STATUS.CONFLICT,
    });
  }
  const [assignmentRows] = await db.execute<RowDataPacket[]>(
    "SELECT id, status FROM assignment WHERE id = ?",
    [assignment_id],
  );
  if (assignmentRows.length === 0) {
    throw new ErrorWithStatus({
      message: "Assignment does not exist",
      status: HTTP_STATUS.NOT_FOUND,
    });
  }

  return await db.execute(
    "UPDATE assignment SET status = ?, conveyor_id = ? WHERE id = ?",
    [status, conveyor_id, assignment_id],
  );
};

export const getAssignmentById = async (assignment_id: number) => {
  const [assignmentRows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM assignment WHERE id = ?",
    [assignment_id],
  );
  if (assignmentRows.length === 0) {
    throw new ErrorWithStatus({
      message: "Assignment not found",
      status: HTTP_STATUS.NOT_FOUND,
    });
  }
  return assignmentRows[0];
};

export const updateManyAssignmentsByConveyorId = async (
  conveyor_id: number,
  status: string,
) => {
  const [result] = await db.execute(
    `UPDATE assignment
     SET status = ?, conveyor_id = NULL
     WHERE conveyor_id = ? AND status = 'Assigned'`,
    [status, conveyor_id],
  );

  return result;
};

export const getAssignmentsByToday = async () => {
  const [assignmentRows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM assignment
     WHERE DATE(created_at) = CURDATE()`,
  );
  return assignmentRows;
};
