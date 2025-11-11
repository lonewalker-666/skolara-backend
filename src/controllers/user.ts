import { prisma } from "../db/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { updateUserProfileSchema } from "../schemas/user";
import toHttpError from "../utils/toHttpError";
import { DeleteNotificationsBody, NotificationPayload } from "../types/types";

export async function getUserProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = req.user;
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    console.log("getUserProfile body --------- ", req.body);
    const profile = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: {
        ref_id: true,
        mobile: true,
        email: true,
        first_name: true,
        last_name: true,
        gender: true,
        dob: true,
        prefered_theme: true,
        allow_notifications: true,
      },
    });

    if (!profile) {
      return reply.code(404).send({ error: "User not found" });
    }
    const profileData = {
      user_id: profile.ref_id,
      mobile: profile.mobile,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      gender: profile.gender,
      dob: profile.dob,
      prefered_theme: profile.prefered_theme,
      allow_notifications: profile.allow_notifications,
    };
    return reply.send(profileData);
  } catch (e: any) {
    console.log("getUserProfile error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
}

export async function updateUserProfile(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = req.user;
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    console.log("updateUserProfile body --------- ", req.body);
    const profile = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: {
        id: true,
      },
    });

    if (!profile) {
      return reply.code(404).send({ error: "User not found" });
    }

    const updateData = updateUserProfileSchema.parse(req.body);
    const { first_name, last_name, gender, dob } = updateData;
    await prisma.users.update({
      where: { id: profile.id },
      data: {
        first_name,
        last_name,
        gender,
        dob,
        email: updateData.email.toLowerCase(),
        mobile: updateData.mobile,
      },
    });

    return reply.send({ message: "Profile updated successfully" });
  } catch (e: any) {
    console.log("updateUserProfile error --------- ", e);

    const { status, payload } = toHttpError(e);
    if (status === 409) {
      return reply.code(400).send({ error: "Email or Mobile already exists" });
    }
    return reply.status(status).send(payload);
  }
}

export async function getNotifications(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = req.user;
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const checkUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { ref_id: true, id: true },
    });

    if (!checkUser) {
      return reply.code(404).send({ error: "User not found" });
    }

    const notifications = await prisma.notifications.findMany({
      where: { user_id: checkUser.id },
      select: {
        id: true,
        title: true,
        subtitle: true,
        created_at: true,
        is_read: true,
        updated_at: true,
        imageUrl: true,
        navigationUrl: true,
        priority: true,
        notificationId: true,
      },
      orderBy: { created_at: "desc" },
      // take: 10,
      // skip: 0,
    });

    return reply.send(notifications);
  } catch (e: any) {
    console.log("getNotifications error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
}

export async function addNotification(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = req?.user?.sub;

    const checkUser = await prisma.users.findUnique({
      where: { ref_id: userId },
      select: { ref_id: true, id: true },
    });

    if (!checkUser) {
      return reply.code(404).send({ error: "User not found" });
    }

    const {
      title,
      subtitle,
      imageUrl,
      navigationUrl,
      priority,
      notificationId,
    } = req.body as NotificationPayload;
    await prisma.notifications.create({
      data: {
        user_id: checkUser.id,
        title,
        subtitle,
        imageUrl,
        navigationUrl,
        priority,
        notificationId,
      },
    });
    reply.status(201).send({ message: "Notification added successfully" });
  } catch (e) {
    console.log("addNotification error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
}

export async function markNotificationAsRead(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = req?.user?.sub;
    const notificationId = (req.params as { id: string }).id;

    const checkUser = await prisma.users.findUnique({
      where: { ref_id: userId },
      select: { ref_id: true, id: true },
    });

    if (!checkUser) {
      return reply.code(404).send({ error: "User not found" });
    }

    const notification = await prisma.notifications.findUnique({
      where: { notificationId: notificationId },
      select: { id: true, user_id: true },
    });

    if (!notification || notification.user_id !== checkUser.id) {
      return reply.code(404).send({ error: "Notification not found" });
    }

    await prisma.notifications.update({
      where: { id: notification.id },
      data: { is_read: true },
    });

    return reply.send({ message: "Notification marked as read" });
  } catch (e: any) {
    console.log("markNotificationAsRead error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
}

export async function deleteNotification(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = (req as any)?.user?.sub;

    // Basic input validation
    const body = req.body as DeleteNotificationsBody | undefined;
    const ids = Array.isArray(body?.notificationIds)
      ? body!.notificationIds
      : [];

    if (!ids.length) {
      return reply
        .code(400)
        .send({ error: "notificationIds must be a non-empty array" });
    }

    // De-duplicate incoming ids
    const uniqueIds = [...new Set(ids)];

    // Verify user
    const checkUser = await prisma.users.findUnique({
      where: { ref_id: userId },
      select: { ref_id: true, id: true },
    });

    if (!checkUser) {
      return reply.code(404).send({ error: "User not found" });
    }

    // BULK DELETE: only delete records that belong to this user
    // Adjust the field name below if your unique identifier is different
    // (e.g. use `id` instead of `notificationId`).
    const { count } = await prisma.notifications.deleteMany({
      where: {
        notificationId: { in: uniqueIds },
        user_id: checkUser.id,
      },
    });

    if (count === 0) {
      return reply
        .code(404)
        .send({
          error: "No notifications found for this user with the provided ids",
        });
    }

    return reply.send({
      message: "Notifications deleted successfully",
      deletedCount: count,
    });
  } catch (e: any) {
    console.log("deleteNotification error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
}

export const getFaq = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const faqs = await prisma.complaints.findMany({
      select: {
        id: true,
        question: true,
        answer: true,
      },
      orderBy: { id: "asc" },
    });

    return reply.send(faqs);
  } catch (e: any) {
    console.log("getFaq error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
}

export const recordSupport = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (req as any)?.user?.sub;
    const { complaint_id } = req.query as { complaint_id: number };

    const checkUser = await prisma.users.findUnique({
      where: { ref_id: userId },
      select: { ref_id: true, id: true },
    });

    if (!checkUser) {
      return reply.code(404).send({ error: "User not found" });
    }

    const checkComplaint = await prisma.complaints.findUnique({
      where: { id: complaint_id },
      select: { id: true },
    });

    if (!checkComplaint) {
      return reply.code(404).send({ error: "Complaint not found" });
    }

    await prisma.user_compliance.create({
      data: {
        user_id: checkUser.id,
        complaint_id: 1,
      },
    });

    return reply
      .code(201)
      .send({ message: "Support request recorded successfully" });
  } catch (e: any) {
    console.log("recordSupport error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
};