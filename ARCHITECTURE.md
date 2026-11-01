# Persistência e autorização

## Contrato HTTP

| Endpoint                   | Acesso        | Função                                                             |
| -------------------------- | ------------- | ------------------------------------------------------------------ |
| `GET /api/session`         | Público       | Informa se a identidade autenticada está autorizada                |
| `GET /api/state`           | Público       | Conteúdo público; histórico e banners desativados são omitidos |
| `PUT /api/state`           | Administrador | Valida e grava o snapshot com versão esperada                      |
| `GET /api/media/:hash.ext` | Público       | Imagens comerciais salvas no R2                                    |

O Sites injeta a identidade autenticada no Worker. O servidor exige sessão administrativa por senha ou ID de usuário e email presente em `ADMIN_EMAILS` em cada PUT. Os guards Angular são apenas a barreira de navegação; editar estado ou JavaScript no navegador não concede autorização no servidor. A interface não recebe a lista de administradores. As URLs de login e logout com ChatGPT pertencem ao Sites. O acesso por senha usa `POST /api/auth/login` e `POST /api/auth/logout`, com validação de origem, senha PBKDF2 e sessões opacas no D1 (`admin_sessions`). Tokens são armazenados somente como SHA-256 e expiram após oito horas; o logout remove o token e a troca de credenciais revoga todas as sessões por senha na mesma transação. `login_attempts` limita a dez tentativas por IP a cada 15 minutos. `admin_credentials` armazena a conta e o hash PBKDF2, inicializados uma única vez a partir dos segredos de runtime. `POST /api/auth/credentials` exige sessão administrativa, mesma origem, senha atual, novo login válido e confirmação de uma senha de 12 a 128 caracteres. A alteração usa revisão otimista e revogação transacional; login concorrente com revisão antiga não cria uma sessão nova. Essas tabelas nunca integram o snapshot público do catálogo.

Gravações exigem JSON, origem idêntica ao site e não aceitam `Sec-Fetch-Site: cross-site`. Não há CORS aberto. O servidor limita o corpo a 8 MB, a frota a 100 motos, os banners a 30 e o histórico a 80 entradas, com limites por campo. IDs duplicados, valores monetários inválidos e protocolos executáveis são rejeitados. Não há HTML administrativo renderizado por innerHTML.

## Fluxo de gravação

1. O formulário valida a alteração e atualiza o store reativo.
2. O store marca o estado como **salvando** e agrupa alterações próximas por 300 ms.
3. Um único PUT é enviado por vez com `{version, state}`. Alterações feitas durante uma requisição são enviadas em seguida, sem perder o estado mais recente.
4. O servidor verifica autorização, origem, tamanho, tipos e regras de negócio.
5. Imagens locais válidas são armazenadas no R2 por hash SHA-256. As tabelas guardam somente suas referências.
6. O repositório grava motos, banners, configurações e histórico em tabelas próprias, dentro de um único batch D1 condicionado à versão. Em caso de concorrência, devolve 409, preservando a versão mais recente.
7. A resposta fornece URLs de imagens, nova versão e horário. Somente então a interface informa que os dados estão salvos.

Em falhas de rede, os dados locais continuam disponíveis e o usuário pode tentar novamente. Timeout após uma gravação efetivada pode exigir recarregar a versão do servidor por causa da proteção de versão. O botão de recarregar pede confirmação antes de descartar edições locais não salvas.

## Armazenamento

| Tabela             | Responsabilidade                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `motorcycles`      | Uma linha por moto, com colunas tipadas para preços, categoria, disponibilidade e posição |
| `banners`          | Uma linha por banner, com conteúdo, imagem, link, status e posição                        |
| `site_settings`    | Configurações públicas, em colunas próprias                                               |
| `admin_activities` | Histórico administrativo preservado pelo contrato atual                                   |
| `catalog_metadata` | Versão global, horário e token interno de controle de escrita                             |
| `site_state`       | Cópia do cadastro legado, preservada e sem novas gravações                                |

A migração SQL adiciona somente o esquema. O backfill de dados acontece fora da migração, em `CatalogRepository.ensureInitialized()`. Cada tentativa usa um token exclusivo; se outra instância inicializar primeiro, a tentativa perdedora não apaga nem insere registros. A versão do cadastro legado é conferida dentro do batch antes da cópia. Dados inválidos interrompem a conversão e preservam o original.

