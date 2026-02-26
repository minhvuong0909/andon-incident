import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import IotRouter from "./routes/iot.routes";
import { initSocket } from "./socket";
import { initMQTT } from "./mqtt";
import http from "http";
import { testDB } from "./services/db";
import andonRoutes from "./routes/andon.routes";
import userRoutes from "./routes/user.routes";
import assignmentRoutes from "./routes/assignment.routes";
import notificationRoute from "./routes/notification.routes";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
initSocket(server);
initMQTT();

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API is running" });
});

app.use("/iot", IotRouter);

app.use("/conveyor", andonRoutes);

app.use("/users", userRoutes);

app.use("/assignment", assignmentRoutes);

app.use("/notifications", notificationRoute);

initMQTT();
testDB();

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(process.env.DATABASE_URL);

  console.log(`API running at http://localhost:${PORT}`);
});
