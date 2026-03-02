import { Request, Response } from "express";
import { sendNotify } from "../services/notification.services";
import { db } from "../services/db";

export const sendNotifyController = async (req: Request, res: Response) => {
  try {
    await sendNotify(req.body.conveyor_id);
    return res
      .status(200)
      .json({ ok: true, message: "Notification sent successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, message: "Failed to send notification", error });
  }
};

export const getNotificationsController = async (
  req: Request,
  res: Response,
) => {
  // Placeholder implementation
  try {
    const [notifications] = await db.execute("SELECT * FROM notification");
    return res.status(200).json({ ok: true, notifications });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, message: "Failed to fetch notifications", error });
  }
};
