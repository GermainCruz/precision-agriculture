import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
