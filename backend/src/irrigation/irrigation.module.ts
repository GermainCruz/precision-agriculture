import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IrrigationService } from './irrigation.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
  ],
  providers: [IrrigationService],
  exports: [IrrigationService],
})
export class IrrigationModule {}
