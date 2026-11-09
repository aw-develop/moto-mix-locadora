# Autenticação e segredos do Worker

## 1. A identidade vem da sessão

A autorização pelos headers `oai-authenticated-user-id` e `oai-authenticated-user-email` foi removida da API e da proteção dos documentos. A variável legada `ADMIN_EMAILS` não é usada. Enviar esses headers ou um Bearer token não substitui o cookie.

O login envia usuário e senha por um POST HTTPS à própria aplicação. O backend verifica a senha e gera 32 bytes aleatórios para uma sessão opaca. A resposta define:

```text
Set-Cookie: __Host-mix_admin=<token>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800
```

`HttpOnly` impede que o JavaScript leia o cookie. `Secure` exige HTTPS. `SameSite=Strict` restringe o envio em contextos entre sites. O prefixo `__Host-`, `Path=/` e a ausência de `Domain` limitam o cookie ao host. A API continua exigindo mesma origem nas gravações; não há CORS aberto.

O navegador envia o cookie automaticamente em chamadas à mesma origem. O Angular usa `credentials: 'same-origin'`, não recebe o token no JSON e não o armazena no localStorage. A API calcula HMAC-SHA-256 com `SESSION_SECRET` e consulta a sessão no D1. O token original não fica no banco. As sessões expiram em oito horas; sair remove a sessão e a troca de credenciais revoga todas as sessões no D1. Rotacionar `SESSION_SECRET` invalida os tokens existentes.

## 2. Os três segredos

| Segredo | Função |
| --- | --- |
| `ADMIN_USERNAME` | Login para inicializar a conta no D1 |
| `ADMIN_PASSWORD_HASH` | Verificador inicial da senha no formato `salt:hash` |
| `SESSION_SECRET` | Chave aleatória de 256 bits, independente da senha, usada nos identificadores de sessão |

PBKDF2-SHA-256 deriva um verificador a partir da senha, um salt aleatório de 32 bytes e 100.000 iterações, compatível com o backend existente. O salt é convertido para texto hexadecimal antes da derivação. Não é criptografia reversível: o servidor calcula novamente a derivação para conferir a senha. O salt torna diferentes os verificadores de senhas iguais; as iterações aumentam o custo de tentativas. Senha forte, limitação de tentativas e proteção dos segredos continuam necessárias.

O D1 guarda o verificador em `admin_credentials` após a inicialização, nunca a senha em texto puro. Esses registros não entram no catálogo público. Alterar os segredos de bootstrap depois de a conta existir não troca a senha salva no D1: use Segurança de acesso no painel. O assistente abaixo recusa uma nova inicialização quando já existe uma conta.

## 3. Escolher a senha sem colocá-la no chat

O Worker de destino é `mix-locadora-angular`, na conta `825f844ee27d60a88ad9a5ed44568ed8`. O D1 de destino é `bd_moto-mixlocadora`.

No terminal interativo do computador, com Node.js 24:

```bash
git pull
npm ci
npm run build
npx wrangler login
npm run admin:setup
```

O assistente verifica o destino e consulta somente a quantidade de contas no D1 antes de perguntar os dados. Informe o login, uma senha de 16 a 128 caracteres e sua confirmação. **A senha não aparece enquanto é digitada.** O assistente deriva o hash, gera a chave de sessão e envia os três valores pelo stdin do Wrangler, sem gravar arquivos e sem incluir a senha em argumentos ou histórico do shell. Os valores não são impressos pelo assistente.

É necessário acesso D1 de leitura para a conferência e permissão de edição de Workers para gravar os segredos. Não informe senhas, hashes ou tokens de conta no chat. Não coloque os valores em `vite.config.ts`, `VITE_*`, Angular, Dockerfile, Compose ou GitHub.

O comando `wrangler secret bulk` altera os segredos e a versão ativa do Worker. Nesta preparação, use-o no Worker de manutenção reservado; ele ainda não contém a aplicação completa. A publicação posterior do build usará os segredos já cadastrados.

## 4. Verificação e publicação

Após o assistente, confira somente os nomes e tipos dos segredos no painel Cloudflare. Os três nomes devem constar como segredos, não variáveis públicas de build. O build declara seus nomes como obrigatórios.

Publique o build na conta própria e, pela URL HTTPS, confira:

1. Headers forjados não abrem o painel nem autorizam a API.
2. Login válido define o cookie protegido e não devolve token no JSON.
3. A sessão permite salvar dados; sem cookie, a gravação é rejeitada.
4. Sair ou trocar as credenciais encerra o acesso anterior.

O Worker de manutenção e seus segredos não publicam o frontend. A aplicação anteriormente hospedada no Sites também não é republicada automaticamente nesta preparação. Ela precisará do novo segredo de sessão se receber esse código no futuro.
