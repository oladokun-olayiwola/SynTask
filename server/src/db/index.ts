import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import path from "node:path";

const isProduction = process.env.NODE_ENV === "production";
const dbPath = isProduction
  ? path.join("/app/data", "data.db")
  : "data.db";

const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });