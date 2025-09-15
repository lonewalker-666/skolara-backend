import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fastify } from '../src/index.js';

describe('Integration Tests', () => {
  beforeAll(async () => {
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
    });
  });

    describe('OpenAPI Documentation', () => {
    it('should serve OpenAPI spec', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/documentation/json',
      });

      expect(response.statusCode).toBe(200);
      const spec = JSON.parse(response.body);
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Skolara API');
    });
  });
});