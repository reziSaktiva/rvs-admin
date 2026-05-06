import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './drizzle/schema';
import * as relations from './drizzle/relations';

const connectionString = process.env.NEXT_DATABASE_URL!;
const schemaConfig = { ...schema, ...relations };

type DbClient = ReturnType<typeof postgres>;
type DbInstance = ReturnType<typeof drizzle<typeof schemaConfig>>;

const globalForDb = globalThis as typeof globalThis & {
  __revikaPgClient?: DbClient;
  __revikaDb?: DbInstance;
};

const client =
  globalForDb.__revikaPgClient ??
  postgres(connectionString, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

export const db = globalForDb.__revikaDb ?? drizzle(client, { schema: schemaConfig });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__revikaPgClient = client;
  globalForDb.__revikaDb = db;
}