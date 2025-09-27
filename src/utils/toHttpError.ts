// helpers/httpError.ts
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

type HttpErrorPayload = {
  error: string;
  code?: string;
  issues?: unknown;
  // In dev we can attach debug info (stack/metadata)
  debug?: { meta?: unknown; stack?: string };
};

export default function toHttpError(e: unknown): { status: number; payload: HttpErrorPayload } {
  const isProd = process.env.NODE_ENV === 'production';
  const anyErr = e as any;

  // 1) Zod schema validation
  if (e instanceof ZodError) {
    return {
      status: 422,
      payload: {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        issues: e.issues,
        ...(isProd ? {} : { debug: { stack: e.stack } }),
      },
    };
  }

  // 2) Prisma (known request errors)
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = (e as Prisma.PrismaClientKnownRequestError).meta;
    const base = {
      code: e.code,
      ...(isProd ? {} : { debug: { meta, stack: (e as Error).stack } }),
    };

    switch (e.code) {
      case 'P2002': // Unique constraint
        return { status: 409, payload: { error: 'Duplicate value violates unique constraint', ...base } };
      case 'P2025': // Record not found
        return { status: 404, payload: { error: 'Record not found', ...base } };
      case 'P2003': // Foreign key violation
        return { status: 400, payload: { error: 'Foreign key constraint failed', ...base } };
      case 'P2000': // Value too long
        return { status: 400, payload: { error: 'Value too long for column', ...base } };
      case 'P2024': // Timeout
        return { status: 503, payload: { error: 'Database timeout', ...base } };
      default:
        return { status: 500, payload: { error: 'Database error', ...base } };
    }
  }

  // 3) Prisma validation/initialization errors
  if (e instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      payload: {
        error: 'Invalid query or data for Prisma operation',
        code: 'PRISMA_VALIDATION',
        ...(isProd ? {} : { debug: { stack: (e as Error).stack } }),
      },
    };
  }
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      payload: {
        error: 'Database initialization error',
        code: 'PRISMA_INIT',
        ...(isProd ? {} : { debug: { stack: (e as Error).stack } }),
      },
    };
  }

  // 4) Raw Postgres errors (node-postgres / drivers)
  if (anyErr?.code && typeof anyErr.code === 'string') {
    const code = anyErr.code as string;
    const base = { code, ...(isProd ? {} : { debug: { stack: anyErr.stack } }) };

    switch (code) {
      case '23505': // unique_violation
        return { status: 409, payload: { error: 'Duplicate value violates unique constraint', ...base } };
      case '23503': // foreign_key_violation
        return { status: 400, payload: { error: 'Referenced record does not exist', ...base } };
      case '23502': // not_null_violation
        return { status: 400, payload: { error: 'Required field missing', ...base } };
      case '22P02': // invalid_text_representation (bad UUID, number parse, etc.)
        return { status: 400, payload: { error: 'Invalid input syntax', ...base } };
      case '22001': // string_data_right_truncation
        return { status: 400, payload: { error: 'Value too long', ...base } };
      case '22003': // numeric_value_out_of_range (you saw this)
        return { status: 400, payload: { error: 'Numeric value out of range', ...base } };
      default:
        if (code.startsWith('08')) { // connection errors
          return { status: 503, payload: { error: 'Database connection error', ...base } };
        }
    }
  }

  // 5) Boom / http-errors style
  if (anyErr?.isBoom && anyErr.output?.statusCode) {
    return {
      status: anyErr.output.statusCode,
      payload: { error: anyErr.message, code: 'BOOM_ERROR' },
    };
  }
  if (Number.isInteger(anyErr?.statusCode)) {
    return { status: anyErr.statusCode, payload: { error: anyErr.message ?? 'Error' } };
  }
  if (Number.isInteger(anyErr?.status)) {
    return { status: anyErr.status, payload: { error: anyErr.message ?? 'Error' } };
  }

  // 6) Fallback
  return {
    status: 500,
    payload: {
      error: 'Internal Server Error',
      ...(isProd ? {} : { debug: { stack: (anyErr as Error)?.stack } }),
    },
  };
}
