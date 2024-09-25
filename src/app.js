import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// Global CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend-url.onrender.com"], // Add your Render frontend URL here
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup for serving static files
const uploadDir = process.env.UPLOAD_DIR || "public/uploads/";
const uploadPath = path.join(__dirname, "..", uploadDir);
app.use("/public/uploads", express.static(uploadPath));

// API Routes
app.use("/api", userRoutes, requestRoutes, notificationsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
