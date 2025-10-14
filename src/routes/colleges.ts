import { FastifyInstance } from "fastify";
import { authGuard } from "../services/authGuard";
import {
  applyCollege,
  getAppliedColleges,
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
            name: { type: "string" },
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
      schema: {
        params: {
          type: "object",
          properties: { id: { type: "string", format: "uuid" } },
          required: ["id"],
        },
      },
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
          properties: { college_id: { type: "string", format: "uuid" } },
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

  app.get(
    "/applied",
    {
      schema: {},
      preHandler: [authGuard],
    },
    getAppliedColleges,
  );

  app.post(
    "/apply",
    {
      schema: {
        body: {
          type: "object",
          properties: { 
            college_id: { type: "string", format: "uuid" },
            hsc_path: { type: "string" },
            sslc_path: { type: "string" },
           },
          required: ["college_id","sslc_path"],
        },
      },
      preHandler: [authGuard],
    },
    applyCollege,
  );
}
