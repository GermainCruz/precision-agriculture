import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IrrigationService } from './irrigation.service';

@Module({
  imports: [HttpModule],
  providers: [IrrigationService],
  exports: [IrrigationService],
})
export class IrrigationModule {}
