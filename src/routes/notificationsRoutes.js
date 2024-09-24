import express from "express";

import { authenticate } from "../middlewares/authMiddleware.js";
import { getNotificaitons } from "../controllers/notificationController.js";

const router = express.Router();

// Authentecation
router.get("/notifications", authenticate, getNotificaitons);

export default router;
