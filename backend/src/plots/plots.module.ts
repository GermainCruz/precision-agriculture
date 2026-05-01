import { Module } from '@nestjs/common';
import { PlotsService } from './plots.service';

@Module({
  providers: [PlotsService],
  exports: [PlotsService],
})
export class PlotsModule {}
