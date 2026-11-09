# Segurança — Mix Locadora de Motos

Revisão de aplicação realizada em **1 de novembro de 2026**. Este documento registra controles e verificações do projeto; não constitui certificação, garantia de invulnerabilidade ou pentest independente.

## Dados públicos e dados protegidos

| Conteúdo | Tratamento |
| --- | --- |
| Modelos, preços, disponibilidade, imagens comerciais e contatos do negócio | Públicos, necessários ao funcionamento do site |
| Banners desativados e histórico administrativo | Retornados somente após autorização administrativa |
| Senha digitada no login ou na troca de credenciais | Enviada por POST ao backend na mesma origem HTTPS; campos limpos após a tentativa de envio |
| Hash da senha, revisão das credenciais, sessões e tentativas de login | Mantidos no servidor/D1; nunca retornados pelo catálogo público ou incluídos no bundle Angular |
| Token da sessão | Cookie `__Host-mix_admin`, `HttpOnly`, `Secure`, `SameSite=Strict`, com expiração e revogação no backend |
| Segredos da hospedagem | Segredos de runtime; ausentes de `.openai/hosting.json`, do repositório e do bundle |

O navegador precisa receber o código da interface, dados públicos e os dados administrativos autorizados para exibi-los. A senha digitada necessariamente existe temporariamente no campo e na requisição de autenticação. Isso é diferente de publicar uma senha no código ou armazená-la em `localStorage`.

Não guarde documentos privados, dados de identidade ou contratos de clientes no bucket de imagens comerciais: `/api/media/` é destinado a fotos públicas da frota e dos banners.

## Controles implementados

- Autorização no backend para cada gravação e troca de credenciais; guards Angular não concedem permissão ao servidor.
- Login por senha com PBKDF2-SHA256, salt individual e verificação de hash; apenas hashes ficam no banco.
- Sessões opacas com até oito horas de duração, identificador aleatório de 256 bits e hash do token no D1.
- Botão **Sair** conectado à revogação da sessão por senha no backend.
- Troca de credenciais exige senha atual, novo login válido e confirmação; revoga sessões por senha na mesma transação.
- Limite de dez tentativas por IP em 15 minutos. O IP é utilizado em forma de hash para a chave de limitação.
- Validação de origem e rejeição de requisições cross-site nas operações protegidas.
- Limites de corpo, tipos, preços, referências de imagens e protocolos de URL verificados no servidor.
- SQL parametrizado e transações com controle de versão para conflitos de gravação.
- Arquivos enviados restritos a JPEG, PNG e WebP, com limite de tamanho e verificação de assinatura.
- Minimização das respostas: visitantes não recebem histórico ou campanhas desativadas; o endpoint de sessão não retorna e-mail.
- Bloqueio de caminhos de código/configuração no Worker e ausência desses arquivos no diretório público de build.

A autorização por identidade dos headers do Sites foi removida. Mesmo com um email anteriormente autorizado, esses headers não substituem a sessão por senha. O navegador recebe somente um token opaco de 256 bits no cookie `__Host-mix_admin`, com `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/` e sem `Domain`. O D1 guarda apenas o HMAC-SHA-256 do token, calculado com a chave privada `SESSION_SECRET`. Senhas são verificadas por PBKDF2-SHA-256 com salt aleatório; os segredos nunca entram no cliente Angular.

## Proteções do navegador

As respostas dinâmicas do Worker recebem `nosniff`, política sem envio de referrer, restrições de câmera/microfone/geolocalização/pagamento/USB e HSTS em HTTPS. Documentos HTML usam `Cache-Control: no-store`, e as páginas administrativas recebem `noindex, nofollow`.

A Content Security Policy do HTML restringe scripts à mesma origem, não libera scripts inline nem `eval`, bloqueia objetos e restringe conexões de scripts à própria origem. Fontes e mapas têm origens explícitas. Imagens HTTPS continuam permitidas para manter a funcionalidade de URLs externas cadastradas pelo administrador.

Os estilos inline permanecem permitidos por compatibilidade com os componentes e overlays do Angular Material. O build desativa a inclusão de CSS crítico que dependia de um manipulador inline de carregamento. A política permite enquadramento pela própria origem e por `https://chatgpt.com`, preservando o contexto de publicação.

