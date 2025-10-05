import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { createSupabaseClient } from "../config/supabase";

export default fp(async function supabasePlugin(fastify: FastifyInstance) {
  const supabase = createSupabaseClient();
  // Types come from src/types/fastify.d.ts
  fastify.decorate("supabase", supabase);
});
