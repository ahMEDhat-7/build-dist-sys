import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, Channel, Connection } from 'amqplib';

@Injectable()
export class RmqService implements OnModuleInit, OnModuleDestroy {
  private conn: Connection | null = null;
  private channel: Channel | null = null;

  async onModuleInit() {
    try {
      this.conn = await connect('amqp://guest:guest@localhost:5672');
      this.channel = await this.conn.createChannel();
      console.log('Connected to RabbitMQ');
    } catch (err) {
      console.error('RabbitMQ connection failed', err);
      throw err;
    }
  }

  async publish(queue: string, message: string) {
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(message));
    console.log(`Published to ${queue}:`, message);
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.conn?.close();
      console.log('RabbitMQ connection closed');
    } catch (e) {
      // ignore
    }
  }
}
