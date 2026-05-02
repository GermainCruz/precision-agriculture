import { Injectable } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { FarmsService } from '../farms/farms.service';
import { PlotsService } from '../plots/plots.service';
import { PredictionsService } from '../predictions/predictions.service';
import { ReportsService } from '../reports/reports.service';
import { SensorsService } from '../sensors/sensors.service';
import { IrrigationService } from '../irrigation/irrigation.service';
import { AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authService: AuthService,
    private readonly farmsService: FarmsService,
    private readonly plotsService: PlotsService,
    private readonly predictionsService: PredictionsService,
    private readonly reportsService: ReportsService,
    private readonly sensorsService: SensorsService,
    private readonly irrigationService: IrrigationService,
    private readonly alertsService: AlertsService,
    private readonly prisma: PrismaService,
  ) {}

  appRouter = this.trpc.router({
    // ── Auth ──────────────────────────────────────────────────────────────
    auth: this.trpc.router({
      login: this.trpc.procedure
        .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
        .mutation(async ({ input }) => {
          return this.authService.login(input.email, input.password);
        }),

      register: this.trpc.procedure
        .input(z.object({
          email: z.string().email(),
          password: z.string().min(6),
          nombre: z.string(),
          apellido: z.string(),
        }))
        .mutation(async ({ input }) => {
          return this.authService.register(
            input as { email: string; password: string; nombre: string; apellido: string },
          );
        }),

      me: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .query(async ({ ctx }) => {
          return this.authService.getUser(ctx.user.sub);
        }),

      updateProfile: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          nombre: z.string().optional(),
          apellido: z.string().optional(),
          telefono: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.prisma.usuario.update({
            where: { id: ctx.user.sub },
            data: input,
            select: { id: true, email: true, nombre: true, apellido: true, telefono: true },
          });
        }),

      changePassword: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          currentPassword: z.string().min(6),
          newPassword: z.string().min(6),
        }))
        .mutation(async ({ input, ctx }) => {
          const usuario = await this.prisma.usuario.findUnique({ where: { id: ctx.user.sub } });
          if (!usuario) throw new Error('Usuario no encontrado');
          const valid = await bcrypt.compare(input.currentPassword, usuario.passwordHash);
          if (!valid) throw new Error('Contraseña actual incorrecta');
          const hash = await bcrypt.hash(input.newPassword, 10);
          await this.prisma.usuario.update({
            where: { id: ctx.user.sub },
            data: { passwordHash: hash },
          });
          return { success: true };
        }),
    }),

    // ── Farms ─────────────────────────────────────────────────────────────
    farms: this.trpc.router({
      getAll: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .query(async ({ ctx }) => {
          return this.farmsService.findAll(ctx.user.sub);
        }),

      getById: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.farmsService.findOne(input.id, ctx.user.sub);
        }),

      create: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          nombre: z.string(),
          ubicacion: z.string().optional(),
          areaHectareas: z.number().positive(),
          coordenadas: z.object({ lat: z.number(), lng: z.number() }).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.farmsService.create(
            input as {
              nombre: string;
              ubicacion?: string;
              areaHectareas: number;
              coordenadas?: { lat: number; lng: number };
            },
            ctx.user.sub,
          );
        }),

      update: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          id: z.string(),
          nombre: z.string().optional(),
          ubicacion: z.string().optional(),
          areaHectareas: z.number().positive().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.farmsService.update(input.id, input, ctx.user.sub);
        }),

      delete: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
          return this.farmsService.delete(input.id, ctx.user.sub);
        }),
    }),

    // ── Plots ─────────────────────────────────────────────────────────────
    plots: this.trpc.router({
      getAllByFarm: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ fincaId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.plotsService.findByFarm(input.fincaId, ctx.user.sub);
        }),

      getById: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.plotsService.findOne(input.id, ctx.user.sub);
        }),

      create: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          nombre: z.string(),
          fincaId: z.string(),
          areaHectareas: z.number().positive(),
          tipoSuelo: z.enum(['arcilloso', 'arenoso', 'limoso', 'franco', 'orgánico']),
          coordenadasPoligono: z.any().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.plotsService.create(
            input as {
              nombre: string;
              fincaId: string;
              areaHectareas: number;
              tipoSuelo: string;
              coordenadasPoligono?: unknown;
            },
            ctx.user.sub,
          );
        }),

      update: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          id: z.string(),
          nombre: z.string().optional(),
          areaHectareas: z.number().positive().optional(),
          tipoSuelo: z.enum(['arcilloso', 'arenoso', 'limoso', 'franco', 'orgánico']).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.plotsService.update(input.id, input, ctx.user.sub);
        }),

      delete: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
          return this.plotsService.delete(input.id, ctx.user.sub);
        }),
    }),

    // ── Cultivos ──────────────────────────────────────────────────────────
    cultivos: this.trpc.router({
      getAll: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .query(async () => {
          return this.prisma.cultivo.findMany({ orderBy: { nombre: 'asc' } });
        }),
    }),

    // ── Temporadas ────────────────────────────────────────────────────────
    temporadas: this.trpc.router({
      iniciar: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          loteId: z.string(),
          cultivoId: z.string(),
          fechaSiembra: z.string(),
          fechaCosechaEstimada: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const lote = await this.prisma.lote.findFirst({
            where: { id: input.loteId, finca: { usuarioId: ctx.user.sub } },
          });
          if (!lote) throw new Error('Lote no encontrado');
          return this.prisma.temporada.create({
            data: {
              loteId: input.loteId,
              cultivoId: input.cultivoId,
              fechaSiembra: new Date(input.fechaSiembra),
              fechaCosechaEstimada: input.fechaCosechaEstimada
                ? new Date(input.fechaCosechaEstimada)
                : null,
              estado: 'activo',
            },
            include: { cultivo: true },
          });
        }),

      finalizar: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          temporadaId: z.string(),
          fechaCosechaReal: z.string(),
          estado: z.enum(['cosechado', 'fallido']),
        }))
        .mutation(async ({ input, ctx }) => {
          const temporada = await this.prisma.temporada.findFirst({
            where: { id: input.temporadaId, lote: { finca: { usuarioId: ctx.user.sub } } },
          });
          if (!temporada) throw new Error('Temporada no encontrada');
          return this.prisma.temporada.update({
            where: { id: input.temporadaId },
            data: {
              estado: input.estado,
              fechaCosechaReal: new Date(input.fechaCosechaReal),
            },
          });
        }),
    }),

    // ── Predictions ───────────────────────────────────────────────────────
    predictions: this.trpc.router({
      getByLote: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ loteId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.predictionsService.findByPlot(input.loteId, ctx.user.sub);
        }),

      getCurrent: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ loteId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.predictionsService.getCurrentPrediction(input.loteId, ctx.user.sub);
        }),

      triggerPrediction: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ loteId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          return this.predictionsService.triggerPrediction(input.loteId, ctx.user.sub);
        }),
    }),

    // ── Sensors ───────────────────────────────────────────────────────────
    sensors: this.trpc.router({
      getByLote: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ loteId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.sensorsService.findByPlot(input.loteId, ctx.user.sub);
        }),

      getReadings: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          sensorId: z.string(),
          startDate: z.date(),
          endDate: z.date(),
        }))
        .query(async ({ input, ctx }) => {
          return this.sensorsService.getReadings(
            input.sensorId, input.startDate, input.endDate, ctx.user.sub,
          );
        }),

      getLatestReadings: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ loteId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.sensorsService.getLatestReadings(input.loteId, ctx.user.sub);
        }),
    }),

    // ── Irrigation ────────────────────────────────────────────────────────
    irrigation: this.trpc.router({
      getEvents: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          loteId: z.string(),
          startDate: z.date(),
          endDate: z.date(),
        }))
        .query(async ({ input, ctx }) => {
          return this.irrigationService.getEvents(
            input.loteId, input.startDate, input.endDate, ctx.user.sub,
          );
        }),

      getRecommendations: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ loteId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.irrigationService.getRecommendations(input.loteId, ctx.user.sub);
        }),

      scheduleIrrigation: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          loteId: z.string(),
          fechaHora: z.date(),
          duracionMinutos: z.number().positive(),
          tipoRiego: z.enum(['goteo', 'aspersion', 'inundacion', 'subterraneo']),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.irrigationService.schedule(
            input as {
              loteId: string;
              fechaHora: Date;
              duracionMinutos: number;
              tipoRiego: string;
            },
            ctx.user.sub,
          );
        }),

      getEfficiencyMetrics: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ fincaId: z.string().optional() }))
        .query(async ({ input, ctx }) => {
          return this.irrigationService.getEfficiencyMetrics(ctx.user.sub, input.fincaId);
        }),
    }),

    // ── Reports ───────────────────────────────────────────────────────────
    reports: this.trpc.router({
      getAll: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ tipo: z.enum(['operacional', 'gestion']).optional() }))
        .query(async ({ input, ctx }) => {
          return this.reportsService.findAll(ctx.user.sub, input.tipo);
        }),

      generateOperational: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          loteId: z.string(),
          startDate: z.date(),
          endDate: z.date(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.generateOperationalReport(
            input as { loteId: string; startDate: Date; endDate: Date },
            ctx.user.sub,
          );
        }),

      generateManagement: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          fincaId: z.string(),
          temporadaId: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.generateManagementReport(
            input as { fincaId: string; temporadaId?: string },
            ctx.user.sub,
          );
        }),

      download: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ reportId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.reportsService.getDownloadUrl(input.reportId, ctx.user.sub);
        }),

      exportJson: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ reportId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.exportReportJson(input.reportId, ctx.user.sub);
        }),

      delete: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ reportId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.deleteReport(input.reportId, ctx.user.sub);
        }),
    }),

    // ── Alerts ────────────────────────────────────────────────────────────
    alerts: this.trpc.router({
      getUnread: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .query(async ({ ctx }) => {
          return this.alertsService.getUnread(ctx.user.sub);
        }),

      getAll: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
        .query(async ({ input, ctx }) => {
          return this.alertsService.getAll(ctx.user.sub, input.limit, input.offset);
        }),

      markAsRead: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ alertId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          return this.alertsService.markAsRead(input.alertId, ctx.user.sub);
        }),

      markAllAsRead: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .mutation(async ({ ctx }) => {
          return this.alertsService.markAllAsRead(ctx.user.sub);
        }),
    }),

    // ── Dashboard ─────────────────────────────────────────────────────────
    dashboard: this.trpc.router({
      getMetrics: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .query(async ({ ctx }) => {
          const [farms, plots, predictions, unreadAlerts, irrigation] = await Promise.all([
            this.farmsService.findAll(ctx.user.sub),
            this.plotsService.findAllByUser(ctx.user.sub),
            this.predictionsService.getLatestPredictions(ctx.user.sub),
            this.alertsService.getUnreadCount(ctx.user.sub),
            this.irrigationService.getWeeklyEfficiency(ctx.user.sub),
          ]);

          const avgYield =
            predictions.length > 0
              ? predictions.reduce(
                  (acc, p) => acc + Number(p.rendimientoEstimadoKgHa || 0),
                  0,
                ) / predictions.length
              : 0;

          return {
            totalFarms: farms.length,
            totalPlots: plots.length,
            averageYield: avgYield,
            unreadAlerts,
            irrigationEfficiency: Number(irrigation) * 100,
            recentPredictions: predictions.slice(0, 5),
          };
        }),

      getCharts: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          fincaId: z.string().optional(),
          periodo: z.enum(['semana', 'mes', 'ano']).default('mes'),
        }))
        .query(async ({ input, ctx }) => {
          const [yieldHistory, irrigationData, climateData, efficiencyMetrics] =
            await Promise.all([
              this.predictionsService.getYieldHistory(ctx.user.sub, input.fincaId, input.periodo),
              this.irrigationService.getIrrigationData(ctx.user.sub, input.fincaId, input.periodo),
              this.sensorsService.getClimateData(ctx.user.sub, input.fincaId, input.periodo),
              this.irrigationService.getEfficiencyMetrics(ctx.user.sub, input.fincaId),
            ]);

          return { yieldHistory, irrigationData, climateData, efficiencyMetrics };
        }),
    }),
  });
}
