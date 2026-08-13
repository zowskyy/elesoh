import { NotFoundError } from '@lso/services';
import { UrlSecurityError } from '@lso/security';
import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof ZodError) {
    return c.json({ error: 'validation_error', details: error.issues }, 400);
  }
  if (error instanceof NotFoundError) {
    return c.json({ error: 'not_found', message: error.message }, 404);
  }
  if (error instanceof UrlSecurityError) {
    return c.json({ error: 'url_security_error', code: error.code, message: error.message }, 400);
  }
  return c.json({ error: 'internal_error', message: 'Unexpected error' }, 500);
};
