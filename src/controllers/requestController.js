import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  sendNotification,
  sendAppNotification,
} from "../services/notificationService.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const prisma = new PrismaClient();

//  ----- > ADMIM < -----

// Pending Requests
export const getPendingRequests = async (req, res) => {
  try {
    const pendingRequests = await prisma.request.findMany({
      where: { status: { equals: "pending" } },
      orderBy: { requestDate: "desc" },
    });

    return res.json({
      data: pendingRequests,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Fitlerd Request By Date
export const getfilteredRequest = async (req, res) => {
  const { daysAgo } = req.query;

  if (!daysAgo) {
    return res.status(400).json({ message: "daysAgo is required" });
  }

  try {
    const currentDate = new Date(); // Current date
    const pastDate = new Date(); // A new date object for pastDate

    pastDate.setDate(currentDate.getDate() - Number(daysAgo)); // Subtract days from the new date object

    const filterdRequests = await prisma.request.findMany({
      where: {
        requestDate: { gt: pastDate },
        status: { in: ["accepted", "declined"] },
      },
      orderBy: { requestDate: "desc" },
    });

    return res.json({
      data: filterdRequests,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Change Request Status
export const setRequestStatus = async (req, res) => {
  const { requestId, newStatus, notes } = req.body;

  if (!requestId || !newStatus) {
    return res
      .status(400)
      .json({ message: "Missing one or more of the request parameters" });
  }

  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res
        .status(401)
        .json({ message: "The request you want to update is not found" });
    }

    const oldPhotoPath = request.noticeOfTransferPhoto;

    await prisma.$transaction(async (prisma) => {
      // Update request status in request table and delete the related photo to noticeOfTransferPhoto
      await prisma.request.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          notes: notes || undefined,
          noticeOfTransferPhoto: "",
        },
      });

      if (oldPhotoPath) {
        const filePath = path.join("uploads", path.basename(oldPhotoPath));
        if (fs.existsSync(filePath)) {
          try {
            await fs.promises.unlink(filePath);
            console.log("File deleted:", filePath);
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        } else {
          console.warn("File not found:", filePath);
        }
      }

      // Add a notificiton to for that user (after checking if he has less than 5 notificaitons if no delete old ones!)
      const notifications = await prisma.notification.findMany({
        where: { userId: request.userId },
        orderBy: { timestamp: "asc" },
      });

      if (notifications.length >= 5) {
        await prisma.notification.deleteMany({
          where: {
            id: {
              in: notifications
                .slice(0, notifications.length - 4)
                .map((n) => n.id),
            },
          },
        });
      }

      await prisma.notification.create({
        data: {
          message:
            newStatus === "accepted"
              ? "لقد تم قبول طلبك بنجاح"
              : "لقد تم رفض طلبك",
          userId: request.userId,
        },
      });
    });

    // Send PUSH NOTIFICATION

    const userPushToken = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { pushToken: true },
    });

    if (userPushToken) {
      await sendAppNotification(
        userPushToken.pushToken,
        "Digicom",
        `${
          newStatus === "accepted"
            ? "لقد تم قبول طلبك بنجاح"
            : "لقد تم رفض طلبك"
        }`
      );
    }

    return res.status(200).json({
      message: "Reqeust status updated and notifcation sent successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//  ----- > User < -----

export const addRequest = async (req, res) => {
  const {
    userId,
    deviceNumber,
    credit,
    calculatedCredit,
    destinationOrg,
    noticeOfTransfer,
  } = req.body;
  if (!req.file) {
    return res.status(400).json({ message: "Photo is required." });
  }

  // Construct the URL or path to the uploaded file

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const noticeOfTransferPhoto = `${baseUrl}/${req.file.path.replace(
    /\\/g,
    "/"
  )}`;

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { username: true, pushToken: true },
  });

  if (!user) {
    return res.status(400).json({ message: "incorrect userId" });
  }

  try {
    const newRequest = await prisma.$transaction(async (prisma) => {
      // Create a new request

      const createdRequest = await prisma.request.create({
        data: {
          userId: parseInt(userId),
          deviceNumber,
          credit: parseFloat(credit),
          calculatedCredit: parseFloat(calculatedCredit),
          destinationOrg,
          noticeOfTransfer,
          noticeOfTransferPhoto,
          username: user.username,
          status: "pending",
        },
      });

      // Add a notificiton to admin (after checking if he has less than 5 notificaitons if no delete old ones!)

      const notifications = await prisma.notification.findMany({
        where: { userId: 0 },
        orderBy: { timestamp: "asc" },
        select: { id: true },
      });

      if (notifications.length >= 5) {
        await prisma.notification.deleteMany({
          where: {
            id: {
              in: notifications
                .slice(0, notifications.length - 4)
                .map((n) => n.id),
            },
          },
        });
      }

      await prisma.notification.create({
        data: {
          message: `${user.username} لديك طلب جديد من `,
          userId: 0,
        },
      });

      return createdRequest;
    });

    const admin = await prisma.user.findUnique({ where: { id: 0 } });
    const pushToken = admin.pushToken;
    if (admin.pushToken) {
      await sendNotification(
        pushToken,
        "Digicom",
        `${user.username} لديك طلب جديد من `
      );
    }

    return res.status(201).json({
      message: "Request created successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get Request by ID
export const getRequestsById = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "userid is required" });
  }

  try {
    const requests = await prisma.request.findMany({
      where: { userId: Number(id) },
      orderBy: { requestDate: "desc" },
      take: 5,
    });

    return res.json({
      data: requests,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAllRequests = async (req, res) => {
  const { adminPassword, dbKey } = req.body;

  if (!adminPassword || !dbKey) {
    return res
      .status(400)
      .json({ message: "Admin password and database key required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: 0 } });

    if (!user) {
      return res.status(401).json({ message: "اسم المستخدم غير موجود" });
    }

    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "كلمة المرور غير صحيحة" });
    }

    const isDbKeyValid = process.env.DATABASE_DELETE_KEY === dbKey;

    if (!isDbKeyValid) {
      return res
        .status(401)
        .json({ message: " مفتاح قاعدة البيانات غير صحيح" });
    }

    // 1. Delete all requests from the database
    await prisma.request.deleteMany();

    // 2. Delete all files in the 'uploads' folder
    const uploadsDir = path.join("public/uploads");

    try {
      const files = await fs.promises.readdir(uploadsDir);

      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        await fs.promises.unlink(filePath);
        console.log("Deleted file:", filePath);
      }

      console.log("All files deleted from uploads folder");
    } catch (err) {
      console.error("Error reading or deleting files from uploads:", err);
    }

    return res
      .status(200)
      .json({ message: "تم حذف جميع الطلبات والملفات بنجاح" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
