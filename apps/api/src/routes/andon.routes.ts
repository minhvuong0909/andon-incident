import { Router } from "express";
import {
  createConveyorController,
  getAllConveyorsController,
  getConveyorController,
  updateConveyorStatusController,
} from "../controllers/andon.controllers";
import { get } from "node:http";

const andonRoutes = Router();

andonRoutes.put("/status/:id", updateConveyorStatusController);

andonRoutes.post("/create", createConveyorController);

andonRoutes.get("/:id", getConveyorController);

andonRoutes.get("/", getAllConveyorsController);
export default andonRoutes;
