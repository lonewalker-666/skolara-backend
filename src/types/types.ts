import { FastifyRequest } from "fastify";

export type MultipartRequest<P = { type: "hsc" | "sslc" }> = FastifyRequest<{
  Params: P;
}> & {
  file: (
    // you can pass through options if you want to filter by fieldname, limits, etc.
    opts?: Parameters<FastifyRequest["file"]>[0],
  ) => Promise<import("@fastify/multipart").MultipartFile | undefined>;
};

export type TypeParams = { type: "hsc" | "sslc" };

export const typeParamSchema = {
  type: "object",
  required: ["type"],
  properties: {
    type: { type: "string", enum: ["hsc", "sslc"] },
  },
} as const;

export const binaryBodySchema = {
  type: "object",
  required: ["file"],
  properties: {
    file: { type: "string", format: "binary" },
  },
} as const;
