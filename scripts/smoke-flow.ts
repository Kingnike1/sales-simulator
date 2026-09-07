import "dotenv/config";
import { appRouter } from "../server/routers";
import { getSessionBundle, listTrainingSessions, getPerformanceSummary } from "../server/db";

const context = {
  user: null,
  req: { protocol: "http", headers: {} } as never,
  res: { clearCookie: () => undefined } as never,
};
const caller = appRouter.createCaller(context);

const started = await caller.simulation.start({ mode: "specific", difficulty: "easy", focusNeed: "Quer aumentar geração de leads" });
if (!started.sessionId) throw new Error("session was not created");
console.log(`started:${started.sessionId}`);

const reply = await caller.simulation.send({
  sessionId: started.sessionId,
  message: "Quero entender melhor o que está impedindo os leads de avançarem hoje. Como vocês medem esse problema?",
});
if (!reply?.id) throw new Error("client reply was not persisted");
console.log(`message:${reply.id}`);

const evaluation = await caller.simulation.finish({ sessionId: started.sessionId });
if (!evaluation?.id) throw new Error("evaluation was not persisted");
console.log(`evaluation:${evaluation.id}:score=${evaluation.overallScore}`);

const bundle = await getSessionBundle(started.sessionId);
const history = await listTrainingSessions(5);
const metrics = await getPerformanceSummary();
if (!bundle?.evaluation || bundle.messages.length < 3 || !history.some((row) => row.session.id === started.sessionId) || !metrics.some((row) => row.metric.sessionId === started.sessionId)) {
  throw new Error("persistence verification failed");
}
console.log(`persisted:messages=${bundle.messages.length}:history=${history.length}:metrics=${metrics.length}`);
