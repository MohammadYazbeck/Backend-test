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
app.use(
  cors({
    origin: ["*"],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// This is how you emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the uploads directory relative to the root of the project
const uploadDir = process.env.UPLOAD_DIR || "/public/uploads/";
// Adjust the path to be relative to the location of app.js
const uploadPath = path.join(__dirname, "..", uploadDir); // Navigate up from 'src' to root

// Serve the uploads folder statically
app.use("/public/uploads/", express.static(uploadPath));

// Other middlewares and routes
app.use("/api", userRoutes, requestRoutes, notificationsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
