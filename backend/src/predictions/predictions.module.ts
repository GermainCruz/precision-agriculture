import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [HttpModule],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
