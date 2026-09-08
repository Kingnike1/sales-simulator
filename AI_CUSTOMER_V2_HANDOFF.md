# HANDOFF COMPLETO — Sales Simulator / AI Customer V2

> **Uso deste arquivo:** anexe este documento ou cole seu conteúdo no início de uma nova conversa para continuar a análise e implementar a V2 do motor de simulação sem perder contexto.

## 1. Instrução principal para o novo agente

Você é responsável por continuar a evolução do projeto **Sales Simulator**, implementando a V2 do motor de cliente virtual descrita neste documento.

Trabalhe diretamente no projeto existente em:

```text
/home/ubuntu/sales-simulator
```

Antes de alterar o código:

1. Leia este arquivo inteiro.
2. Leia `AI_CUSTOMER_V2_ANALYSIS.md`, se existir.
3. Inspecione o estado atual do Git e os arquivos relevantes.
4. Confirme quais partes da arquitetura já existem e quais ainda precisam ser implementadas.
5. Crie um plano de execução e um `todo.md` de acompanhamento.
6. Preserve OpenAI oficial, TiDB/MySQL e Drizzle.
7. Faça a implementação em etapas pequenas, validando cada etapa.

Não reintroduza Manus, Forge, OAuth Manus, analytics Manus ou qualquer infraestrutura externa removida anteriormente.

## 2. Objetivo do produto

O Sales Simulator treina vendedores em conversas comerciais. Existe:

- um vendedor humano, que envia mensagens;
- um cliente controlado por IA;
- um cenário de vendas com informações públicas e privadas;
- uma conversa persistida;
- uma avaliação automática no encerramento.

O cliente deve parecer uma pessoa real em uma negociação comercial. Ele não deve parecer um assistente que ajuda o vendedor a conduzir a conversa.

O objetivo da V2 não é simplesmente tornar o cliente mais difícil. O objetivo é fazer com que o cliente tenha:

- objetivos próprios;
- personalidade comportamental;
- memória;
- confiança variável;
- objeções com evolução;
- interesse e urgência;
- limites de informação;
- capacidade de discordar;
- capacidade de pedir prova, preço, proposta ou tempo;
- possibilidade de mudar de assunto;
- possibilidade de encerrar a conversa;
- reação proporcional à qualidade do vendedor.

## 3. Estado atual conhecido

O projeto já possui:

- React/Vite + TypeScript;
- Express + tRPC;
- Drizzle ORM;
- MySQL/TiDB Cloud;
- OpenAI API oficial no backend;
- `OPENAI_API_KEY` somente no servidor;
- modelo padrão `gpt-4o-mini`;
- persistência de cenários, sessões, mensagens, avaliações e métricas;
- testes Vitest;
- `pnpm check`;
- `pnpm test`;
- `pnpm build`;
- `pnpm db:push` com verificação segura das tabelas existentes.

A integração principal deve continuar usando a API oficial da OpenAI. Não alterar para Forge, Manus, Anthropic ou Gemini nesta etapa.

## 4. Estado arquitetural atual

O fluxo atual é:

```text
simulation.start
  → OpenAIProvider.createScenario
  → cenário salvo em scenarios
  → mensagem inicial salva em messages

simulation.send
  → carrega últimas mensagens
  → salva mensagem do vendedor
  → OpenAIProvider.respond
  → salva resposta do cliente

simulation.finish
  → carrega cenário e transcrição
  → OpenAIProvider.evaluate
  → conclui sessão
  → salva evaluation
  → salva performance_metric
```

Arquivos centrais atuais:

```text
server/ai/provider.ts
server/routers.ts
server/db.ts
drizzle/schema.ts
server/_core/llm.ts
server/simulation.test.ts
server/independence.test.ts
```

O provider atual possui três operações principais:

- `createScenario`;
- `respond`;
- `evaluate`.

A resposta atual envia para o modelo o cenário completo serializado e as últimas mensagens. O cenário inclui `realNeed`, `goal`, `objections`, `budget`, `interestLevel`, `context` e `successCriteria`.

## 5. Problemas comprovados no comportamento atual

As conversas analisadas mostraram estes padrões:

