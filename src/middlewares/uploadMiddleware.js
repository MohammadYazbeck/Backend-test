import multer from "multer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Set up storage with an environment variable for the upload directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = process.env.UPLOAD_DIR || "public/uploads/";
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Initialize upload middleware
export const upload = multer({ storage: storage });
