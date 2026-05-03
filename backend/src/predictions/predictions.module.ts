import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
  ],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
