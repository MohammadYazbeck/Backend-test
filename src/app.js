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
    origin: (origin, callback) => {
      // Allow all origins plus explicitly allow localhost
      if (!origin || origin === "http://localhost:5173") {
        return callback(null, true);
      }
      return callback(null, true); // Allow all origins
    },
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = process.env.UPLOAD_DIR || "public/uploads/";
const uploadPath = path.join(__dirname, "..", uploadDir);

// Static file serving with correct CORS headers
app.use(
  "/public/uploads/",
  express.static(uploadPath, {
    setHeaders: function (res, path, stat) {
      res.set("Access-Control-Allow-Origin", "http://localhost:5173");
      res.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
    },
  })
);

app.use("/api", userRoutes, requestRoutes, notificationsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
