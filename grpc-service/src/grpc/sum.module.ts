import { Module } from '@nestjs/common';
import { SumController } from './sum.controller';
import { RmqModule } from '../rmq/rmq.module';

@Module({
  imports: [RmqModule],
  controllers: [SumController],
})
export class SumModule {}
