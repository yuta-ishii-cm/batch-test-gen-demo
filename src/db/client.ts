import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://taskuser:taskpass@localhost:5432/taskdb";

const sql = postgres(DATABASE_URL);

export const db = drizzle(sql, { schema });
