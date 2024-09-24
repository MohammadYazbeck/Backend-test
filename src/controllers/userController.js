import { PrismaClient } from "@prisma/client"; // Import PrismaClient
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient(); // Initialize PrismaClient

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// Function to generate access and refresh tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign({ userId, role }, REFRESH_SECRET, {
    expiresIn: "30d",
  });
  return { accessToken, refreshToken };
};

// Login function
export const login = async (req, res) => {
  const { username, password, pushToken } = req.body;

  console.log(username, password, pushToken);
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "يجب ادخال اسم المستخدم و كلمة المرور" });
  }

  if (!pushToken) {
    return res.status(400).json({ message: "Pushtoken is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: "اسم المستخدم غير موجود" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "كلمة المرور غير صحيحة" });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Update push token in the database (optional)
    await prisma.user.update({
      where: { id: user.id },
      data: { pushToken: pushToken || undefined },
    });

    console.log("all good");
    const response = {
      username: user.username,
      userId: user.id,
      accessToken,
      refreshToken,
      pushToken,
    };

    if (user.role === "user") {
      const devices = await prisma.device.findMany({
        where: { userId: user.id },
      });
      const creditOptions = await prisma.creditOption.findMany();
      response.devices = devices;
      response.creditOptions = creditOptions;
    }

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId,
      decoded.role
    );

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

// Reset password function
export const resetPassword = async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res
      .status(400)
      .json({ message: "يجب ادخال اسم المستخدم وكلمة المرور" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "user") {
      return res
        .status(400)
        .json({ message: "Password reset can only be performed for users" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { username },
      data: { passwordHash: hashedPassword },
    });

    return res.status(200).json({ message: "لقد تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
