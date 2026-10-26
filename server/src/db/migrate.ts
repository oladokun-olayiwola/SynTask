import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index";

export async function runMigrations() {
  try {
    console.log("Running database migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Database migrations completed successfully.");
  } catch (err: any) {
    if (err?.message?.includes("already exists")) {
      console.warn("Migration warning (table/column already exists), continuing startup:", err.message);
    } else {
      console.error("Migration failed:", err);
      throw err;
    }
  }
}