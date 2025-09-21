import { FastifyInstance } from "fastify";
import { getUserProfile, updateUserProfile } from "../controllers/user";
import { authGuard } from "../services/authGuard";

export default async function userRoutes(app: FastifyInstance) {
  app.get(
    "/user/profile",
    {
      schema: {},
      preHandler: [authGuard],
    },
    getUserProfile
  );

  app.put(
    "/user/profile",
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
}
