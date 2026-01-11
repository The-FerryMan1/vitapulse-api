/**
 * Centralized error handling utilities
 */

import { ERROR_MESSAGES } from './constants';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof AppError) {
    return { message: error.message, statusCode: error.statusCode };
  }

  if (error instanceof Error) {
    // Log error in production (you can integrate with a logging service)
    console.error('Error:', error.message, error.stack);
    return { message: ERROR_MESSAGES.INTERNAL_ERROR, statusCode: 500 };
  }

  return { message: ERROR_MESSAGES.UNEXPECTED_ERROR, statusCode: 500 };
}
