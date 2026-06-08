import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx  = host.switchToHttp();
    const res  = ctx.getResponse<Response>();
    const req  = ctx.getRequest<Request>();
    const status = exception instanceof HttpException
      ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody = exception instanceof HttpException
  ? exception.getResponse() : 'Internal server error';
  const message = typeof responseBody === 'string'
    ? responseBody
    : (responseBody as any)?.message || 'Terjadi kesalahan';
    if (status >= 500) this.logger.error(exception);
    res.status(status).json({ status: 'error', statusCode: status, message, path: req.url });
  }
}