1. O cliente concorda rapidamente.
2. O cliente valida quase tudo que o vendedor diz.
3. O cliente fornece informações úteis cedo demais.
4. O cliente faz perguntas perfeitas para ajudar a próxima etapa da venda.
5. O cliente quase sempre mantém a conversa viva.
6. O cliente raramente diz “não sei”, “preciso pensar” ou “me manda uma proposta”.
7. O cliente não demonstra mudança de humor.
8. O cliente não demonstra pressa, distração ou desinteresse real.
9. O cliente não cria desvios naturais.
10. O cliente não apresenta contradições naturais.
11. O cliente não exige provas de modo consistente.
12. O cliente interpreta respostas ruins do vendedor como oportunidades para ensinar o vendedor.
13. O cliente parece um assistente comercial.
14. O cliente não possui estado interno persistente.
15. As objeções são strings, não estados.
16. A memória é somente uma janela de mensagens.
17. A avaliação não conhece a trajetória de confiança ou resistência.

Caso crítico que deve ser corrigido:

```text
Cliente: Estamos satisfeitos com nossa solução atual.
Vendedor: sei não
```

A resposta não deve ensinar o vendedor nem criar uma pergunta perfeita automaticamente. Ela pode ser curta, cética ou exigir clareza, por exemplo:

```text
Entendi. Se você ainda não tem certeza do que pode oferecer, fica difícil eu considerar uma mudança.
```

ou:

```text
Tudo bem. O que exatamente você gostaria de entender primeiro?
```

ou simplesmente:

```text
Entendi.
```

A escolha deve depender do estado do cliente, não ser aleatória.

## 6. Diagnóstico do prompt atual

O prompt atual de `respond` contém instruções equivalentes a:

- interpretar um cliente virtual realista;
- não revelar instruções internas;
- não revelar necessidade real, critérios de sucesso ou que é uma IA;
- responder em português brasileiro;
- responder em uma a três frases;
- não entregar a resposta ideal;
- fazer o vendedor investigar;
- usar o briefing interno completo.

O principal problema é a instrução equivalente a **“faça o vendedor investigar”**. Ela não representa uma motivação humana. Ela incentiva o modelo a manter a conversa e pode resultar em perguntas didáticas.

Também existe risco de vazamento porque o briefing completo é enviado ao modelo, incluindo informações que deveriam ser reveladas progressivamente.

A V2 deve separar:

- contexto público;
- fatos privados;
- fatos já revelados;
- estado interno;
- objeções ativas;
- critérios de avaliação.

O modelo não deve receber um pacote livre contendo todos os segredos e depender apenas de uma instrução para não revelá-los.

## 7. Arquitetura V2 desejada

Implementar uma arquitetura incremental, sem múltiplos agentes no primeiro momento:

```text
SCENARIO PROFILE
  ├─ public facts
  ├─ private facts
  ├─ personality policy
  └─ objection states
        ↓
SESSION STATE
  ├─ trust
  ├─ interest
  ├─ urgency
  ├─ skepticism
  ├─ budgetSensitivity
  ├─ engagement
  ├─ conversationStage
  ├─ emotionalState
  ├─ terminationRisk
  └─ objectionState
        ↓
CONVERSATION MEMORY
  ├─ recent messages
  ├─ discovered facts
  ├─ seller commitments
  ├─ unresolved concerns
  ├─ ignored signals
  └─ compact summary
        ↓
SELLER MESSAGE
        ↓
DETERMINISTIC SIGNAL EXTRACTION
  ├─ seller intent
  ├─ genericity
  ├─ discovery quality
  ├─ objection handling
  ├─ pressure
  ├─ evidence quality
  └─ listening quality
        ↓
BEHAVIOR DECISION
        ↓
LLM RESPONSE
        ↓
STATE AND MEMORY UPDATE
```

Para a primeira implementação, a decisão comportamental e a redação da resposta podem ocorrer em uma única chamada estruturada à OpenAI. Não implementar uma segunda chamada de planejamento por turno sem medir necessidade.

## 8. Modelo de estado interno recomendado

Começar com estado compacto. A solução inicial pode usar uma coluna JSON em `training_sessions`, desde que isso seja compatível com o TiDB atual e não exija uma migration destrutiva.

Modelo conceitual:

```ts
{
  trust: 0.42,
  interest: 0.55,
  urgency: 0.38,
  skepticism: 0.61,
  budgetSensitivity: 0.74,
  engagement: 0.48,
  conversationStage: "discovery",
  emotionalState: "cautious",
  objectionState: {
    budget: {
      severity: 0.72,
      resistance: 0.58,
      surfaced: false,
      attempts: 0
    },
    proof: {
      severity: 0.55,
      resistance: 0.42,
      surfaced: false,
      attempts: 0
    }
  },
  terminationRisk: 0.18,
  turns: 3,
  lastSellerSignal: "generic_claim",
  revealedFactKeys: ["segment"],
  nextLikelyMove: "request_evidence"
}
```

