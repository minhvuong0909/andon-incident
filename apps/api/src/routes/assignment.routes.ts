import { Router } from "express";
import {
  createAssignmentController,
  getAllAssignmentsController,
  getAssignmentByIdController,
  updateAssignmentController,
  updateManyAssignmentsByConveyorIdController,
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

// update many assignments by conveyor id
assignmentRoutes.put(
  "/update-by-conveyor/:id",
  updateManyAssignmentsByConveyorIdController,
);
export default assignmentRoutes;
