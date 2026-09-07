# Configuração local

O Sales Simulator usa a API oficial da OpenAI no servidor. Crie um arquivo `.env` na raiz do projeto, que já é ignorado pelo Git, com as seguintes variáveis:

```env
DATABASE_URL="mysql://usuario:senha@host:3306/banco"
OPENAI_API_KEY="sk-proj-cole-sua-chave-aqui"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_BASE_URL="https://api.openai.com/v1"
JWT_SECRET="gere-uma-chave-aleatoria-forte"
```

`OPENAI_API_KEY` nunca deve ter prefixo `VITE_`, porque variáveis `VITE_*` podem ser disponibilizadas no navegador. A chave só é lida por `server/_core/env.ts` e enviada no header server-side para `api.openai.com`.

Depois de configurar o arquivo, execute:

```bash
pnpm install
pnpm db:push
pnpm check
pnpm test
pnpm dev
```

O modelo padrão é `gpt-4o-mini`. Para trocar, defina `OPENAI_MODEL` com um modelo disponível na sua conta. `OPENAI_BASE_URL` permite usar um endpoint compatível com OpenAI, mas pode permanecer como `https://api.openai.com/v1` para a API oficial.

O armazenamento e a transcrição legados do template ainda reconhecem `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY`, mas o fluxo principal de criação de cenários, conversa e avaliação usa exclusivamente `OPENAI_API_KEY`.