Esses headers são aplicados pelo Worker às respostas que ele gera. O atendimento direto de assets estáticos e as rotas de autenticação da plataforma também dependem dos controles da hospedagem.

## Dependências

A revisão atualizou versões e fixou dependências transitivas corrigidas no `package.json` e no lockfile. Os overrides de `sharp`, `esbuild`, `glob`, `minimatch`, `image-size`, `satori`, `undici`, `ws` e `fflate` devem ser reavaliados ao atualizar o framework ou a ferramenta que os utiliza.

Execute regularmente:

```bash
npm ci
npm audit
npm run typecheck:server
npm run test:api
npm test
npm run build
npm run security:check -- --history
```

A auditoria npm consulta os avisos conhecidos no momento da execução. Ausência de alertas não significa ausência de vulnerabilidades, e a classificação de uma dependência não comprova que um vetor específico esteja acessível nesta aplicação.

## Verificação do bundle e do histórico

O build executa `scripts/security-check.mjs`, que verifica arquivos versionados e novos arquivos não ignorados, além de `public/client` e `dist/client`. Ele procura padrões de chaves/tokens/hashes, arquivos privados no cliente, source maps e identificadores exclusivos da autenticação do servidor.

A opção `--history` também examina os blobs alcançáveis pelo histórico Git disponível no checkout. É uma varredura por padrões; não consegue reconhecer todo segredo possível, histórico indisponível, credenciais revogadas ou dados pessoais sem formato conhecido. Se uma credencial real vazar, revogue-a: remover o texto de um commit novo não basta.

As migrações e schemas ficam no código do servidor, sem dados de produção. O build usa somente `public/assets` como entrada de assets Angular, evitando copiar builds anteriores recursivamente para a pasta pública.

## Evidências e limites da revisão

A validação inclui testes de autorização, cookie inválido/expirado, logout, origem, limitação de tentativas, troca de credenciais, revogação, concorrência, rollback, filtragem do catálogo público e headers. Também inclui checagem TypeScript, build de produção, auditoria de dependências e varredura dos arquivos públicos e do histórico disponível.

A revisão não equivale a pentest completo, teste de carga, perícia dos acessos anteriores, auditoria dos provedores ou revisão integral das permissões das contas GitHub/Cloudflare/Sites. Não foram alteradas as credenciais reais durante os testes. A segurança também depende do dispositivo do administrador, das contas da hospedagem, de atualizações e da operação.

## Operação e comunicação de incidentes

- Use uma senha exclusiva e longa. Caso ainda esteja usando a senha inicial compartilhada na conversa de entrega, troque-a em **Configurações → Segurança de acesso**.
- Para senha perdida, siga a recuperação administrativa em [ARCHITECTURE.md](ARCHITECTURE.md#recuperação-administrativa), com um operador autorizado.
- Não coloque senhas, tokens, cookies, dados de clientes ou dumps de produção em issues públicas, logs, screenshots ou commits.
- Comunique suspeitas por um canal privado com o responsável pelo projeto. Inclua a rota e uma descrição do comportamento, sem segredos nem dados de terceiros.

## Referências

- [Segurança no Angular](https://angular.dev/best-practices/security)
- [Headers de segurança em Cloudflare Workers](https://developers.cloudflare.com/workers/examples/security-headers/)
- [GitHub Advisory Database](https://github.com/advisories)

## Proteção das rotas administrativas

O Worker valida a sessão antes de entregar documentos administrativos protegidos. Visitantes sem autorização são redirecionados ao login, e falhas na validação bloqueiam a resposta protegida. O login permanece acessível para autenticação. Os guards Angular também consultam o servidor a cada navegação, mesmo que exista uma flag administrativa antiga em memória. A autorização da API permanece independente desses guards.

O link administrativo foi removido do rodapé público e dos links de acesso direto da apresentação do README. Respostas administrativas incluem `noindex, nofollow, noarchive, nosnippet` e `no-store`; essas diretivas orientam buscadores compatíveis e não controlam crawlers maliciosos. Não se listam rotas administrativas em robots.txt.

O repositório GitHub é público: rotas também podem ser inferidas pelo código entregue ao navegador. Não há garantia de URL secreta. Conhecer o endereço não concede uma sessão autorizada nem acesso de escrita. Remover um link não apaga cópias antigas em caches, commits ou histórico de navegação.
