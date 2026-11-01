# Acesso administrativo

As páginas administrativas usam lazy loading, guards Angular que consultam `/api/session` a cada navegação e um bloqueio no Worker antes da entrega do documento. Sessões ausentes ou expiradas são encaminhadas ao login; falhas de verificação bloqueiam o acesso. O login por senha permanece público para permitir a autenticação.

Os endpoints protegidos validam a autorização em cada requisição. Modificar flags no navegador não concede permissão à API. As páginas administrativas recebem `noindex, nofollow, noarchive, nosnippet` e `no-store`.

O site público não anuncia o link do painel. O endereço pode ser inferido pelos arquivos do frontend ou pelo repositório público, por isso não é tratado como segredo de segurança.
