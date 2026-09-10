import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "./auth";

let seeded = false;

// Creates the default admin user on first run.
// Password source: ADMIN_PASSWORD env, otherwise a random one printed to logs.
export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  try {
    const existing = await db.select({ id: users.id }).from(users).limit(1);
    if (existing.length > 0) {
      seeded = true;
      return;
    }
    const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString("base64url");
    await db.insert(users).values({ username: "admin", passwordHash: hashPassword(password) });
    if (process.env.ADMIN_PASSWORD) {
      console.log("[seed] admin user created from ADMIN_PASSWORD");
    } else {
      console.log("[seed] ─────────────────────────────────────────────");
      console.log("[seed]  admin user created (first run)");
      console.log("[seed]  username: admin");
      console.log(`[seed]  password: ${password}`);
      console.log("[seed]  change it from dashboard → settings");
      console.log("[seed] ─────────────────────────────────────────────");
    }
    seeded = true;
  } catch (err) {
    console.error("[seed] failed:", err);
  }
}
