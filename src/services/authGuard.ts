import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService } from './jwt';

export async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'UNAUTHORIZED' });
  }
  const token = hdr.slice('Bearer '.length).trim();
  try {
    const payload = JwtService.verifyAccess(token);
    (req as any).user = payload; // attach
  } catch {
    return reply.code(401).send({ error: 'UNAUTHORIZED' });
  }
}
