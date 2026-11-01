# Mix Locadora — Angular com salvamento permanente

Site público em Angular 21, painel administrativo e API no servidor. Motos, disponibilidade, preços, banners, ordem e configurações são persistidos no D1; imagens do dispositivo são armazenadas no R2 e recebem URLs permanentes. O site continua público. Edições requerem login e senha administrativos ou a conta ChatGPT autorizada no servidor.

## Uso

Acesse `/admin/dashboard`. Entre com login e senha em `/admin/login`; a conta ChatGPT proprietária autorizada continua como alternativa. Salve os formulários normalmente: cada alteração é enviada automaticamente ao servidor. Aguarde **Todas as alterações estão salvas no servidor** no topo antes de fechar.

Se houver erro, a tela não anuncia sucesso e oferece nova tentativa. Se outro dispositivo salvou uma versão mais recente, a gravação é bloqueada para evitar sobrescrever dados. Recarregue os dados salvos, revise a alteração e salve novamente. O navegador avisa ao tentar sair com alterações pendentes.

As alterações antigas da versão demo existiam somente na memória da aba. Esta versão não consegue recuperá-las se essa aba já tiver sido recarregada. Os dados iniciais são usados somente enquanto não houver cadastro persistido. Após a primeira gravação, novas publicações não substituem o cadastro salvo.

## Imagens

Escolha JPG, PNG ou WebP de até 5 MB. O navegador valida e otimiza a foto para até 1920 px / 2 MB. Ao salvar o cadastro, o servidor verifica formato/tamanho, armazena a imagem no R2 por hash e troca a data URL temporária por `/api/media/...`. A imagem fica disponível em outros dispositivos. Cancelar o formulário não grava o arquivo no servidor. Também são aceitas URLs HTTPS e imagens em `public/assets/`.

## Arquitetura

- `src/app/`: aplicação Angular, rotas lazy-loaded, Reactive Forms, Angular Material, estado RxJS/signals.
- `server/router.ts` e `server/routes/`: roteamento HTTP e adaptação de requisições.
- `server/auth/`: identidade e autorização verificadas no servidor.
- `server/validation/`: validação de dados desconhecidos e imagens.
- `server/services/`: regras de catálogo e armazenamento de imagens.
- `server/repositories/`: consultas e gravações nas tabelas próprias do D1.
- `server/models/`: contratos TypeScript do domínio, ambiente e requisições.
- `server/tests/`: integração de API, migração, concorrência e rollback.
- `server/seed.json`: cadastro inicial, usado somente se o banco estiver vazio.
- `db/schema.ts` e `drizzle/`: esquema e migração SQL do D1.
- `worker/index.ts`: API e integração mantida do Sites.
- `app/[[...path]]/route.ts`: entrega o shell Angular nas rotas da aplicação.
- `scripts/build-full.mjs`: compila Angular, organiza assets e gera o Worker com Vinext.
- `.openai/hosting.json`: identidade do Site e bindings `DB` e `BUCKET`.

Angular continua responsável por toda a interface. Vinext é usado apenas para a hospedagem compatível do servidor. Leia [ARCHITECTURE.md](ARCHITECTURE.md) para os contratos e controles.

## Desenvolvimento e build

Requisitos: Node.js 24 e npm.

```bash
npm ci
npm test
npm run typecheck:server
npm run test:api
npm run build
```

`npm run dev:angular` inicia somente a interface, sem API. `npm run build` gera o artefato completo em `dist/`; não publique apenas o build Angular como site estático. Para desenvolvimento completo, execute o build antes de `npm run dev` e aplique as migrações locais conforme a documentação do Sites. Ambiente local e produção usam bancos separados.

