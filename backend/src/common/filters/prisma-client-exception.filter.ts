import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Translates known Prisma errors into sensible HTTP responses so services can
 * rely on database constraints (e.g. unique indexes) instead of duplicating
 * those checks in application code.
 *
 *   P2002 -> 409 Conflict   (unique constraint violation)
 *   P2025 -> 404 Not Found  (record required but not found)
 *
 * Anything else is logged and surfaced as a generic 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const httpException = this.toHttpException(exception);
    const status = httpException.getStatus();

    if (status >= 500) {
      this.logger.error(
        `Unhandled Prisma error ${exception.code}: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json(httpException.getResponse());
  }

  private toHttpException(
    exception: Prisma.PrismaClientKnownRequestError,
  ): HttpException {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target;
        const fields = Array.isArray(target) ? target.join(', ') : 'value';
        return new ConflictException(
          `A record with this ${fields} already exists`,
        );
      }
      case 'P2025':
        return new NotFoundException('The requested record was not found');
      default:
        return new HttpException('An unexpected database error occurred', 500);
    }
  }
}
