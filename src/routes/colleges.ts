import { FastifyInstance } from "fastify";
import { authGuard } from "../services/authGuard";
import {
  getCategory,
  getCollegeById,
  getColleges,
  getSavedColleges,
  saveCollege,
} from "../controllers/colleges";

export default async function collegeRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            category: { type: "number" },
            search: { type: "string" },
          },
        },
      },
      preHandler: [authGuard],
    },
    getColleges,
  );

  app.get(
    "/:id",
    {
      schema: {},
      preHandler: [authGuard],
    },
    getCollegeById,
  );

  app.get(
    "/category",
    {
      schema: {},
    },
    getCategory,
  );

  app.post(
    "/save",
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
    saveCollege,
  );

  app.get(
    "/save",
    {
      schema: {},
      preHandler: [authGuard],
    },
    getSavedColleges,
  );

}