Todos os valores contínuos devem ficar entre `0` e `1`.

Sinais recomendados:

| Sinal do vendedor | Efeito esperado |
|---|---|
| pergunta específica sobre problema | confiança e engajamento sobem |
| resume corretamente o que ouviu | confiança sobe e revelação aumenta |
| resposta genérica | ceticismo sobe e engajamento cai |
| ignora objeção explícita | resistência sobe |
| promessa sem evidência | ceticismo sobe |
| pressão repetida | irritação e risco de encerramento sobem |
| proposta adequada ao problema | interesse sobe |
| solução desconectada | confiança e interesse caem |
| “sei não” ou equivalente | clareza e confiança caem; cliente pode encurtar ou pedir esclarecimento |

As regras determinísticas devem existir fora do prompt para que sejam testáveis sem consumir tokens.

## 9. Personalidades comportamentais

Não usar personalidade apenas como palavra.

### Pragmático

- quer respostas diretas;
- pede preço, prazo e impacto;
- rejeita explicações longas;
- demonstra impaciência com abstrações;
- valoriza resultado concreto.

### Cauteloso

- não confia rapidamente;
- libera informações aos poucos;
- pede segurança e referências;
- evita compromisso;
- reage mal à pressão;
- considera risco de implementação.

### Analítico

- pede dados e premissas;
- compara alternativas;
- questiona números sem fonte;
- exige coerência;
- demora mais para decidir.

### Relacional

- valoriza escuta e confiança;
- rejeita abordagem mecânica;
- compartilha mais quando percebe interesse genuíno;
- responde mal a pressão fria.

### Ocupado

- responde curto;
- controla o tempo;
- pede resumo;
- muda de assunto para prioridades;
- pode encerrar rapidamente.

### Cético

- testa consistência;
- contesta promessas;
- menciona tentativas anteriores;
- exige evidência antes de falar de orçamento;
- aumenta resistência diante de discurso genérico.

A personalidade deve influenciar quatro decisões:

1. quanto revelar;
2. quanto questionar;
3. qual evidência exigir;
4. quanto penalizar uma falha do vendedor.

## 10. Objeções como estados

Transformar cada objeção em um objeto com:

```ts
{
  key: "budget",
  label: "prioridade de orçamento",
  severity: 0.72,
  resistance: 0.58,
  surfaced: false,
  attempts: 0,
  triggerWords: ["custo", "investimento", "valor"],
  reducingSignals: ["escopo claro", "prazo realista", "evidência"],
  worseningSignals: ["promessa sem prova", "pressão", "desvio"],
  reversible: true
}
```

Estados possíveis:

```text
latent → surfaced → challenged → partially_resolved
                         ↘ worsened → blocking
```

Não repetir sempre a mesma frase. Variações válidas incluem:

- “Tenho outras prioridades para esse orçamento.”
- “Não sei se faz sentido mexer nisso agora.”
- “Já temos uma ferramenta que custa menos.”
- “Preciso justificar esse investimento internamente.”
- “Se o ganho não for demonstrável, fica difícil aprovar.”

Uma boa resposta do vendedor reduz resistência parcialmente, não zera a objeção.

## 11. Memória V2

Usar três camadas:

1. **Transcrição recente:** seis a oito mensagens.
2. **Memória factual:** fatos confirmados, alegações do vendedor, compromissos e perguntas pendentes.
3. **Resumo compacto:** situação comercial atual em uma ou duas frases.

Exemplo de resumo:

```text
Cliente reconhece queda de vendas, mas ainda não considera uma nova landing page prioridade. Pediu evidência e demonstra sensibilidade a prazo e orçamento.
```

Registrar especialmente:

- problema declarado pelo cliente;
- impacto do problema;
- prioridade;
- ferramentas atuais;
- tentativas anteriores;
- objeções mencionadas;
- fatos ainda desconhecidos;
- momentos em que o vendedor ignorou uma informação;
- compromissos assumidos pelo vendedor;
- perguntas pendentes.

## 12. Política de decisão de comportamento

Antes de produzir texto, o sistema deve escolher uma ação estruturada:

```ts
{
  action: "challenge_claim",
  emotionalTone: "skeptical",
  reveal: ["budget_is_limited"],
  hide: ["real_need_is_revenue_predictability"],
  askQuestion: false,
  length: "short",
  continueConversation: true,
  terminationRiskDelta: 0.04,
  reason: "seller made an unsupported benefit claim"
}
```

