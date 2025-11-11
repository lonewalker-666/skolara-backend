import { FastifyInstance } from "fastify";
import { authGuard } from "../services/authGuard";
import {
  uploadAccountController,
  uploadApplicationController,
} from "../controllers/upload";
import { TypeParams, typeParamSchema } from "../types/types";

export async function uploadRoutes(app: FastifyInstance) {
  app.put<{ Params: TypeParams }>(
    "/application/:type",
    {
      schema: {
        params: typeParamSchema,
      },
      preHandler: [authGuard],
    },
    uploadApplicationController,
  );

  app.put<{ Params: TypeParams }>(
    "/account/:type",
    {
      schema: {
        params: typeParamSchema,
      },
      preHandler: [authGuard],
    },
    uploadAccountController,
  );
}
