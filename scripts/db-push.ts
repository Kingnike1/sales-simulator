import "dotenv/config";
import mysql from "mysql2/promise";

const requiredTables = [
  "users",
  "scenarios",
  "training_sessions",
  "messages",
  "evaluations",
  "performance_metrics",
] as const;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const url = new URL(databaseUrl);

const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.slice(1)),
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  const [rows] = await connection.query("SHOW TABLES");
  const existing = new Set(
    (rows as Record<string, string>[]).map((row) => Object.values(row)[0]),
  );

  const missing = requiredTables.filter((table) => !existing.has(table));

  if (missing.length > 0) {
    throw new Error(
      `Database schema is incomplete. Missing tables: ${missing.join(", ")}. Apply the reviewed Drizzle migration before running the app.`,
    );
  }

  console.log(
    `Database schema verified: ${requiredTables.length} required tables are present.`,
  );
} finally {
  await connection.end();
}
