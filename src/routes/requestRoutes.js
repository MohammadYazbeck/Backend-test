import express from "express";
import { authenticate, checkAdmin } from "../middlewares/authMiddleware.js";
import {
  addRequest,
  deleteAllRequests,
  getPendingRequests,
  getRequestsById,
  getfilteredRequest,
  setRequestStatus,
} from "../controllers/requestController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Admin Requests
router.get("/requests/pending", authenticate, checkAdmin, getPendingRequests);
router.get("/requests/filtered", authenticate, checkAdmin, getfilteredRequest);
router.post(
  "/requests/delete-all-requests",
  authenticate,
  checkAdmin,
  deleteAllRequests
);
router.post("/request/set-status", authenticate, checkAdmin, setRequestStatus);

// User Requests

router.post("/request/add", authenticate, upload.single("photo"), addRequest);
router.get("/requests/user", authenticate, getRequestsById);

export default router;
