import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      // Use for testing - cleans the database
      const models = Reflect.ownKeys(this).filter(
        (key) => key[0] !== '_' && key[0] !== '$' && key !== 'cleanDatabase',
      );

      return Promise.all(
        models.map((modelKey) => {
          if (typeof this[modelKey].deleteMany === 'function') {
            return this[modelKey].deleteMany();
          }
          return Promise.resolve();
        }),
      );
    }
  }
}