import multer from "multer";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// Set up storage with an environment variable for the upload directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = process.env.UPLOAD_DIR || "public/uploads/"; // Fallback to "uploads/" if UPLOAD_DIR is not set
    cb(null, uploadDir); // Directory where files will be saved
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate unique filename
  },
});

// Initialize upload middleware
export const upload = multer({ storage: storage });