Ações possíveis:

- `answer_briefly`;
- `ask_clarification`;
- `challenge_claim`;
- `request_proof`;
- `surface_objection`;
- `reveal_partial_fact`;
- `defer_decision`;
- `request_proposal`;
- `change_topic`;
- `end_conversation`.

O campo `askQuestion` deve poder ser `false`. O cliente não deve fazer pergunta em toda resposta.

## 13. Dificuldade

### Easy

Cliente aberto, tolerante e mais disposto a revelar pistas.

### Medium

Cliente apresenta resistência moderada e uma objeção relevante.

### Hard

Cliente esconde a necessidade real, exige coerência, pede prova e alterna interesse com resistência.

### Expert

Cliente possui maior sofisticação comercial, detecta promessas vazias, muda de foco, negocia, considera stakeholders e pode encerrar.

Expert não significa respostas maiores, mais agressivas ou mais negativas. Significa comportamento comercial mais sofisticado.

## 14. Avaliação V2

A avaliação deve receber:

- transcrição;
- estado inicial e final;
- evolução de confiança;
- fatos revelados;
- fatos que permaneceram ocultos;
- objeções ativadas;
- objeções tratadas;
- objeções ignoradas;
- respostas genéricas;
- pressão excessiva;
- motivo de encerramento.

Critérios:

- descoberta da necessidade;
- escuta ativa;
- adaptação ao perfil;
- adaptação ao estado do cliente;
- tratamento de objeções;
- proposta de valor;
- argumentação;
- evidência;
- condução;
- fechamento;
- recuperação de conversa ruim.

O vendedor não deve ser penalizado por não descobrir uma informação que o cliente nunca tornou acessível, desde que tenha feito tentativas adequadas.

## 15. Métricas V2

Adicionar progressivamente:

- confiança inicial e final;
- variação de confiança por turno;
- necessidade descoberta;
- fatos descobertos;
- objeções acionadas;
- objeções tratadas;
- objeções ignoradas;
- perguntas específicas;
- perguntas genéricas;
- promessas sem evidência;
- pressão excessiva;
- adequação ao perfil;
- progressão da conversa;
- risco de encerramento;
- probabilidade de avanço;
- intenção de compra final;
- revelações prematuras do cliente.

## 16. Estratégia de custo e latência

Não enviar prompt gigantesco a cada turno.

Usar:

- cenário resumido;
- estado compacto;
- regras relevantes da personalidade;
- objeções ativas;
- memória factual curta;
- resumo da conversa;
- seis a oito mensagens recentes;
- uma chamada estruturada por turno;
- uma chamada de avaliação no encerramento.

Não implementar ainda:

- múltiplos agentes;
- banco vetorial;
- embeddings;
- segunda chamada de planejamento por turno;
- análise emocional sofisticada;
- recuperação semântica entre sessões.

## 17. Testes obrigatórios

Criar testes determinísticos para o atualizador de estado e o planejador:

| Teste | Esperado |
|---|---|
| vendedor excelente | confiança aumenta |
| vendedor genérico | ceticismo aumenta |
| vendedor ignora objeção | resistência aumenta |
| vendedor insiste demais | irritação ou risco de encerramento aumenta |
| descoberta excelente | revelação progressiva |
| promessa sem evidência para analítico | pedido de prova ou contestação |
| solução inadequada | rejeição ou retorno ao problema |
| vendedor diz “sei não” | cliente não ensina o vendedor |
| preço perguntado cedo | cliente pode pedir contexto antes de revelar orçamento |
| problema de conversão ignorado | cliente retoma o problema ou demonstra frustração |

Criar testes de contrato para impedir que o modelo revele fatos ainda não liberados.

## 18. Arquivos prováveis de alteração

```text
server/ai/provider.ts
server/ai/prompts.ts                 # novo
server/ai/customer-state.ts          # novo
server/ai/customer-policy.ts         # novo
server/ai/evaluation.ts              # novo
server/routers.ts
aerver/db.ts
drizzle/schema.ts
server/simulation.test.ts
server/ai/customer-state.test.ts     # novo
server/ai/customer-policy.test.ts    # novo
```

Corrigir o typo acima antes de editar:

```text
server/db.ts
```

A interface OpenAI existente deve ser preservada. O frontend só precisa ser alterado se houver necessidade de exibir novos estados, motivos ou resultados.

## 19. Plano de implementação recomendado

### Fase 1 — Estado determinístico

Criar tipos de estado, valores iniciais e atualizador de sinais. Não chamar OpenAI nos testes.

