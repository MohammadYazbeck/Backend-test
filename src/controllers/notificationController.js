import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Notifications
export const getNotificaitons = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: Number(id) },
      orderBy: { timestamp: "desc" },
    });
    return res.json({
      data: notifications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
