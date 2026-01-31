import { Request, Response } from "express";
import {
  createConveyor,
  getListConveyorsByFactory,
  updateConveyorStatus,
} from "../services/andon.services";
import { CreateConveyorReqBody } from "../models/Conveyor.requests";
import { db } from "../services/db";

export const updateConveyorStatusController = async (
  req: Request,
  res: Response,
) => {
  try {
    await updateConveyorStatus(req.body.status, req);
    res.status(200).json({ message: "Conveyor status updated successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error updating conveyor status", error });
  }
};

export const createConveyorController = async (
  req: Request<any, any, CreateConveyorReqBody>,
  res: Response,
) => {
  try {
    await createConveyor(req.body);
    res.status(201).json({ message: "Conveyor created successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Error creating conveyor", error });
  }
};

export const getConveyorController = async (req: Request, res: Response) => {
  try {
    const conveyorId = req.params.id;
    const query = "SELECT * FROM conveyor WHERE id = ?";
    const [rows] = await db.execute(query, [conveyorId]);
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "Conveyor not found" });
    }
    res.status(200).json({ conveyor: (rows as any[])[0] });
  } catch (error) {
    res.status(400).json({ message: "Error fetching conveyor", error });
  }
};

export const getAllConveyorsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const query = "SELECT * FROM conveyor";
    const [conveyors] = await db.execute(query);
    res.status(200).json({ result: conveyors });
  } catch (error) {
    res.status(400).json({ message: "Error fetching conveyors", error });
  }
};

export const getConveyorsByFactoryController = async (
  req: Request,
  res: Response,
) => {
  try {
    const factory_id = Number(req.params.factory_id);
    const conveyors = await getListConveyorsByFactory(factory_id);
    res.status(200).json({ result: conveyors });
  } catch (error) {
    res.status(400).json({ message: "Error fetching conveyors", error });
  }
};

// lấy ra id của deveice gắn với conveyor
export const getConveyorByDeviceId = async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  const [rows] = await db.execute(
    "SELECT * FROM conveyor WHERE device_id = ?",
    [deviceId],
  );

  if ((rows as any[]).length === 0) {
    return res.status(404).json({
      message: "No conveyor mapped to this device",
    });
  }

  res.json((rows as any[])[0]);
};
