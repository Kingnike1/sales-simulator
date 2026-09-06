import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  addMessage,
  completeTrainingSession,
  createEvaluation,
  createPerformanceMetric,
  createScenario,
  createTrainingSession,
  getEvaluation,
  getScenario,
  getSessionBundle,
  getTrainingSession,
  listTrainingSessions,
  getMessages,
  getPerformanceSummary,
} from "./db";
import { getAIProvider, ScenarioBlueprint } from "./ai/provider";

const modeSchema = z.enum(["random", "specific"]);
const difficultySchema = z.enum(["easy", "medium", "hard", "expert"]);
const focusNeeds = [
  "Precisa de uma landing page",
  "Quer aumentar geração de leads",
  "Precisa de um SaaS",
  "Precisa automatizar um processo",
  "Precisa de um sistema personalizado",
  "Está insatisfeito com o fornecedor atual",
  "Acha a solução cara",
  "Está comparando concorrentes",
  "Não possui orçamento definido",
  "Está apenas pesquisando",
] as const;

function scenarioToBlueprint(scenario: NonNullable<Awaited<ReturnType<typeof getScenario>>>): ScenarioBlueprint {
  return {
    segment: scenario.segment,
    clientType: scenario.clientType,
    personality: scenario.personality,
    apparentNeed: scenario.apparentNeed,
    realNeed: scenario.realNeed,
    goal: scenario.goal,
    objections: JSON.parse(scenario.objectionsJson) as string[],
    budget: scenario.budget,
    interestLevel: scenario.interestLevel,
    context: scenario.context,
    successCriteria: scenario.successCriteria,
    openingMessage: "",
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  simulation: router({
    focusNeeds: publicProcedure.query(() => focusNeeds),
    start: publicProcedure
      .input(z.object({ mode: modeSchema, difficulty: difficultySchema, focusNeed: z.string().max(191).optional() }))
      .mutation(async ({ input }) => {
        if (input.mode === "specific" && !input.focusNeed) {
          throw new Error("Selecione uma necessidade para continuar");
        }
        const scenario = await getAIProvider().createScenario(input);
        const storedScenario = await createScenario({
          mode: input.mode,
          focusNeed: input.focusNeed ?? null,
          difficulty: input.difficulty,
          segment: scenario.segment,
          clientType: scenario.clientType,
          personality: scenario.personality,
          apparentNeed: scenario.apparentNeed,
          realNeed: scenario.realNeed,
          goal: scenario.goal,
          objectionsJson: JSON.stringify(scenario.objections),
          budget: scenario.budget,
          interestLevel: scenario.interestLevel,
          context: scenario.context,
          successCriteria: scenario.successCriteria,
        });
        if (!storedScenario) throw new Error("Não foi possível salvar o cenário");
        const session = await createTrainingSession({ scenarioId: storedScenario.id, mode: input.mode, difficulty: input.difficulty, status: "active" });
        if (!session) throw new Error("Não foi possível iniciar o treinamento");
        const openingMessage = await addMessage({ sessionId: session.id, role: "client", content: scenario.openingMessage });
        return { sessionId: session.id, scenarioId: storedScenario.id, openingMessage };
      }),
    get: publicProcedure.input(z.object({ sessionId: z.number().int().positive() })).query(async ({ input }) => getSessionBundle(input.sessionId)),
    send: publicProcedure
      .input(z.object({ sessionId: z.number().int().positive(), message: z.string().trim().min(1).max(4000) }))
      .mutation(async ({ input }) => {
        const session = await getTrainingSession(input.sessionId);
        if (!session || session.status !== "active") throw new Error("Este treinamento não está ativo");
        const scenario = await getScenario(session.scenarioId);
        if (!scenario) throw new Error("Cenário não encontrado");
        const previous = await getMessages(input.sessionId);
        await addMessage({ sessionId: input.sessionId, role: "user", content: input.message });
        const reply = await getAIProvider().respond({ scenario: scenarioToBlueprint(scenario), transcript: previous.map((message) => ({ role: message.role, content: message.content })), userMessage: input.message });
        const clientMessage = await addMessage({ sessionId: input.sessionId, role: "client", content: reply });
        return clientMessage;
      }),
    finish: publicProcedure
      .input(z.object({ sessionId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const session = await getTrainingSession(input.sessionId);
        if (!session) throw new Error("Treinamento não encontrado");
        const scenario = await getScenario(session.scenarioId);
        if (!scenario) throw new Error("Cenário não encontrado");
        const transcript = await getMessages(input.sessionId);
        const evaluation = await getAIProvider().evaluate({ scenario: scenarioToBlueprint(scenario), transcript: transcript.map((message) => ({ role: message.role === "user" ? "user" : "client", content: message.content })) });
        await completeTrainingSession(input.sessionId);
        const storedEvaluation = await createEvaluation({
          sessionId: input.sessionId,
          overallScore: evaluation.overallScore,
          scoresJson: JSON.stringify(evaluation.scores),
          positivesJson: JSON.stringify(evaluation.positives),
          improvementsJson: JSON.stringify(evaluation.improvements),
          mistakesJson: JSON.stringify(evaluation.mistakes),
          criticalMomentsJson: JSON.stringify(evaluation.criticalMoments),
          betterResponsesJson: JSON.stringify(evaluation.betterResponses),
          nextRecommendation: evaluation.nextRecommendation,
        });
        await createPerformanceMetric({
          sessionId: input.sessionId,
          overallScore: evaluation.overallScore,
          discoveryScore: evaluation.scores.descoberta,
          objectionScore: evaluation.scores.objecoes,
          closingScore: evaluation.scores.fechamento,
        });
        return storedEvaluation;
      }),
    evaluation: publicProcedure.input(z.object({ sessionId: z.number().int().positive() })).query(({ input }) => getEvaluation(input.sessionId)),
  }),
  history: router({
    list: publicProcedure.query(() => listTrainingSessions()),
    summary: publicProcedure.query(() => getPerformanceSummary()),
  }),
});

export type AppRouter = typeof appRouter;
