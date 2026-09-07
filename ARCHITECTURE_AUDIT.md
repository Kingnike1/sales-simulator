# Auditoria arquitetural — Sales Simulator

## Resultado

O runtime principal agora é independente da infraestrutura Manus. O fluxo de simulação usa o backend Express/tRPC, `AIProvider` com a API oficial da OpenAI e Drizzle ORM com TiDB/MySQL. Não há inicialização OAuth externa, proxy Forge, analytics ou placeholders Vite no caminho normal da aplicação.

## Dependências removidas

Foram removidos do runtime os módulos de OAuth Manus, SDK de identidade externo, proxy de storage Manus, heartbeat, notificações, Data API, geração de imagem, mapas e transcrição legados que não eram importados pelo MVP. Também foram removidos o plugin Vite runtime da Manus, o debug collector, os arquivos públicos `__manus__` e as dependências npm usadas exclusivamente por OAuth/runtime (`axios`, `cookie`, `jose`, `vite-plugin-manus-runtime` e `@builder.io/vite-plugin-jsx-loc`).

## Autenticação

O MVP continua deliberadamente sem autenticação obrigatória, conforme o escopo original de uso individual. O contexto tRPC cria um usuário nulo e as rotas de simulação são públicas. Nenhum servidor OAuth externo é inicializado. A camada de autorização permanece disponível no módulo tRPC para uma futura autenticação local, mas não é usada pelas rotas do MVP.

## Analytics

O script de analytics foi removido do HTML. O frontend não inicializa analytics, não faz requisições opcionais e não gera URLs com `%VITE_*%`.

## Banco e `db:push`

As seis tabelas necessárias já estavam presentes no TiDB. O histórico de migrations havia sido aplicado manualmente e não correspondia ao journal local; por isso o `drizzle-kit migrate` tentava recriar tabelas e falhava. O comando `pnpm db:push` agora gera a migration e executa uma verificação segura e idempotente das seis tabelas, sem truncar dados ou executar operações destrutivas. A migration gerada não contém alterações.

## Validação

`pnpm check` passou. `pnpm test` passou com 3 arquivos e 4 testes. `pnpm build` passou. `pnpm db:push` passou e confirmou as seis tabelas. `pnpm dev` iniciou na porta 3100 sem os logs `OAUTH_SERVER_URL is not configured`, sem `%VITE_ANALYTICS_*%` e sem `Malformed URI sequence`. O HTML servido também foi verificado sem placeholders ou analytics.

## Fluxo completo

O smoke test está disponível em `scripts/smoke-flow.ts` e executa criação de cenário, mensagem, avaliação e confirmação de histórico/métricas persistidos. A execução real neste ambiente não completou porque a chave OpenAI disponível retornou `401 invalid_api_key` contra `api.openai.com`. Uma chave oficial válida em `OPENAI_API_KEY` é a única pendência para validar o trecho externo da simulação.
