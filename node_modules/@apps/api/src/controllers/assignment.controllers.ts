import { Request, Response } from "express";
import {
  createAssignment,
  getAssignmentById,
  updateAssignment,
} from "../services/assignment.services";
import { db } from "../services/db";
import { get } from "node:http";

export const createAssignmentController = async (
  req: Request,
  res: Response
) => {
  const { user_id, conveyor_id } = req.body;
  const result = await createAssignment(user_id, conveyor_id);
  res.status(201).json({ message: "Assignment created successfully", result });
};

export const updateAssignmentController = async (
  req: Request,
  res: Response
) => {
  const assignment_id = req.params.id as unknown as number;
  const { status } = req.body;
  try {
    const result = await updateAssignment(assignment_id, status);
    res
      .status(200)
      .json({ message: "Assignment updated successfully", result });
  } catch (error) {
    res.status(400).json({ message: "Error updating assignment", error });
  }
};

export const getAssignmentByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const assignmentId = req.params.id as unknown as number;
    const result = await getAssignmentById(assignmentId);
    res.status(200).json({ assignment: result });
  } catch (error) {
    res.status(400).json({ message: "Error fetching assignment", error });
  }
};

export const getAllAssignmentsController = async (
  req: Request,
  res: Response
) => {
  try {
    const query = "SELECT * FROM assignment";
    const [assignments] = await db.execute(query);
    res.status(200).json({ result: assignments });
  } catch (error) {
    res.status(400).json({ message: "Error fetching assignments", error });
  }
};
