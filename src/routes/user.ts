import { FastifyInstance } from "fastify";
import {
  addNotification,
  deleteNotification,
  getFaq,
  getNotifications,
  getUserProfile,
  markNotificationAsRead,
  recordSupport,
  updateUserProfile,
} from "../controllers/user";
import { authGuard } from "../services/authGuard";
import { notificationPayloadSchema } from "../types/types";

export default async function userRoutes(app: FastifyInstance) {
  app.get(
    "/profile",
    {
      schema: {},
      preHandler: [authGuard],
    },
    getUserProfile
  );

  app.put(
    "/profile",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["first_name", "last_name", "email", "mobile"],
          properties: {
            first_name: { type: "string", minLength: 1 },
            last_name: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            mobile: { type: "string", pattern: "^[0-9]{10}$" },

            // nullable fields (use union types)
            gender: {
              type: ["string", "null"],
              enum: ["Male", "Female", "Others", null],
              default: null,
            },
            dob: {
              type: ["string", "null"],
              format: "date", // YYYY-MM-DD
              default: null,
            },
          },
        },
      },
      preHandler: [authGuard],
    },
    updateUserProfile
  );

  app.get("/notifications/all", { preHandler: [authGuard] }, getNotifications);
  app.post(
    "/notifications/add",
    {
      schema: {
        body: notificationPayloadSchema,
      },
      preHandler: [authGuard],
    },
    addNotification
  );
  app.put(
    "/notifications/mark-read/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string" } },
          required: ["id"],
        },
      },
      preHandler: [authGuard],
    },
    markNotificationAsRead
  );

  app.post(
    "/notifications/delete",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            notificationIds: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
            },
          },
          required: ["notificationIds"],
          additionalProperties: false,
        },
      },
      preHandler: [authGuard],
    },
    deleteNotification
  );

  app.get(
    "/faqs/complaints",
    {
      schema: {},
    },
    getFaq
  );

  app.put(
    "/support",
    {
      schema: {
        querystring: {
          type: "object",
          properties: { complaint_id: { type: "number" } },
          required: ["complaint_id"],
        },
      },
      preHandler: [authGuard],
    },
    recordSupport
  );
}
