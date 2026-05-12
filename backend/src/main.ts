import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.getResponse() : exception.message;
    this.logger.error(`${request.method} ${request.url} - ${status} - ${exception.message || exception}`, exception.stack);
    response.status(status).json({
      statusCode: status,
      message: typeof message === 'object' ? (message as any).message || message : message,
      error: exception.message,
      stack: process.env.NODE_ENV !== 'production' ? exception.stack : undefined,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 静态文件服务 - 上传的图片
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // 启用CORS
  app.enableCors();

  // API前缀
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`美业SaaS后端服务已启动: http://localhost:${port}/api`);
}
bootstrap();
