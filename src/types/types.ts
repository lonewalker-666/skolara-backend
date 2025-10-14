import { FastifyRequest } from "fastify";

export type MultipartRequest<P = { type: "hsc" | "sslc" }> = FastifyRequest<{
  Params: P;
}> & {
  file: (
    // you can pass through options if you want to filter by fieldname, limits, etc.
    opts?: Parameters<FastifyRequest["file"]>[0]
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

export const savedCollegesSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      area: { type: "string", nullable: true },
      city: { type: "string", nullable: true },
      logo_url: { type: "string", format: "uri", nullable: true },
      is_saved: { type: "boolean" },
      is_applied: { type: "boolean" },
    },
    required: [
      "id",
      "name",
      "is_saved",
      "is_applied",
      "logo_url",
      "area",
      "city",
    ],
  },
} as const;
