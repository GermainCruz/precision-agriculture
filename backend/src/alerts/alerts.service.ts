import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type PreferenciasAlertasUsuario = {
  emailCriticas?: boolean;
  emailDiarias?: boolean;
  pushTodas?: boolean;
  smsSolo?: boolean;
  /** Umbrales globales opcionales (complementarios a metadatos por sensor). */
  umbrales?: {
    humedadSueloCriticaPct?: number;
    humedadSueloMaxPct?: number;
  };
};

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async getUnread(userId: string) {
    return this.prisma.alerta.findMany({
      where: {
        usuarioId: userId,
        leida: false,
      },
      include: {
        lote: {
          include: {
            finca: true,
          },
        },
      },
      orderBy: { creadaEn: 'desc' },
    });
  }

  async getAll(
    userId: string,
    opts?: {
      limit?: number;
      offset?: number;
      tipo?: string;
      severidad?: string;
      leida?: boolean;
      loteId?: string;
      desde?: Date;
      hasta?: Date;
    },
  ) {
    const where = {
      usuarioId: userId,
      ...(opts?.tipo ? { tipo: opts.tipo } : {}),
      ...(opts?.severidad ? { severidad: opts.severidad } : {}),
      ...(opts?.leida !== undefined ? { leida: opts.leida } : {}),
      ...(opts?.loteId ? { loteId: opts.loteId } : {}),
      ...((opts?.desde || opts?.hasta) && {
        creadaEn: {
          ...(opts.desde ? { gte: opts.desde } : {}),
          ...(opts.hasta ? { lte: opts.hasta } : {}),
        },
      }),
    };

    const [alerts, total] = await Promise.all([
      this.prisma.alerta.findMany({
        where,
        include: {
          lote: {
            include: {
              finca: true,
            },
          },
        },
        orderBy: { creadaEn: 'desc' },
        take: opts?.limit,
        skip: opts?.offset,
      }),
      this.prisma.alerta.count({ where }),
    ]);

    return { alerts, total };
  }

  async updatePreferenciasAlertas(userId: string, patch: PreferenciasAlertasUsuario) {
    const u = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!u) return null;
    const prev =
      u.preferenciasAlertas &&
      typeof u.preferenciasAlertas === 'object' &&
      !Array.isArray(u.preferenciasAlertas)
        ? (u.preferenciasAlertas as Record<string, unknown>)
        : {};
    const next = {
      ...prev,
      ...(patch.emailCriticas !== undefined && { emailCriticas: patch.emailCriticas }),
      ...(patch.emailDiarias !== undefined && { emailDiarias: patch.emailDiarias }),
      ...(patch.pushTodas !== undefined && { pushTodas: patch.pushTodas }),
      ...(patch.smsSolo !== undefined && { smsSolo: patch.smsSolo }),
      ...(patch.umbrales !== undefined && {
        umbrales: {
          ...((prev.umbrales as object) ?? {}),
          ...patch.umbrales,
        },
      }),
    };
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { preferenciasAlertas: next as Prisma.InputJsonValue },
      select: { id: true, preferenciasAlertas: true },
    });
    return next;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.alerta.count({
      where: {
        usuarioId: userId,
        leida: false,
      },
    });
  }

  async markAsRead(alertId: string, userId: string) {
    return this.prisma.alerta.update({
      where: {
        id: alertId,
        usuarioId: userId,
      },
      data: {
        leida: true,
        leidaEn: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.alerta.updateMany({
      where: {
        usuarioId: userId,
        leida: false,
      },
      data: {
        leida: true,
        leidaEn: new Date(),
      },
    });
  }

  async createAlert(data: {
    usuarioId: string;
    loteId?: string;
    tipo: string;
    severidad: string;
    mensaje: string;
    datosContexto?: any;
  }) {
    return this.prisma.alerta.create({
      data: {
        usuarioId: data.usuarioId,
        loteId: data.loteId,
        tipo: data.tipo,
        severidad: data.severidad,
        mensaje: data.mensaje,
        datosContexto: data.datosContexto,
      },
    });
  }
}
