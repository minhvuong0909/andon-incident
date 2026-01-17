import { Request } from "express";
import { db } from "./db";
import bcrypt from "bcrypt";
import { ErrorWithStatus } from "../models/Errors";
import { userInfo } from "node:os";
export const register = async (req: Request) => {
  const { username, password, role, department, name, factory_id } = req.body;
  const factory = await db.query("SELECT * FROM factory where id = ?", [
    factory_id,
  ]);
  if ((factory[0] as any[]).length === 0) {
    throw new ErrorWithStatus({
      message: "Factory does not exist",
      status: 400,
    });
  }

  const existingUser = await db.query("SELECT * FROM user WHERE username = ?", [
    username,
  ]);
  if ((existingUser[0] as any[]).length > 0) {
    throw new ErrorWithStatus({
      message: "Username already exists",
      status: 400,
    });
  }
  // validate input
  if (!username || !password) {
    throw new Error("Username and password are required");
  }
  const saltRounds = 10;

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const query =
    "INSERT INTO user (factory_id, department, name,  username, password, role) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [factory_id, department, name, username, hashedPassword, role];
  await db.execute(query, values);
  return { message: "User registered successfully" };
};

export const login = async (username: string, password: string) => {
  const [users] = await db.execute("SELECT * FROM user WHERE username = ?", [
    username,
  ]);
  if ((users as any[]).length === 0) {
    throw new ErrorWithStatus({
      message: "Invalid username or password",
      status: 401,
    });
  }
  const user = (users as any[])[0];
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new ErrorWithStatus({
      message: "Invalid username or password",
      status: 401,
    });
  }

  const { password: _, ...userInfo } = user;
  return { message: "Login successful", user: userInfo };
};
