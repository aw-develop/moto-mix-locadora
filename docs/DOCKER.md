# Docker e Cloudflare — Mix Locadora de Motos

## O que estes arquivos fazem

O projeto usa Angular na interface e um Worker com D1 e R2 no backend. O Docker padroniza a instalação e o build, gerando o Worker, os arquivos públicos e as migrações SQL. O serviço do Compose termina após exportar os artefatos; ele não abre uma porta nem serve o site.

A publicação atual continua sendo feita pelo Sites. **Cloudflare Workers não executa este docker-compose.yml como uma hospedagem.** O produto Cloudflare Containers tem outro fluxo, com configuração de Worker, imagem e Durable Objects; este projeto não foi migrado para ele.

## Gerar os arquivos

Pré-requisitos: Docker Engine/Desktop com Docker Compose v2 funcionando.

Na raiz do repositório:

```bash
docker compose run --rm --build build
```

Os arquivos são exportados para `docker-output/`:

- `dist/server/`: Worker compilado e configuração gerada.
- `dist/client/`: Angular e os demais assets públicos.
- `drizzle/`: migrações e metadados do banco.
- `LEIA-ME.md`: estas instruções.

O comando faz o build da imagem com o lockfile do npm e executa os checks já incluídos em `npm run build`. O Dockerfile usa Node.js 24 e mantém as dependências de desenvolvimento necessárias para Angular, Vite e o compilador TypeScript. `.git` não entra no contexto: um índice Git temporário é criado apenas para a verificação de segurança e removido depois do build.

No Linux, para os arquivos gerados pertencerem ao seu usuário:

```bash
mkdir -p docker-output
DOCKER_UID=$(id -u) DOCKER_GID=$(id -g) docker compose run --rm --build build
```

Novas exportações substituem somente `docker-output/dist`, `docker-output/drizzle` e `docker-output/LEIA-ME.md`. Não use esse diretório para dados ou backups.

## Publicação na Cloudflare

Gerar o build **não publica** e **não executa migrações** no banco remoto. Para a hospedagem atual, preserve o fluxo Sites de versionamento, empacotamento e publicação.

Se a operação for transferida para uma conta própria da Cloudflare, será necessário configurar nessa conta o Worker, os assets e os bindings `DB` (D1) e `BUCKET` (R2), aplicar as migrações e registrar os segredos administrativos no ambiente do Worker. A configuração gerada aponta para o D1 `bd_moto-mixlocadora` informado pelo responsável. O binding `BUCKET` aponta para o R2 `moto-mixlocadora` na mesma conta Cloudflare. Os três segredos de autenticação devem ser definidos antes da publicação; veja [autenticação de produção](https://github.com/aw-develop/moto-mix-locadora/blob/main/docs/AUTH-PRODUCAO.md). Consulte [D1 de produção](https://github.com/aw-develop/moto-mix-locadora/blob/main/docs/D1-PRODUCAO.md) e [R2 de produção](https://github.com/aw-develop/moto-mix-locadora/blob/main/docs/R2-PRODUCAO.md). Os arquivos gerados não transferem o banco, as imagens existentes ou as credenciais do Sites para outra conta.

Não publique apenas `dist/client`, porque isso não leva a API, a autenticação nem o salvamento. Não rode o servidor de desenvolvimento como hospedagem de produção. Não copie `.env`, `.dev.vars`, hashes administrativos, tokens de conta ou bancos locais para a imagem. O build não precisa desses segredos.

## Segurança e persistência

- `.dockerignore` exclui credenciais, bancos locais, histórico Git, caches e builds antigos.
- A etapa de build roda como usuário `node`.
- O serviço de exportação não tem rede, portas, capabilities Linux ou acesso ao socket Docker.
- Nenhuma variável de produção é enviada ao container pelo Compose.
- D1 e R2 continuam sendo os serviços de persistência. O diretório `docker-output/` contém arquivos de build, não uma cópia dos dados de produção.

## Referências

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare Containers: implantação](https://developers.cloudflare.com/containers/get-started/)
- [Bindings em desenvolvimento local](https://developers.cloudflare.com/workers/local-development/local-data/)
