import { Module } from '@nestjs/common';
import { FarmsService } from './farms.service';

@Module({
  providers: [FarmsService],
  exports: [FarmsService],
})
export class FarmsModule {}
