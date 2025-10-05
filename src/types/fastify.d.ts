/* Ensure this file is treated as a global type definition (no imports here) */
import "fastify"; // keep this so TS knows which module to augment

declare module "fastify" {
  // ---- Request-scoped stuff (e.g., req.user from your auth) ----
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

  // ---- App-scoped stuff (decorations on `fastify`) ----
  interface FastifyInstance {
    supabase: import("@supabase/supabase-js").SupabaseClient;
  }
}
