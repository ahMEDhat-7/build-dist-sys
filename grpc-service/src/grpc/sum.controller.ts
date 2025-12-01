import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RmqService } from '../rmq/rmq.service';

type AddRequest = { a: number; b: number };
type AddResponse = { result: number };

@Controller()
export class SumController {
  constructor(private readonly rmq: RmqService) {}

  @GrpcMethod('SumService', 'Add')
  async add(data: AddRequest): Promise<AddResponse> {
    const { a, b } = data;
    const result = a + b;

    await this.rmq.publish('sum_queue', result.toString());

    return { result };
  }
}
