import { Request, Response } from "express";
import { login, register } from "../services/user.services";
import { RegisterReqBody } from "../models/User.requests";
import { db } from "../services/db";
import { ErrorWithStatus } from "../models/Errors";

export const registerController = async (
  req: Request<any, any, RegisterReqBody>,
  res: Response
) => {
  try {
    await register(req);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error registering user", error });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ErrorWithStatus({
        message: "Username and password are required",
        status: 400,
      });
    }
    const { user } = await login(username, password);
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(400).json({ message: "Error logging in", error });
  }
};

export const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const query = "SELECT * FROM user WHERE id = ?";
    const [users] = await db.execute(query, [userId]);
    if ((users as any[]).length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userInfo } = (users as any[])[0];
    res.status(200).json({ user: userInfo });
  } catch (error) {
    res.status(400).json({ message: "Error fetching user", error });
  }
};

export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const query =
      "SELECT id, factory_id, department, name, username, role, status FROM user";
    const [users] = await db.execute(query);
    res.status(200).json({ result: users });
  } catch (error) {
    res.status(400).json({ message: "Error fetching users", error });
  }
};
