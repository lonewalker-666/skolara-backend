import { FastifyInstance } from "fastify";
import { authGuard } from "../services/authGuard";
import { getCategory, getCollegeById, getColleges, saveCollege } from "../controllers/colleges";

export default async function collegeRoutes(app: FastifyInstance) {
  app.get(
    "/colleges",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            category: { type: "number" },
          },
        },
      },
      preHandler: [authGuard],
    },
    getColleges
  );

  app.get(
    "/colleges/:id",
    {
      schema: {},
      preHandler: [authGuard],
    },
    getCollegeById
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
