import admin from "../../config/firebaseAdmin.js";

export async function sendNotification(pushToken, title, body) {
  const message = {
    token: pushToken,
    data: {
      title: title,
      body: body,
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export async function sendAppNotification(pushToken, title, body) {
  const message = {
    token: pushToken,
    notification: {
      title: title,
      body: body,
    },
    data: {},
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
