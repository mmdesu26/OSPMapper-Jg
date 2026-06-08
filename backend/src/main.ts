import 'reflect-metadata';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: process.env.FRONTEND_URL || '*', credentials: true });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('OSP Mapper API')
    .setDescription('OSP Infrastructure Asset Mapping System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 OSP Mapper Backend running on http://0.0.0.0:${port}`);
  console.log(`📚 Swagger docs: http://0.0.0.0:${port}/api/docs\n`);
}
bootstrap();
