# Banco D1 de produção — Mix Locadora

| Configuração | Valor |
| --- | --- |
| Banco | `bd_moto-mixlocadora` |
| ID | `cac76df3-554e-4b84-9b34-d07496268924` |
| Binding no backend | `DB` |
| Migrações SQL | `drizzle/` |

O ID identifica o recurso; não é uma senha e não concede acesso à conta. O código configura o banco em `vite.config.ts` e inclui `migrations_dir`. O build gera `dist/server/wrangler.json`, usado pelos comandos de banco. Esses comandos operam no D1 remoto; não são comandos de banco local.

## Preparação no computador

Na raiz do repositório, com Node.js 24:

```bash
npm ci
npm run build
npx wrangler login
npm run db:check:production
```

Confirme que a conta autenticada é a proprietária desse banco. Uma conexão de plugin dentro do ChatGPT não autentica automaticamente o Wrangler do computador. Não envie tokens pelo chat nem os salve no repositório.

## Conferência antes da primeira migração

Confira as tabelas retornadas por `db:check:production` e liste o histórico/pedências:

```bash
npm run db:migrations:list:production
```

Em banco novo, sem tabelas da aplicação, aplique as migrações existentes:

```bash
npm run db:migrate:production
npm run db:check:production
npm run db:migrations:list:production
```

O Wrangler registra os nomes dos arquivos aplicados em `d1_migrations`. Confirme o banco e as alterações exibidas no terminal antes de aceitar. O repositório tem sete migrações (`0000` até `0006`) para as nove tabelas da aplicação e as colunas adicionais de banners e grupos dos cards, além das condições do aluguel em `site_settings.rental_conditions`.

Se já existirem `motorcycles`, `banners`, `site_state`, `admin_credentials` ou outras tabelas da aplicação, compare o esquema e o histórico antes de executar `apply`. As migrações incluem `CREATE TABLE` e `ALTER TABLE` e não devem ser reaplicadas manualmente. Não exclua tabelas, não altere migrações antigas e não preencha o histórico artificialmente para ignorar conflitos. Faça backup antes de ajustar um banco já utilizado.

As migrações criam o esquema. Elas não importam os dados do Sites, imagens do R2, senhas ou sessões existentes. O backend atual possui seu próprio fluxo de inicialização do catálogo; ele não é executado por esses comandos de migração.

## Após exportar com Docker

O Compose atual só gera artefatos. Execute o Wrangler no terminal do computador após autenticar na Cloudflare:

```bash
npx wrangler d1 execute bd_moto-mixlocadora --remote --config docker-output/dist/server/wrangler.json --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
npx wrangler d1 migrations list bd_moto-mixlocadora --remote --config docker-output/dist/server/wrangler.json
```

Para um banco novo, após a conferência:

```bash
npx wrangler d1 migrations apply bd_moto-mixlocadora --remote --config docker-output/dist/server/wrangler.json
```

O exportador transforma o diretório das migrações em `../../drizzle`, relativo ao arquivo exportado. Assim, não é necessário editar `/app/drizzle` manualmente no computador. Uma exportação feita antes dessa atualização precisa ser gerada novamente.

## Escopo desta etapa

Esta preparação trata apenas do D1. Não configura o bucket R2 de produção, não troca a autenticação, não transfere dados entre contas e não publica um Worker na conta própria. A aplicação atualmente publicada no Sites continua com seus recursos existentes.

Referências: [migrações D1](https://developers.cloudflare.com/d1/reference/migrations/) e [configuração programática do plugin Vite](https://developers.cloudflare.com/workers/vite-plugin/reference/programmatic-configuration/).

## Atualização das condições do aluguel

A migração `0006_glamorous_king_cobra.sql` adiciona apenas a coluna JSON `site_settings.rental_conditions`, inicialmente `{}`. Não exclui dados nem preenche regras comerciais. Se `0000`–`0005` já estiverem aplicadas, o Wrangler deve listar somente `0006` como pendente. Aplique-a antes de publicar o backend atualizado:

```bash
npm run build
npm run db:migrations:list:production
npm run db:migrate:production
```

Depois, confira `PRAGMA table_info(site_settings);` no console D1 e preencha os textos no painel em **Configurações → Condições do aluguel**. O código usa orientações de consulta para campos vazios. Esta alteração de código não aplica a migração remota automaticamente.