Critério: testes A–H determinísticos passando.

### Fase 2 — Persistência

Adicionar estado compacto à sessão ou tabela própria. Preferir a opção de menor impacto no TiDB atual.

Critério: o estado sobrevive entre mensagens e não altera dados existentes destrutivamente.

### Fase 3 — Política de resposta

Criar política de revelação e ações de comportamento. Implementar resposta estruturada.

Critério: o cliente pode responder sem pergunta e não revela fatos bloqueados.

### Fase 4 — Prompt V2

Separar contexto público, estado, memória e regras comportamentais. Remover a instrução “faça o vendedor investigar” como regra central.

Critério: o caso “sei não” deixa de produzir uma resposta didática.

### Fase 5 — Personalidade e dificuldade

Conectar perfis comportamentais e dificuldades às ações.

Critério: easy, medium, hard e expert apresentam diferenças de comportamento observáveis.

### Fase 6 — Avaliação e métricas

Adicionar trajetória do cliente à avaliação e salvar métricas adicionais.

Critério: avaliação não penaliza o vendedor por informação que não foi revelada.

### Fase 7 — Teste real controlado

Executar cenários reais com a API OpenAI oficial, medir tokens, latência e qualidade. Não registrar nem versionar chaves.

## 20. Critérios de aceite da V2

A V2 só deve ser considerada pronta quando:

1. O cliente não fizer pergunta em todas as respostas.
2. O cliente puder responder de forma curta, hesitante ou inconclusiva.
3. O cliente puder discordar e pedir prova.
4. O cliente não revelar a necessidade real no primeiro turno sem motivo.
5. O cliente lembrar fatos importantes já ditos.
6. O cliente reagir quando o vendedor ignorar o problema principal.
7. O caso “sei não” não fizer o cliente ensinar o vendedor.
8. A confiança e a resistência mudarem com o comportamento do vendedor.
9. O cliente puder pedir tempo, proposta ou encerrar.
10. A avaliação considerar adaptação e não apenas quantidade de perguntas.
11. `pnpm check` passar.
12. `pnpm test` passar.
13. `pnpm build` passar.
14. `pnpm db:push` passar sem operações destrutivas.
15. Nenhuma chave ou segredo ser hardcoded.
16. Nenhuma dependência Manus/Forge/OAuth externo/analytics ser reintroduzida.

## 21. Regras de segurança e manutenção

- Não colocar `OPENAI_API_KEY` em código frontend.
- Não criar segredos no Git.
- Não alterar ou substituir o banco sem necessidade.
- Não executar `DROP TABLE`, truncamento ou migration destrutiva sem confirmação explícita.
- Não usar `drizzle-kit push --force`.
- Não reintroduzir `BUILT_IN_FORGE_API_URL` ou `BUILT_IN_FORGE_API_KEY`.
- Não usar `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID` ou `VITE_ANALYTICS_*`.
- Não transformar o cliente em um adversário que responde negativamente sem justificativa.
- Toda reação deve ter uma razão derivada do estado, da personalidade, da objeção ou da mensagem do vendedor.
- Preservar compatibilidade com o TiDB existente.
- Validar alterações com TypeScript, testes, build e fluxo de banco.

## 22. Comandos de validação

```bash
cd /home/ubuntu/sales-simulator
pnpm check
pnpm test
pnpm build
pnpm db:push
```

Para executar o smoke test de ponta a ponta após configurar uma chave OpenAI oficial válida:

```bash
pnpm exec tsx scripts/smoke-flow.ts
```

## 23. Documentos relacionados

- `AI_CUSTOMER_V2_ANALYSIS.md` — relatório técnico detalhado da análise anterior.
- `OPENAI_SETUP.md` — configuração da OpenAI oficial.
- `ARCHITECTURE_AUDIT.md` — auditoria da remoção das dependências Manus.

## 24. Estado da aprovação

Este handoff contém a proposta completa para a V2. A implementação deve começar quando o usuário confirmar que deseja prosseguir com a Fase 1.

Se o usuário disser para implementar, comece pela Fase 1, atualize o plano, implemente testes determinísticos primeiro e só depois altere o fluxo de produção.

## 25. Observação sobre créditos

Não consultar, estimar ou prometer saldo de créditos da conta. Se o usuário perguntar sobre saldo, cobrança, limites ou upgrade, direcionar para:

https://help.manus.im

A implementação técnica deve ser planejada por fases e validada incrementalmente, independentemente do saldo disponível.
