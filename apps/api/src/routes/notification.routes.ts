import { Router } from "express";
import {
  getNotificationsController,
  sendNotifyController,
} from "../controllers/notification.controllers";

const notificationRoute = Router();

notificationRoute.post("/send", sendNotifyController);

// get notificaitions
notificationRoute.get("/", getNotificationsController);
export default notificationRoute;
