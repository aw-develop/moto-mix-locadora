# Rotas administrativas

As rotas `/admin/dashboard`, `/admin/motos`, `/admin/banners` e `/admin/configuracoes` são lazy-loaded. A aplicação consulta `/api/session` antes de iniciar a navegação. Apenas uma identidade autorizada pode entrar no painel. Visitantes são direcionados a `/admin/login`, que inicia a autenticação do Sites no nível superior do navegador.

Toda gravação exige autorização novamente no Worker, independentemente dos guards Angular. O estado é persistido em D1 e as imagens em R2.
