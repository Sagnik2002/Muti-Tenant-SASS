import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = request.user?.sub || 'anonymous';
    const orgId = request.headers['x-org-id'] || 'none';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - now;

          this.logger.log(
            JSON.stringify({
              method,
              url,
              statusCode,
              duration: `${duration}ms`,
              userId,
              orgId,
              ip,
              userAgent,
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            JSON.stringify({
              method,
              url,
              error: error.message,
              duration: `${duration}ms`,
              userId,
              orgId,
              ip,
            }),
          );
        },
      }),
    );
  }
}
