<p align="center">
  <img src="docs/assets/readme-cover.svg" alt="Mix Locadora de Motos — Seu próximo movimento" width="100%" />
</p>

<p align="center">
  <strong>Uma operação conectada. Da vitrine ao controle da frota.</strong><br />
  Plataforma da Mix Locadora de Motos, com site público, painel administrativo e dados persistentes.
</p>

<p align="center">
  <a href="https://mix-locadora-motos-racing.alesonroberto3.chatgpt.site">Visitar o site</a> ·
  <a href="ARCHITECTURE.md">Documentação técnica</a>
</p>

---

## A Mix em movimento

A **Mix Locadora de Motos** aproxima quem precisa de uma moto da frota disponível. O site apresenta modelos, planos e informações de atendimento; o **Mix Control Center** permite gerenciar a operação sem editar o código a cada atualização.

A identidade visual combina grafite, verde neon e tipografia marcante, com navegação responsiva e animações discretas. O mesmo cuidado acompanha a administração: tabelas objetivas, formulários organizados e confirmação do salvamento no servidor.

## O que a plataforma entrega

### Para quem vai alugar

- Catálogo com filtros, preços diários e semanais, especificações e disponibilidade.
- Contato pelo WhatsApp com mensagem preenchida para o modelo escolhido.
- Banners com rotação automática a cada seis segundos, sem setas ou botão de pausa.
- Seções de vantagens, localização, horários e contato.
- Botão flutuante de WhatsApp e efeitos de entrada ao rolar a página.
- Interface adaptada a celulares, tablets e desktops, respeitando a preferência por movimento reduzido.

### Para quem administra

- Visão geral da frota, disponibilidade e atividades.
- Cadastro, edição e exclusão de motos, com confirmação antes de excluir.
- Alternância rápida entre moto disponível e indisponível.
- Gerenciamento de banners: conteúdo, imagem, ordem e ativação.
- Upload de imagens do dispositivo, com prévia e otimização.
- Configuração de WhatsApp, endereço, mapa, horários e redes sociais.
- Alteração de login e senha no próprio painel, mediante confirmação da senha atual.
- Salvamento automático e bloqueio de sobrescrita quando outra sessão grava uma versão mais recente.
- Menu lateral retrátil com os SVGs oficiais do Bootstrap Icons escolhidos para a marca.

> **Escopo da operação:** o WhatsApp inicia o atendimento. Um clique representa intenção de contato; não confirma uma reserva nem efetua pagamento. Os indicadores de visitas e cliques são da sessão, sem analytics globais.

## Tecnologias

| Camada | Tecnologias | Responsabilidade |
| --- | --- | --- |
| Interface | Angular 21, Standalone Components | Site público e painel administrativo |
| Formulários e estado | Reactive Forms, RxJS e Signals | Validação, estado reativo e sincronização |
| UI | Angular Material, CSS por componente, Bootstrap Icons | Componentes, tema e identidade visual |
| Backend | TypeScript estrito, Cloudflare Workers | API, autenticação, validações e regras |
| Dados | Cloudflare D1, Drizzle ORM e migrações SQL | Persistência e transações |
| Imagens | Cloudflare R2 | Arquivos enviados pelo painel |
| Hospedagem | Sites, Vinext e Vite | Empacotamento e execução do Worker |
| Testes | Vitest, Angular TestBed e SQLite em memória | Interface, API, autenticação e persistência |

**Angular é responsável por toda a interface.** Vinext integra a entrega do shell Angular à hospedagem do servidor; não há uma segunda interface React para administrar.

## Começar a desenvolver

### Pré-requisitos

- Node.js 24 e npm.
- Para executar a API completa: ambiente configurado com D1, R2 e os segredos administrativos.
- Git para clonar e versionar o projeto.

```bash
git clone https://github.com/aw-develop/moto-mix-locadora.git
cd moto-mix-locadora
npm ci
```

### Interface Angular

```bash
npm run dev:angular
```

Esse comando inicia a interface. O login, a leitura dos dados persistidos e o salvamento dependem da API; o servidor Angular isolado não substitui o backend.

### Aplicação completa

Configure os bindings e o ambiente, aplique as migrações no banco de desenvolvimento e execute:

```bash
npm run build
npm run dev
```

O build gera o cliente Angular, organiza seus arquivos e compila o Worker. Os bancos de desenvolvimento e produção devem ser separados. O ambiente hospedado usa a configuração do Sites; um clone do GitHub, por si só, não provisiona banco, bucket ou autenticação.

### Comandos do projeto

