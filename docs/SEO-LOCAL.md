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
