# R2 de produção — Mix Locadora

| Configuração | Valor |
| --- | --- |
| Conta Cloudflare | `825f844ee27d60a88ad9a5ed44568ed8` |
| Bucket | `moto-mixlocadora` |
| Binding no Worker | `BUCKET` |
| Endpoint S3 da conta | `https://825f844ee27d60a88ad9a5ed44568ed8.r2.cloudflarestorage.com` |
| Entrega das imagens | `/api/media/<hash>.<extensão>` no domínio da aplicação |

O bucket foi confirmado na conta Cloudflare, na região `ENAM`, com classe `Standard`. A configuração do binding fica em `vite.config.ts` e é incluída no `dist/server/wrangler.json` pelo build:

```ts
r2_buckets: [
  {
    binding: "BUCKET",
    bucket_name: "moto-mixlocadora",
  },
],
```

## Como o projeto usa o storage

`server/services/media.service.ts` grava as imagens enviadas por um administrador no bucket, após validação dos formatos PNG, JPEG e WebP. Cada objeto tem uma chave formada pelo hash SHA-256 e pela extensão. O banco D1 guarda a referência `/api/media/<hash>.<extensão>`.

A rota de imagens busca o objeto em `env.BUCKET` e responde com o MIME, `nosniff` e cache imutável. Fotos do catálogo são públicas pela rota da aplicação; a gravação exige autorização administrativa na API.

O backend usa a API de Workers. O endpoint S3 informado pelo responsável não precisa ser colocado no Angular, em uma variável `VITE_*` ou em um formulário do site. Não são necessários Access Key ID, Secret Access Key, bucket público, domínio `r2.dev` ou CORS para esse fluxo na mesma origem. O status de acesso público do bucket não foi alterado nesta etapa.

## Conferir o build

Execute na raiz do projeto:

```bash
npm ci
npm run build
```

Abra `dist/server/wrangler.json` e confira `r2_buckets`: o binding deve ser `BUCKET` e o bucket `moto-mixlocadora`. Se usar Docker, gere uma nova imagem/exportação e confira `docker-output/dist/server/wrangler.json`. Um artefato exportado antes dessa atualização ainda pode apontar para o bucket de desenvolvimento.

A publicação do Worker deve acontecer na conta indicada acima. Se for conferir no painel do Worker, procure a seção de bindings e confirme o recurso R2 `BUCKET` associado a `moto-mixlocadora`. Essa associação precisa corresponder à configuração versionada do projeto.

## Verificação depois da publicação

1. Conclua a configuração do login por senha para a hospedagem própria antes de expor o painel.
2. Publique o Worker na conta própria usando o build atualizado.
3. Entre no painel e envie uma foto do dispositivo ao cadastrar ou editar uma moto.
4. Aguarde a confirmação de salvamento.
5. Confira o objeto no bucket `moto-mixlocadora` e a referência `/api/media/` no cadastro.
6. Recarregue o site e confira a foto; a resposta da imagem deve conter `Content-Type` adequado e `X-Content-Type-Options: nosniff`.

Não substitua a referência por um endpoint S3 privado: a URL da API S3 não é uma URL pública de exibição da imagem. Arquivos enviados manualmente com nomes arbitrários não passam automaticamente a integrar o catálogo.

## Escopo e dados existentes

Esta etapa prepara o código e os artefatos para o R2 próprio. Não publica o Worker, não muda a autenticação e não altera os recursos da aplicação atual no Sites. A validação do bucket e da configuração não equivale a um teste completo de upload no Worker de produção, que depende dessa publicação.

As imagens antigas do Sites não foram copiadas para o novo bucket. Arquivos locais em `assets/` continuam sendo servidos como assets do aplicativo. A configuração do D1 `bd_moto-mixlocadora` e suas migrações permanecem preservadas.

Referências: [R2 em Workers](https://developers.cloudflare.com/r2/get-started/workers-api/), [bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) e [API S3](https://developers.cloudflare.com/r2/get-started/s3/).
