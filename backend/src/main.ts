import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcRouter } from './trpc/trpc.router';
import { TrpcService } from './trpc/trpc.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const trpcRouter = app.get(TrpcRouter);
  const trpcService = app.get(TrpcService);

  // DECISIÓN: Se expone tRPC como middleware Express en /trpc
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: trpcRouter.appRouter,
      createContext: ({ req }) => {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
          ? authHeader.slice(7)
          : undefined;
        return trpcService.createContext(token);
      },
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend AgriPrecision corriendo en: http://localhost:${port}`);
  console.log(`tRPC endpoint: http://localhost:${port}/trpc`);
}

bootstrap();
