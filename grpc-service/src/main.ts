import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { SumModule } from './grpc/sum.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    SumModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'sum',
        protoPath: join(process.cwd(), 'src/proto/sum.proto'),
        url: '0.0.0.0:50051',
      },
    }
  );

  await app.listen();
}

bootstrap();
