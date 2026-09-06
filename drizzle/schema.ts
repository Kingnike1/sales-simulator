import {
  foreignKey,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  mode: varchar("mode", { length: 24 }).notNull(),
  focusNeed: varchar("focusNeed", { length: 191 }),
  difficulty: varchar("difficulty", { length: 24 }).notNull(),
  segment: varchar("segment", { length: 191 }).notNull(),
  clientType: varchar("clientType", { length: 191 }).notNull(),
  personality: varchar("personality", { length: 191 }).notNull(),
  apparentNeed: text("apparentNeed").notNull(),
  realNeed: text("realNeed").notNull(),
  goal: text("goal").notNull(),
  objectionsJson: text("objectionsJson").notNull(),
  budget: varchar("budget", { length: 191 }).notNull(),
  interestLevel: varchar("interestLevel", { length: 64 }).notNull(),
  context: text("context").notNull(),
  successCriteria: text("successCriteria").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trainingSessions = mysqlTable(
  "training_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    scenarioId: int("scenarioId").notNull(),
    mode: varchar("mode", { length: 24 }).notNull(),
    difficulty: varchar("difficulty", { length: 24 }).notNull(),
    status: varchar("status", { length: 24 }).default("active").notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    endedAt: timestamp("endedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    scenarioFk: foreignKey({
      columns: [table.scenarioId],
      foreignColumns: [scenarios.id],
      name: "training_sessions_scenario_id_fk",
    }),
  }),
);

export const messages = mysqlTable(
  "messages",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [trainingSessions.id],
      name: "messages_session_id_fk",
    }),
  }),
);

export const evaluations = mysqlTable(
  "evaluations",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull(),
    overallScore: int("overallScore").notNull(),
    scoresJson: text("scoresJson").notNull(),
    positivesJson: text("positivesJson").notNull(),
    improvementsJson: text("improvementsJson").notNull(),
    mistakesJson: text("mistakesJson").notNull(),
    criticalMomentsJson: text("criticalMomentsJson").notNull(),
    betterResponsesJson: text("betterResponsesJson").notNull(),
    nextRecommendation: text("nextRecommendation").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [trainingSessions.id],
      name: "evaluations_session_id_fk",
    }),
  }),
);

export const performanceMetrics = mysqlTable(
  "performance_metrics",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull(),
    overallScore: int("overallScore").notNull(),
    discoveryScore: int("discoveryScore").notNull(),
    objectionScore: int("objectionScore").notNull(),
    closingScore: int("closingScore").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [trainingSessions.id],
      name: "performance_metrics_session_id_fk",
    }),
  }),
);

export type Scenario = typeof scenarios.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;
export type InsertTrainingSession = typeof trainingSessions.$inferInsert;
export type InsertMessage = typeof messages.$inferInsert;
export type InsertEvaluation = typeof evaluations.$inferInsert;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
