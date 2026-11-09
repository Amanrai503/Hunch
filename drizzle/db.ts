import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/hunch";

declare global {
  var _postgresClient: postgres.Sql | undefined;
}

const client =
  global._postgresClient ||
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global._postgresClient = client;
}

export const db = drizzle(client, { schema });
