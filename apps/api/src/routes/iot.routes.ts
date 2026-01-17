import { Router } from "express";
import { publishLed } from "../mqtt";
import type { LedCommand } from "../types/iot";

const IotRouter = Router();

IotRouter.post("/led", (req, res) => {
  const { deviceId, led } = req.body;

  if (!deviceId || !led) {
    return res
      .status(400)
      .json({ ok: false, message: "Missing deviceId or led" });
  }

  const cmd: LedCommand = {
    deviceId,
    led,
    createdAt: Date.now(),
  };

  publishLed(cmd);

  return res.json({ ok: true, command: cmd });
});

export default IotRouter;
