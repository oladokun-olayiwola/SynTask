import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index";

async function run() {
  console.log("Applying SQLite migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully.");
  } catch (err: any) {
    if (err?.message?.includes("already exists") || err?.cause?.message?.includes("already exists")) {
      console.warn("Notice: Table already exists in SQLite DB, skipping initial table creation step.");
    } else {
      console.error("Migration failed:", err);
      process.exit(1);
    }
  }
}

run();