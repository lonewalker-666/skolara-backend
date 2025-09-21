import { FastifyInstance } from "fastify";
import { getUserProfile } from "../controllers/user";
import { authGuard } from "../services/authGuard";

export default async function userRoutes(app: FastifyInstance) {
  app.get(
    "/user/profile",
    {
      preHandler: [authGuard],
    },
    getUserProfile
  );
}
