import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FarmsModule } from './farms/farms.module';
import { PlotsModule } from './plots/plots.module';
import { PredictionsModule } from './predictions/predictions.module';
import { ReportsModule } from './reports/reports.module';
import { SensorsModule } from './sensors/sensors.module';
import { IrrigationModule } from './irrigation/irrigation.module';
import { AlertsModule } from './alerts/alerts.module';
import { TrpcModule } from './trpc/trpc.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    FarmsModule,
    PlotsModule,
    PredictionsModule,
    ReportsModule,
    SensorsModule,
    IrrigationModule,
    AlertsModule,
    AdminModule,
    TrpcModule,
  ],
})
export class AppModule {}
