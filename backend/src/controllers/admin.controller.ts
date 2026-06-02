import { Request, Response } from "express";
import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * GET /admin/users
 * Admin: get all users
 */
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Admin getAllUsers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /admin/users/:id
 * Admin: get any user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Admin getUserById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /admin/sanction-managers
 * Admin: create sanction manager account
 */
export const createSanctionManager = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.SANCTION_MANAGER,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Admin createSanctionManager error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
