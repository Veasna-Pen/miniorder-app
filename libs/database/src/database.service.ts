import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as schema from './schema';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    this.pool = new Pool({
      connectionString,
    });

    this.db = drizzle(this.pool, { schema });

    console.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  get schema() {
    return schema;
  }
}
