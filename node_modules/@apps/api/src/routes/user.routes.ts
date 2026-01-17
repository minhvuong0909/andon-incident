import { Router } from "express";
import { getAllUsersController, getUserByIdController, loginController, registerController } from "../controllers/user.controllers";
import { get } from "node:http";

const userRoutes = Router();

// register
userRoutes.post("/register", registerController);

// login
userRoutes.post("/login", loginController);

// get user by id
userRoutes.get("/:id", getUserByIdController);

// get all users
userRoutes.get("/", getAllUsersController);
export default userRoutes;
