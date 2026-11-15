# SEO local — Mix Locadora de Motos

## Renderização e dados

A página `/` usa Angular SSR no Cloudflare Worker. O Worker lê o snapshot público do D1, remove banners inativos e histórico administrativo e o entrega como `REQUEST_CONTEXT` ao Angular. O Angular renderiza os mesmos componentes usados no navegador. O snapshot público é transferido ao navegador com `TransferState`, para hidratar exatamente os dados que produziram o HTML. Após a hidratação, o cliente revalida sessão e dados pela API. A hidratação mantém filtros, carrosséis, formulários e WhatsApp interativos. Login e páginas administrativas continuam em CSR, protegidos pela sessão no Worker e pelos guards Angular.

O render público não recebe cookies, segredos, bindings nem identidade do administrador. A inicialização no servidor não chama `/api/session` nem `/api/state`. Uma falha no D1/renderizador retorna HTTP 503 com `Retry-After` e `noindex`, sem publicar dados demonstrativos como conteúdo de fallback.

O build Angular gera `.angular/site-client/browser` e `.angular/site-client/server`. **Somente `browser` é copiado para `public/client`.** Os módulos SSR são incorporados ao bundle privado do Worker pelo Vite. Não publique `.angular/site-client` inteiro como diretório de assets.

As versões das dependências Angular estão fixadas para manter os peers de runtime, compilação e SSR compatíveis. O SSR usa `experimentalPlatform: neutral`, disponível na versão instalada do builder, e foi validado no runtime Workerd por Miniflare.

## Conteúdo e endereços

- Título: Aluguel de Motos em Palhoça – SC | Mix Locadora.
- H1: Aluguel de motos em Palhoça – SC; o texto das campanhas permanece no banner como complemento.
- Canonical: `https://mixlocadora.com.br/`.
- `www.mixlocadora.com.br` e o endereço público temporário `mix-locadora-angular.operacional-825.workers.dev` redirecionam seus documentos públicos para o domínio principal.
- APIs e páginas administrativas não são redirecionadas entre hosts, preservando o escopo dos cookies de sessão.
- `/robots.txt` é texto e `/sitemap.xml` é XML. O sitemap contém apenas `/`; âncoras como `#motos` não são páginas separadas.
- URLs públicas inexistentes devolvem 404. Endpoints de estado/sessão e páginas administrativas têm `noindex`.

O JSON-LD `LocalBusiness` é gerado a partir das configurações reais no D1: telefone, endereço, redes sociais e horários reconhecidos. Valores demonstrativos ou dados insuficientes não geram uma ficha fictícia. Horários fora do formato reconhecido são omitidos do JSON-LD; o texto cadastrado continua visível na página. Não são inventadas avaliações, estrelas, coordenadas ou preços de contratos.

A página é gerada novamente a cada requisição, com `no-store`; alterações no painel aparecem no próximo HTML servido sem novo build. Cache futuro deve separar estritamente dados públicos de sessão e prever invalidação após salvamentos.

## Validação antes de publicar

```bash
npm ci
npm test -- --progress=false
npm run test:api
npm run build
npm run test:ssr
npx wrangler deploy --dry-run --config dist/server/wrangler.json
```

`test:ssr` cria D1/R2 efêmeros locais; não acessa produção. Confere HTML com H1 e modelos antes de executar JavaScript, atualização dos dados sem rebuild, JSON-LD, robots, sitemap, redirects, 404 e bloqueio do painel anônimo.

Após publicar, confira o código-fonte recebido de `https://mixlocadora.com.br/`, não somente o DOM da aba Elements. Valide o JSON-LD no Rich Results Test e a URL no Search Console. Monitore CPU/latência do SSR no plano Workers em uso antes de aumentar a frota ou adicionar cache.

## Etapas que dependem da conta Google

1. No Search Console, crie uma propriedade de domínio `mixlocadora.com.br` e obtenha o registro TXT de verificação. Não adivinhe o valor; copie o fornecido pelo Google para a zona DNS Cloudflare.
2. Após verificar a propriedade, envie `https://mixlocadora.com.br/sitemap.xml` e use Inspeção de URL para conferir HTML renderizado e solicitar indexação da página principal.
3. No Perfil da Empresa no Google, confirme o endereço, telefone, horários, categoria adequada disponível, serviços e o site principal. Conclua a verificação de propriedade exigida pelo Google.
4. Cadastre fotos reais, mantenha horários especiais atualizados e solicite avaliações autênticas sem inventar classificações no site.
5. O endereço antigo hospedado em `chatgpt.site` é uma implantação separada. O deploy no Worker próprio não a altera; o código novo já reconhece esse hostname e redireciona os documentos públicos, mas a implantação antiga precisa receber essa versão ou ser encerrada separadamente para não manter uma cópia pública antiga.

Essas etapas não prometem posicionamento. A indexação e a classificação dependem do Google e dos sinais reais da empresa.


## Sitemap para o Google Search Console

**URL de envio:** `https://mixlocadora.com.br/sitemap.xml`.

O arquivo é gerado pelo Worker em `server/seo/sitemap.ts`, atendido por `server/seo/public-page.ts`. Não é necessário criar ou enviar um XML manual ao Google. A resposta usa UTF-8, `application/xml`, o namespace oficial de sitemaps e a extensão de imagens do Google.

- Inclui a URL canônica `https://mixlocadora.com.br/`, única página pública atual.
- Fotos da frota e banners ativos hospedados em `/assets/` ou `/api/media/` são associados à página pela extensão `image:image`, com URLs HTTPS absolutas, sem duplicatas e com escape XML. Limite de 1.000 imagens por página.
- Imagens externas, uploads inline, banners inativos, painel, APIs administrativas, parâmetros de navegação e âncoras não viram páginas do sitemap.
- As imagens refletem o catálogo público atual no D1, sem precisar de novo build após salvar pelo painel. Uma falha no banco devolve 503 com `Retry-After`, nunca um XML de sucesso com dados falsos.
- Não usa `priority` ou `changefreq`, ignorados pelo Google. `lastmod` foi omitido: o timestamp atual do catálogo também muda por eventos administrativos e não comprova alteração significativa da página. Não substitua pela data de cada acesso ou deploy.
- Endereço, telefone, horários e serviços pertencem ao conteúdo visível e ao JSON-LD `LocalBusiness`, não a tags inventadas dentro do sitemap.

### Publicar e enviar

1. Atualize o código e publique o Worker:

   ```bash
   git pull --ff-only origin main
   npm ci
   npm run build
   npx wrangler deploy --config dist/server/wrangler.json
   ```

2. Abra a URL do sitemap e confira HTTP 200 e XML. Confira também `https://mixlocadora.com.br/robots.txt`, que anuncia esse endereço.
3. Na propriedade verificada `mixlocadora.com.br` do Search Console, abra **Sitemaps**, informe a URL acima em **Adicionar um novo sitemap** e clique em **Enviar**.
4. Use **Inspeção de URL** com `https://mixlocadora.com.br/`, faça o teste da URL publicada e solicite indexação se necessário. Um envio aceito não garante indexação ou posição nos resultados.

Quando existirem páginas públicas próprias (por exemplo, uma página de modelo), inclua suas URLs canônicas somente após implementar HTML indexável e resposta 200 para cada uma. Hoje `#motos`, `#contato` e `#localizacao` continuam sendo partes da página inicial.

Referências: [sitemaps do Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=pt-br) e [sitemaps de imagens](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps?hl=pt-br).
