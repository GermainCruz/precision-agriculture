import { Injectable } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { FarmsService } from '../farms/farms.service';
import { PlotsService } from '../plots/plots.service';
import { PredictionsService } from '../predictions/predictions.service';
import { ReportsService } from '../reports/reports.service';
import { SensorsService, type SensorMetadatos } from '../sensors/sensors.service';
import { IrrigationService } from '../irrigation/irrigation.service';
import { AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
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
    private readonly adminService: AdminService,
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

      /** Resumen por lote tipo manual §7 (confianza, factores, cosecha/calidad orientativos). */
      getOverviewPlots: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .query(async ({ ctx }) => {
          return this.predictionsService.getOverviewPlots(ctx.user.sub);
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
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
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

      seriesAggregatedDaily: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          sensorId: z.string(),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
        }))
        .query(async ({ input, ctx }) => {
          return this.sensorsService.seriesAggregatedDaily(
            input.sensorId, input.startDate, input.endDate, ctx.user.sub,
          );
        }),

      readingsCsv: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          sensorId: z.string(),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.sensorsService.readingsToCsv(
            input.sensorId, input.startDate, input.endDate, ctx.user.sub,
          );
        }),

      create: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.sensorManageMiddleware())
        .input(z.object({
          loteId: z.string(),
          codigo: z.string().optional(),
          tipo: z.enum(['clima', 'suelo', 'humedad', 'temperatura']),
          ubicacion: z.object({ lat: z.number(), lng: z.number() }).optional(),
          metadatos: z.object({
            intervaloLecturaMinutos: z.number().optional(),
            calibracion: z.object({
              temperaturaDelta: z.number().optional(),
              humedadPctDelta: z.number().optional(),
            }).optional(),
            umbrales: z.object({
              humedadSueloCriticaPct: z.number().optional(),
              humedadSueloMaxPct: z.number().optional(),
            }).optional(),
          }).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.sensorsService.createForPlot(ctx.user.sub, {
            loteId: input.loteId,
            codigo: input.codigo,
            tipo: input.tipo,
            ubicacion: input.ubicacion as { lat: number; lng: number } | undefined,
            metadatos: input.metadatos as SensorMetadatos | undefined,
          });
        }),

      update: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.sensorManageMiddleware())
        .input(z.object({
          sensorId: z.string(),
          ubicacion: z.object({ lat: z.number(), lng: z.number() }).optional(),
          activo: z.boolean().optional(),
          ultimoMantenimiento: z.coerce.date().nullable().optional(),
          metadatos: z.object({
            intervaloLecturaMinutos: z.number().optional(),
            calibracion: z.object({
              temperaturaDelta: z.number().optional(),
              humedadPctDelta: z.number().optional(),
            }).optional(),
            umbrales: z.object({
              humedadSueloCriticaPct: z.number().optional(),
              humedadSueloMaxPct: z.number().optional(),
            }).optional(),
          }).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const { sensorId, ubicacion, metadatos, activo, ultimoMantenimiento } = input;
          const patch: {
            ubicacion?: { lat: number; lng: number };
            activo?: boolean;
            metadatos?: SensorMetadatos;
            ultimoMantenimiento?: Date | null;
          } = {};
          if (activo !== undefined) patch.activo = activo;
          if (ultimoMantenimiento !== undefined) patch.ultimoMantenimiento = ultimoMantenimiento;
          if (metadatos !== undefined) patch.metadatos = metadatos as SensorMetadatos;
          if (
            ubicacion !== undefined &&
            ubicacion.lat != null &&
            ubicacion.lng != null
          ) {
            patch.ubicacion = { lat: ubicacion.lat, lng: ubicacion.lng };
          }
          return this.sensorsService.updateSensor(sensorId, ctx.user.sub, patch);
        }),

      delete: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.sensorManageMiddleware())
        .input(z.object({ sensorId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          return this.sensorsService.deleteSensor(input.sensorId, ctx.user.sub);
        }),

      optimalRanges: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({ sensorId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.sensorsService.optimalRangesForSensor(input.sensorId, ctx.user.sub);
        }),
    }),

    // ── Irrigation ────────────────────────────────────────────────────────
    irrigation: this.trpc.router({
      getEvents: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          loteId: z.string(),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
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
          fechaHora: z.coerce.date(),
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
        .use(this.trpc.reportsAccessMiddleware())
        .input(z.object({
          tipo: z.enum(['operacional', 'gestion']).optional(),
          generadoDesde: z.coerce.date().optional(),
          generadoHasta: z.coerce.date().optional(),
        }))
        .query(async ({ input, ctx }) => {
          return this.reportsService.findAll(ctx.user.sub, input);
        }),

      exportIndexCsv: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.reportsAccessMiddleware())
        .input(z.object({
          tipo: z.enum(['operacional', 'gestion']).optional(),
          generadoDesde: z.coerce.date().optional(),
          generadoHasta: z.coerce.date().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.exportReportsIndexCsv(ctx.user.sub, input);
        }),

      exportIndexJson: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.reportsAccessMiddleware())
        .input(z.object({
          tipo: z.enum(['operacional', 'gestion']).optional(),
          generadoDesde: z.coerce.date().optional(),
          generadoHasta: z.coerce.date().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.exportReportsIndexJson(ctx.user.sub, input);
        }),

      prepareShareEmail: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.reportsAccessMiddleware())
        .input(z.object({
          reportId: z.string(),
          destinatarioEmail: z.string().email().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.prepareShareEmail(
            input.reportId, ctx.user.sub, input.destinatarioEmail,
          );
        }),

      generateOperational: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.reportsAccessMiddleware())
        .input(z.object({
          loteId: z.string(),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.generateOperationalReport(
            input as { loteId: string; startDate: Date; endDate: Date },
            ctx.user.sub,
          );
        }),

      generateManagement: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.reportsAccessMiddleware())
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
        .use(this.trpc.reportsAccessMiddleware())
        .input(z.object({ reportId: z.string() }))
        .query(async ({ input, ctx }) => {
          return this.reportsService.getDownloadUrl(input.reportId, ctx.user.sub);
        }),

      exportPdf: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.reportsAccessMiddleware())
        .input(z.object({ reportId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          return this.reportsService.exportReportPdf(input.reportId, ctx.user.sub);
        }),

      delete: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.reportsAccessMiddleware())
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
        .input(z.object({
          limit: z.number().optional(),
          offset: z.number().optional(),
          tipo: z.string().optional(),
          severidad: z.string().optional(),
          leida: z.boolean().optional(),
          loteId: z.string().optional(),
          desde: z.coerce.date().optional(),
          hasta: z.coerce.date().optional(),
        }))
        .query(async ({ input, ctx }) => {
          return this.alertsService.getAll(ctx.user.sub, input);
        }),

      updatePreferencias: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .input(z.object({
          emailCriticas: z.boolean().optional(),
          emailDiarias: z.boolean().optional(),
          pushTodas: z.boolean().optional(),
          smsSolo: z.boolean().optional(),
          umbrales: z.object({
            humedadSueloCriticaPct: z.number().optional(),
            humedadSueloMaxPct: z.number().optional(),
          }).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return this.alertsService.updatePreferenciasAlertas(ctx.user.sub, input);
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
        .use(this.trpc.dashboardAccessMiddleware())
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
        .use(this.trpc.dashboardAccessMiddleware())
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

    // ── Admin (solo rol administrador) ───────────────────────────────────
    admin: this.trpc.router({
      listUsers: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.adminMiddleware())
        .query(async ({ ctx }) => this.adminService.listUsers(ctx.user.sub)),

      createUser: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.adminMiddleware())
        .input(z.object({
          email: z.string().email(),
          password: z.string().min(6),
          nombre: z.string(),
          apellido: z.string(),
          rolNombre: z.enum(['administrador', 'tecnico', 'agricultor']),
        }))
        .mutation(async ({ input, ctx }) =>
          this.adminService.createUser(ctx.user.sub, {
            email: input.email,
            password: input.password,
            nombre: input.nombre,
            apellido: input.apellido,
            rolNombre: input.rolNombre,
          })),

      updateUser: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.adminMiddleware())
        .input(z.object({
          userId: z.string(),
          nombre: z.string().optional(),
          apellido: z.string().optional(),
          rolNombre: z.enum(['administrador', 'tecnico', 'agricultor']).optional(),
          activo: z.boolean().optional(),
        }))
        .mutation(async ({ input, ctx }) =>
          this.adminService.updateUser(ctx.user.sub, input.userId, {
            nombre: input.nombre,
            apellido: input.apellido,
            rolNombre: input.rolNombre,
            activo: input.activo,
          })),

      listAudit: this.trpc.procedure
        .use(this.trpc.authMiddleware())
        .use(this.trpc.adminMiddleware())
        .input(z.object({ limit: z.number().optional() }))
        .query(async ({ input, ctx }) =>
          this.adminService.listAudit(ctx.user.sub, input.limit)),
    }),
  });
}
