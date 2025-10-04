// src/types/fastify.d.ts
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      mobile: string;
      email?: string | null;
      type: "access";
      iat: number;
      exp: number;
    };
  }
}
