import { NotFoundError } from '@lso/services';
import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof ZodError) {
    return c.json({ error: 'validation_error', details: error.issues }, 400);
  }
  if (error instanceof NotFoundError) {
    return c.json({ error: 'not_found', message: error.message }, 404);
  }
  return c.json({ error: 'internal_error', message: 'Unexpected error' }, 500);
};
