import { FastifyInstance } from "fastify";
import { authGuard } from "../services/authGuard";
import { getCategory, saveCollege } from "../controllers/colleges";

export default async function collegeRoutes(app: FastifyInstance) {
  app.get(
    "/colleges",
    {
      schema: {},
      preHandler: [authGuard],
    },
    async (request, reply) => {
      return { message: "List of colleges" };
    }
  );

  app.get(
    "/colleges/:id",
    {
      schema: {},
      preHandler: [authGuard],
    },
    async (request, reply) => {
      return { message: "List of colleges" };
    }
  );

  app.get(
    "/colleges/category",
    {
      schema: {},
    },
    getCategory
  );

  app.post(
    "/colleges/save",
    {
      schema: {
        body: {
          type: "object",
          properties: { college_id: { type: "string" } },
          required: ["college_id"],
        },
      },
      preHandler: [authGuard],
    },
    saveCollege
  );
}
