import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  evaluations,
  InsertEvaluation,
  InsertMessage,
  InsertPerformanceMetric,
  InsertScenario,
  InsertTrainingSession,
  messages,
  performanceMetrics,
  scenarios,
  trainingSessions,
  users,
  InsertUser,
} from "../drizzle/schema";
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function insertedId(result: unknown) {
  const candidate = result as { insertId?: number | bigint };
  return Number(candidate?.insertId ?? 0);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name', 'email', 'loginMethod'] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createScenario(data: InsertScenario) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(scenarios).values(data);
  const id = insertedId(result);
  const created = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
  return created[0];
}

export async function createTrainingSession(data: InsertTrainingSession) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(trainingSessions).values(data);
  const id = insertedId(result);
  const created = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, id))
    .limit(1);
  return created[0];
}

export async function getScenario(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
  return rows[0];
}

export async function getTrainingSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, id))
    .limit(1);
  return rows[0];
}

export async function addMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(messages).values(data);
  const id = insertedId(result);
  const rows = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return rows[0];
}

export async function getMessages(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt), asc(messages.id));
}

export async function completeTrainingSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db
    .update(trainingSessions)
    .set({ status: "completed", endedAt: new Date() })
    .where(eq(trainingSessions.id, id));
}

export async function createEvaluation(data: InsertEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(evaluations).values(data);
  const id = insertedId(result);
  const rows = await db.select().from(evaluations).where(eq(evaluations.id, id)).limit(1);
  return rows[0];
}

export async function getEvaluation(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.sessionId, sessionId))
    .orderBy(desc(evaluations.createdAt))
    .limit(1);
  return rows[0];
}

export async function createPerformanceMetric(data: InsertPerformanceMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db.insert(performanceMetrics).values(data);
}

export async function listTrainingSessions(limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  return db
    .select({
      session: trainingSessions,
      scenario: scenarios,
      evaluation: evaluations,
    })
    .from(trainingSessions)
    .innerJoin(scenarios, eq(trainingSessions.scenarioId, scenarios.id))
    .leftJoin(evaluations, eq(trainingSessions.id, evaluations.sessionId))
    .orderBy(desc(trainingSessions.startedAt))
    .limit(limit);
}

export async function getPerformanceSummary() {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const rows = await db
    .select({
      metric: performanceMetrics,
      session: trainingSessions,
    })
    .from(performanceMetrics)
    .innerJoin(trainingSessions, eq(performanceMetrics.sessionId, trainingSessions.id))
    .orderBy(asc(performanceMetrics.createdAt));
  return rows;
}

export async function getSessionBundle(id: number) {
  const [session, messagesList, evaluation] = await Promise.all([
    getTrainingSession(id),
    getMessages(id),
    getEvaluation(id),
  ]);
  if (!session) return null;
  const scenario = await getScenario(session.scenarioId);
  return { session, scenario, messages: messagesList, evaluation };
}
