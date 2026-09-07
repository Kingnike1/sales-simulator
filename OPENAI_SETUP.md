# Configuração local

O Sales Simulator usa a API oficial da OpenAI no servidor. Crie um arquivo `.env` na raiz do projeto, que já é ignorado pelo Git, com as seguintes variáveis:

```env
DATABASE_URL="mysql://usuario:senha@host:3306/banco"
OPENAI_API_KEY="sk-proj-cole-sua-chave-aqui"
OPENAI_MODEL="gpt-4o-mini"
JWT_SECRET="gere-uma-chave-aleatoria-forte"
```

`OPENAI_API_KEY` nunca deve ter prefixo `VITE_`, porque variáveis `VITE_*` podem ser disponibilizadas no navegador. A chave só é lida por `server/_core/env.ts` e enviada no header server-side para `api.openai.com`. O endpoint é fixo no código para impedir que a infraestrutura de um ambiente hospedeiro substitua a API oficial.

Depois de configurar o arquivo, execute:

```bash
pnpm install
pnpm db:push
pnpm check
pnpm test
pnpm dev
```

O modelo padrão é `gpt-4o-mini`. Para trocar, defina `OPENAI_MODEL` com um modelo disponível na sua conta.

O fluxo do MVP não depende de Forge, Manus, OAuth externo ou analytics. Criação de cenários, conversa e avaliação usam exclusivamente `OPENAI_API_KEY` no servidor.