As leituras do catálogo são feitas em batch para manter uma visão consistente. As gravações usam compare-and-swap na versão e condicionam cada instrução ao token vencedor. Deletes e inserts são transacionais: erro em qualquer etapa reverte todo o batch. `json_each` é usado somente para inserir coleções como linhas a partir de parâmetros vinculados, mantendo o total de instruções do batch limitado a nove, mesmo com o catálogo no limite permitido.

Os IDs, valores e referências das imagens não são recriados. Após inicialização, tabelas vazias continuam vazias; o seed nunca ressuscita itens excluídos. A cópia legada é um ponto de recuperação anterior à conversão, não um espelho contínuo dos dados normalizados.

As imagens comerciais são públicas, identificadas por hash e servidas com MIME validado, `nosniff` e cache imutável. Os formatos aceitos são PNG, JPEG e WebP. Arquivos são validados novamente no servidor. Não existe upload público anônimo. Fotos antigas não referenciadas podem permanecer no bucket; limpeza de órfãos não está implementada.

## Interface

Mantém `/`, `/admin/login`, `/admin/dashboard`, `/admin/motos`, `/admin/banners` e `/admin/configuracoes`. As rotas e páginas Angular continuam lazy-loaded. Todos os dispositivos carregam o estado salvo ao abrir ou recarregar o site. Não há atualização push entre dispositivos; conflitos em novas gravações são detectados pelo servidor.

O carrossel mantém rotação automática de 6 segundos sem controles manuais. Upload com prévia, drag and drop, catálogo filtrável, configurações de contato e efeitos de scroll continuam disponíveis.

## Operação

Configure bindings D1/R2 pelo manifesto e a variável `ADMIN_EMAILS` no ambiente do Sites. Migrações em `drizzle/` são aplicadas pela publicação. Não altere uma migração já aplicada; gere uma nova com `npm run db:generate`.

Nenhuma chave de banco, senha ou lista de administradores é incluída no bundle Angular. Para adicionar um administrador, altere a lista no runtime do servidor e publique uma versão. Não reative o acesso demo para gravações permanentes.

## Encapsulamento de CSS

Os componentes do site público, as páginas administrativas, os editores e os campos compartilhados usam `styleUrl` com CSS ao lado do TypeScript/HTML. Breakpoints acompanham o componente que alteram. As bases reutilizadas ficam em `src/styles/`, importadas por uma única entrada global. O CSS do site público usa escopo `.public-site`; os utilitários administrativos usam os contêineres administrativos, evitando vazamento entre as duas áreas.

O Angular Material renderiza overlays fora do host de origem. Por isso, apenas seus ajustes transversais ficam em `material-overrides.css`. Os estados de scroll também são globais por precisarem atingir hosts de componentes filhos. O restante preserva o encapsulamento padrão, sem `::ng-deep` ou desativação de encapsulamento.

## Camadas do backend

```text
server/
  router.ts                 entrada da API e tratamento central de erros
  routes/                   sessão, catálogo e mídia (HTTP)
  auth/                     identidade, administrador e origem
  validation/               validação de unknown para tipos do domínio
  services/                 regras de negócio e uploads
  repositories/             SQL parametrizado e transações D1
  models/                   contratos TypeScript
  http/                     limites de corpo e respostas
  tests/                    API, migração e concorrência
```

Fluxo: `Worker → router → route → validação/autorização → serviço → repositório/D1 ou R2`.

`tsconfig.server.json` habilita modo estrito, verificação de índices e tratamento de erros como `unknown`. A checagem inclui o Worker e o acesso ao banco e faz parte do build. Não há desativação de tipos com `any`. A fronteira de persistência converte linhas SQL em objetos do domínio.

Os endpoints existentes e o formato de resposta continuam compatíveis com o Angular. A revisão de proteção do browser, do bundle e das dependências está em [SECURITY.md](SECURITY.md).

O frontend ainda envia um agregado versionado: esta refatoração não implementa endpoints CRUD individuais por recurso. O histórico continua sendo o histórico funcional fornecido pelo cliente; uma auditoria independente gerada no servidor permanece uma evolução separada.

### Recuperação administrativa

As credenciais de runtime são apenas o bootstrap inicial. Se a senha for perdida após a inicialização, um operador autorizado com acesso ao D1 deve redefinir o hash e a revisão de `admin_credentials` e remover `admin_sessions` na mesma transação. Não exponha esse procedimento como endpoint público e nunca salve senhas em texto puro. A seção do painel exige a senha atual inclusive para sessões ChatGPT.