| Comando | Finalidade |
| --- | --- |
| `npm run dev:angular` | Iniciar somente a interface Angular |
| `npm run dev` | Iniciar o ambiente integrado de desenvolvimento |
| `npm run build` | Checar os tipos do servidor e gerar a aplicação completa em `dist/` |
| `npm run build:client` | Compilar somente o cliente Angular |
| `npm test` | Executar os testes da interface |
| `npm run test:api` | Executar os testes da API e das migrações |
| `npm run typecheck:server` | Verificar os tipos do backend, banco e Worker |
| `npm run db:generate` | Gerar uma nova migração a partir do schema Drizzle |

## Configuração do ambiente

Use [.env.example](.env.example) como referência de nomes. Valores reais de produção são configurados como segredos na hospedagem e ficam fora do repositório e do bundle Angular.

| Binding ou variável | Uso |
| --- | --- |
| `DB` | Binding do banco Cloudflare D1 |
| `BUCKET` | Binding do armazenamento Cloudflare R2 |
| `ADMIN_USERNAME` | Login inicial, usado para inicializar a conta no banco |
| `ADMIN_PASSWORD_HASH` | Hash inicial no formato `salt:hash`, nunca a senha em texto puro |
| `ADMIN_EMAILS` | Contas autorizadas para a alternativa de entrada com ChatGPT, separadas por vírgula |

O manifesto [.openai/hosting.json](.openai/hosting.json) mantém a identidade da publicação e os bindings. Ele não deve conter segredos. A conta autorizada com ChatGPT é validada no servidor; os guards Angular apenas controlam a navegação.

## Acesso e entrega ao cliente

1. Acesse **o endereço administrativo fornecido ao responsável na entrega** com suas credenciais.
2. Abra **Configurações → Segurança de acesso**.
3. Informe a senha atual, o novo login e a nova senha com confirmação.
4. Salve e entre novamente com os novos dados.

A nova senha deve ter **12 a 128 caracteres**. A troca fica salva no D1, entra em vigor imediatamente e encerra as sessões por senha. **Não é necessário alterar a hospedagem ou republicar o site.** O acesso proprietário com ChatGPT permanece disponível.

Os segredos de runtime inicializam a conta apenas uma vez. Depois dessa inicialização, `admin_credentials` é a fonte das credenciais: mudar `ADMIN_USERNAME` ou `ADMIN_PASSWORD_HASH` na hospedagem não substitui automaticamente a conta salva.

