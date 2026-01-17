import { Router } from "express";
import {
  createAssignmentController,
  getAllAssignmentsController,
  getAssignmentByIdController,
  updateAssignmentController,
} from "../controllers/assignment.controllers";

const assignmentRoutes = Router();

// assignmentRoutes
assignmentRoutes.post("/create", createAssignmentController);

// update
assignmentRoutes.put("/update/:id", updateAssignmentController);

// get assignment by id
assignmentRoutes.get("/:id", getAssignmentByIdController);

// get all assignments
assignmentRoutes.get("/", getAllAssignmentsController);
export default assignmentRoutes;
