import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

export interface Context {
  user?: JwtPayload;
  token?: string;
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape;
  },
});

@Injectable()
export class TrpcService {
  router = t.router;
  procedure = t.procedure;
  mergeRouters = t.mergeRouters;

  createContext(token?: string): Context {
    if (!token) return {};

    try {
      const secret = process.env.JWT_SECRET || 'agriprecision-secret-key';
      const payload = jwt.verify(token, secret) as JwtPayload;
      return { user: payload, token };
    } catch {
      return {};
    }
  }

  authMiddleware() {
    return t.middleware(({ ctx, next }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Token de autenticación requerido',
        });
      }
      return next({ ctx: { user: ctx.user } });
    });
  }

  adminMiddleware() {
    return t.middleware(({ ctx, next }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      if (ctx.user.rol !== 'administrador') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Solo administradores pueden acceder',
        });
      }
      return next({ ctx: { user: ctx.user } });
    });
  }
}