Se a senha atual for perdida, a recuperação exige um operador autorizado com acesso ao banco. O procedimento técnico está em [ARCHITECTURE.md](ARCHITECTURE.md#recuperação-administrativa).

### Proteções implementadas

- Senhas derivadas com PBKDF2-SHA256, salt e 100.000 iterações.
- Sessões de até oito horas em cookie `HttpOnly`, `Secure` e `SameSite=Strict`.
- Tokens de sessão armazenados como hash, com revogação no encerramento da sessão.
- Limite de dez tentativas de autenticação por IP em uma janela de 15 minutos.
- Autorização e validação de origem nas operações protegidas.
- Validação de tipos, tamanhos, URLs, imagens e valores no backend.
- Controle de versão para impedir sobrescritas silenciosas do catálogo.

## Salvamento e imagens

Ao salvar um formulário, aguarde **“Todas as alterações estão salvas no servidor”** antes de fechar a página. Em falha de rede, use a opção de tentar novamente. Em conflito com outra sessão, recarregue o cadastro salvo e revise sua alteração antes de reenviar.

As fotos podem ser **JPG, PNG ou WebP de até 5 MB**. O navegador otimiza a imagem para até **1920 px e 2 MB**; o servidor valida o arquivo novamente e o armazena no R2. O cadastro passa a usar uma URL `/api/media/...`, acessível em outros dispositivos. Cancelar o formulário não envia a imagem ao servidor.

Também são aceitas URLs HTTPS e imagens em `public/assets/`. Fotos comerciais publicadas são públicas; o bucket não é destinado a documentos privados de clientes.

## Estrutura do código

| Caminho | Conteúdo |
| --- | --- |
| `src/app/features/` | Seções do site público |
| `src/app/public/` | Composição da página pública |
| `src/app/admin/` | Dashboard, frota, banners, configurações, segurança e layout |
| `src/app/core/` | Modelos, serviços, guards, validações e configuração Angular |
| `src/app/shared/` | Componentes e diretivas reutilizados, incluindo os ícones |
| `src/styles/` | Tokens visuais e estilos compartilhados |
| `server/routes/` | Entrada HTTP de autenticação, credenciais, sessão, catálogo e mídia |
| `server/auth/` | Identidade, senha, sessão e limite de tentativas |
| `server/services/` | Regras de negócio e tratamento das imagens |
| `server/repositories/` | Consultas SQL, transações e acesso ao D1 |
| `server/validation/` e `server/models/` | Validação e contratos TypeScript |
| `server/tests/` | Testes de API, autenticação e migração |
| `db/schema.ts` e `drizzle/` | Schema tipado e migrações do banco |
| `worker/index.ts` | Entrada do Worker e integração com a hospedagem |
| `app/` | Entrega do shell Angular |
| `public/assets/` | Imagens e sprite SVG local dos Bootstrap Icons |
| `docs/assets/` | Identidade visual da documentação |
| `vendor/` | Referências e licenças de recursos de terceiros |

### Organização do CSS

Cada componente visual usa seu próprio `.component.css` via `styleUrl`. A entrada global `src/styles.css` reúne apenas os estilos compartilhados:

| Arquivo | Responsabilidade |
| --- | --- |
| `tokens.css` | Cores, fontes e tokens visuais |
| `base.css` | Reset, elementos básicos e foco |
| `utilities.css` | Acessibilidade e utilitários |
| `public-shared.css` | Elementos compartilhados do site público |
| `admin-shared.css` | Formulários, painéis e tabelas administrativas |
| `admin-theme.css` | Tema da administração e overlays |
| `material-overrides.css` | Ajustes transversais do Angular Material |
| `motion.css` | Efeitos de revelação ao rolar a página |

Os Bootstrap Icons usam seus desenhos originais, com o contorno global de SVG desativado no componente para preservar a espessura fina. Não há `ViewEncapsulation.None` nem `::ng-deep`.

## Persistência e banco

O catálogo usa tabelas próprias: `motorcycles`, `banners`, `site_settings`, `admin_activities` e `catalog_metadata`. A autenticação usa `admin_credentials`, `admin_sessions` e `login_attempts`, que não fazem parte do snapshot público.

O frontend troca um snapshot JSON versionado com a API, mas o backend persiste os registros em colunas próprias e usa transações. Publicações novas não substituem automaticamente o cadastro salvo.

A tabela legada `site_state` é preservada como cópia anterior à normalização. A conversão é transacional e idempotente; o seed só é usado quando ainda não existe cadastro. Consulte a [arquitetura](ARCHITECTURE.md) antes de alterar esquema, migrações ou estratégias de recuperação.

## Segurança e verificação

Consulte [SECURITY.md](SECURITY.md) para a revisão, as proteções implementadas, os limites e o procedimento de comunicação de incidentes. O build verifica o bundle público para detectar arquivos privados e padrões de segredos. O botão Sair revoga a sessão por senha no servidor; banners desativados e histórico administrativo não integram a resposta pública.

```bash
npm audit
npm run security:check -- --history
```

Execute a checagem do bundle após gerar o build. Ela não substitui um pentest ou a revisão das contas de hospedagem.

## Qualidade e publicação

Antes de enviar uma alteração:

```bash
npm run typecheck:server
npm run test:api
npm test
npm run build
```

Os testes cobrem a interface administrativa, validações, persistência, imagens, autenticação, troca de credenciais, concorrência, migração e rollback.

A publicação atual usa **Sites com Cloudflare Workers, D1 e R2**. O fluxo prepara o código versionado, gera o artefato completo e publica uma versão salva. As migrações são aplicadas pelo fluxo de hospedagem. **Enviar um commit ao GitHub não publica automaticamente o site:** não há pipeline de deploy do GitHub configurado neste repositório.

Não publique somente o cliente Angular como um site estático se precisar manter login, upload e salvamento. Gere novas migrações para alterações de schema; não edite migrações já aplicadas.

## Pontos de operação

- Dados de outros dispositivos são carregados ao abrir ou recarregar a página; não há atualização push entre sessões.
- O histórico administrativo é funcional e acompanha o catálogo; não constitui uma auditoria independente gerada pelo servidor.
- Imagens antigas sem referência podem permanecer no R2; a limpeza automática de arquivos órfãos ainda não está implementada.
- Confirme telefone, endereço, fotos, horários e preços reais antes da divulgação comercial.

---

<p align="center">
  <strong>MIX LOCADORA DE MOTOS</strong><br />
  Seu próximo movimento. Sua operação no controle.<br />
  <sub>Projeto mantido em <a href="https://github.com/aw-develop/moto-mix-locadora">aw-develop/moto-mix-locadora</a> · Licenças de terceiros disponíveis em <a href="vendor/">vendor/</a>.</sub>
</p>