O runtime precisa de `ADMIN_EMAILS` (lista de contas autorizadas separadas por vírgula), `DB` (D1) e `BUCKET` (R2). Configure `ADMIN_EMAILS` no servidor, nunca em código Angular. A autenticação hospedada é controlada pelo Sites por `/signin-with-chatgpt` e `/signout-with-chatgpt`. O login por senha usa `ADMIN_USERNAME` e `ADMIN_PASSWORD_HASH` (segredos de runtime). O hash tem formato `salt:hash`, com PBKDF2-SHA256, 100.000 iterações e saída de 32 bytes. A senha não é incluída no repositório. A sessão dura oito horas, fica em cookie HttpOnly/Secure/SameSite=Strict e é revogada no logout. Há limite de dez tentativas em 15 minutos por IP. Trocar o hash invalida as sessões anteriores. Não existe senha demo nem autorização por localStorage.

## Verificação

Testes de interface e API cobrem CRUD, upload, serialização, persistência entre instâncias, erro de rede, conflitos, bloqueio de gravações anônimas e de outras contas, origem da requisição e validação de payload. O ambiente de criação não possui prévia de navegador real disponível. O executor usa um preload externo apenas para substituir métricas RSS indisponíveis durante build/testes; ele não faz parte da aplicação publicada.

Contadores de acesso e cliques em WhatsApp continuam sendo indicadores da sessão, não analytics globais nem confirmação de reserva. O histórico administrativo acompanha as gravações. Imagens iniciais são ilustrativas; confirme telefone, endereço e preços reais antes da divulgação.

## Organização dos estilos

Cada componente visual tem um `.component.css` associado por `styleUrl`, com encapsulamento padrão do Angular e seus próprios breakpoints. `src/styles.css` é apenas a entrada dos estilos compartilhados:

- `styles/tokens.css`: cores e fontes do projeto.
- `styles/base.css`: reset, elementos básicos, foco e movimento reduzido.
- `styles/utilities.css`: leitores de tela, estado hidden e mensagens de campo.
- `styles/public-shared.css`: contêineres, títulos, marca e botões compartilhados do site público, limitados ao escopo `.public-site`.
- `styles/admin-shared.css`: painéis, tabelas, formulários e mensagens reutilizados, limitados ao ambiente administrativo.
- `styles/admin-theme.css`: variáveis de tema herdadas pelas páginas e overlays.
- `styles/material-overrides.css`: ajustes do Angular Material e dos modais renderizados fora da árvore dos componentes.
- `styles/motion.css`: estados da diretiva de revelação, incluindo hosts de componentes filhos.

Não há `ViewEncapsulation.None` nem `::ng-deep`. `src/admin.css` foi substituído pelos estilos locais e pelos compartilhados acima. Novos estilos específicos devem ser adicionados ao componente; use o global apenas quando houver compartilhamento real ou integração com overlays.

## Evolução do banco e migração do formato anterior

O catálogo é armazenado nas tabelas `motorcycles`, `banners`, `site_settings`, `admin_activities` e `catalog_metadata`. O JSON continua apenas como contrato HTTP do Angular; ele não é mais a unidade de armazenamento do cadastro.

A migração SQL `0001_lying_wind_dancer.sql` cria somente as novas tabelas. Na primeira leitura após a atualização, o repositório converte o cadastro legado dentro de uma transação, preservando IDs, ordem, preços, disponibilidade, referências de imagens, configurações, histórico, versão e horário. O processo é idempotente e não recria registros excluídos. A tabela `site_state` permanece como cópia do formato anterior e deixa de receber gravações.

O seed só é usado quando não existe cadastro legado. Dados legados inválidos não são substituídos silenciosamente pelo seed: a conversão falha, mantendo o original. Para recuperar uma versão antiga do aplicativo após novas gravações, é preciso converter os dados normalizados atuais de volta ao formato antigo; a cópia legada não acompanha alterações posteriores.

O build executa a checagem TypeScript estrita do servidor antes de gerar os arquivos. O comando `npm run test:api` usa SQLite real em memória com as migrações do projeto e um adaptador D1 que verifica transações e rollback.
