import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Required to read the httpOnly refresh-token cookie.
  app.use(cookieParser());

  // Allow the SPA to send credentials (the refresh cookie) cross-origin.
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  // Strip unknown properties, reject extra ones, and coerce types from DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Map known Prisma errors (unique violations, missing records) to HTTP codes.
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TalentMatch API')
    .setDescription('Candidate-facing endpoints for the job board')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
