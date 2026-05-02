import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcRouter } from './trpc/trpc.router';
import { TrpcService } from './trpc/trpc.service';

/** En desarrollo acepta cualquier puerto de localhost (p. ej. 3001 si 3000 está ocupado). */
function corsOriginDelegate(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean | string) => void,
): void {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    const allowed = process.env.FRONTEND_URL;
    if (allowed && origin === allowed) {
      callback(null, origin);
      return;
    }
    callback(new Error('Not allowed by CORS'));
    return;
  }
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    callback(null, origin);
    return;
  }
  callback(new Error('Not allowed by CORS'));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: corsOriginDelegate,
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
