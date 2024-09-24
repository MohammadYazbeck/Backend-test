import express from "express";
import {
  login,
  refreshToken,
  resetPassword,
} from "../controllers/userController.js";
import { authenticate, checkAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Authentecation
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/reset-password", authenticate, checkAdmin, resetPassword);

export default router;
