import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg"; // ✅ Use pg instead of @neondatabase/serverless
import { drizzle } from "drizzle-orm/node-postgres"; // ✅ Use node-postgres version
import * as schema from "@shared/schema"; // Your schema stays the same

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Optional: useful for Neon or other managed DBs with SSL
  },
});

export const db = drizzle(pool, { schema });
