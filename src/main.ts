import { BadRequestException, ValidationPipe, type ValidationError } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function firstMessage(errors: ValidationError[]): string {
  for (const error of errors) {
    const message = error.constraints ? Object.values(error.constraints)[0] : undefined;
    if (message) return message;
    if (error.children?.length) {
      const nested = firstMessage(error.children);
      if (nested !== 'Revisa los datos enviados.') return nested;
    }
  }
  return 'Revisa los datos enviados.';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => new BadRequestException(firstMessage(errors)),
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
