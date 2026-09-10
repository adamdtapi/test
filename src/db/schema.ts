import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  bigint,
  integer,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
//  API Gateway — database schema
//  Users / sessions / links / traffic buckets / settings
// ─────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const links = pgTable(
  "links",
  {
    id: serial("id").primaryKey(),
    uuid: uuid("uuid").notNull().unique().defaultRandom(),
    name: text("name").notNull(),
    // 0 = unlimited
    quotaBytes: bigint("quota_bytes", { mode: "number" }).notNull().default(0),
    usedBytes: bigint("used_bytes", { mode: "number" }).notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (t) => [index("links_created_idx").on(t.createdAt)],
);

export const traffic = pgTable(
  "traffic",
  {
    id: serial("id").primaryKey(),
    linkId: integer("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    bucketStart: timestamp("bucket_start", { withTimezone: true }).notNull(),
    bytesIn: bigint("bytes_in", { mode: "number" }).notNull().default(0),
    bytesOut: bigint("bytes_out", { mode: "number" }).notNull().default(0),
  },
  (t) => [
    uniqueIndex("traffic_link_bucket_idx").on(t.linkId, t.bucketStart),
    index("traffic_bucket_idx").on(t.bucketStart),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type LinkRow = typeof links.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
