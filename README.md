# WFR RaceTech

Gestão de incidentes em provas de karting com **React + Vite**, **Node.js + Express**, **MVC** e **MongoDB + Mongoose**.

## Funcionalidades

- Login com JWT e perfis admin, operator e user.
- Criação, edição, eliminação e ordenação de incidentes, com hora, câmara, curva/posto, vídeo, Report, N.F.A., prioridade e observações.
- Numpad configurável e atalhos 1–9, P (Start), R (Red Flag) e S (Slow Flag).
- Pesquisa por curva/posto, hora, observação ou câmara e filtro por corrida.
- Atualização automática a cada dois segundos sem recarregar a página ou fechar formulários.
- Exportação dos incidentes filtrados para Excel; a biblioteca é carregada apenas ao exportar.
- Configuração do evento, corrida atual, pontos de pista e observações predefinidas.
- Manifest e service worker para instalação como PWA. Não há gravação offline; os pedidos autenticados não são colocados em cache.

## Estrutura e MVC

- client/src/components: Views React — login, tabela, numpad, formulários e configurações.
- client/src/hooks: consulta e atualização dos dados.
- client/src/services: cliente da API e exportação Excel.
- client/public: imagens, favicon e PWA.
- server/src/routes: API REST sob /api.
- server/src/controller: Controllers HTTP.
- server/src/models: Models Mongoose.
- server/src/config, middleware e utilities: ambiente, autenticação, permissões, validação e JWT.
- scripts e test: criação de administrador e testes com MongoDB temporário.
- legacy: código HTML/JS anterior, guardado como referência e não servido.

React assume a View. Express encaminha os pedidos para os Controllers e os Models persistem os dados. O backend nunca é carregado como script no navegador.

## Preparação

Requer Node.js **22.13 ou superior** e MongoDB local ou uma ligação MongoDB acessível.

1. Execute npm ci.
2. Copie .env.example para .env (PowerShell: Copy-Item .env.example .env).
3. Gere um segredo: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))".
4. Coloque o valor gerado em JWT_SECRET no .env.
5. Configure MONGODB_URI para a base existente. O exemplo mantém mongodb://127.0.0.1:27017/local.

O .env é ignorado pelo Git e não deve ser publicado. PORT controla a porta da API. CORS_ORIGINS é opcional para origens adicionais; a interface usa a mesma origem em produção e um proxy em desenvolvimento.

Não se criam contas nem se apagam dados no arranque. Numa base vazia, execute **npm run create-admin** para criar o primeiro administrador explicitamente. O comando pede nome e password; a password introduzida nesse terminal é visível. Também aceita ADMIN_USERNAME e ADMIN_PASSWORD no ambiente do processo. Não substitui contas existentes.

Novas contas através da API exigem um administrador autenticado. A listagem de utilizadores, marcada WIP no projeto original, não faz parte da interface convertida.

## Desenvolvimento

Execute **npm run dev** e abra http://localhost:5173. Vite serve React e encaminha /api para Express na porta configurada (3000 por omissão). MongoDB tem de estar disponível. Não é necessário http-server, Live Server nem alterar IPs em scripts.

## Execução do build

Execute **npm run build** e depois **npm start**. Abra http://localhost:3000 (ou a porta configurada). Express serve client/dist e a API. run.bat executa npm start, pelo que o build deve existir. Os antigos caminhos /index.html, /admin.html e /cliente.html redirecionam para React.

## API e permissões

Os pedidos protegidos exigem Authorization: Bearer <token>; a autorização usa o perfil atual na base de dados.

| Recurso | Endpoints | Permissões |
|---|---|---|
| Sessão | POST /api/auth/login, POST /api/auth/logout, GET /api/auth/protected | Login público; consulta autenticada |
| Utilizadores | POST /api/auth/register, PUT /api/auth/edit/:id, DELETE /api/auth/delete/:id | Admin |
| Incidentes | GET/POST /api/incidents, PATCH/DELETE /api/incidents/:id, POST /api/incidents/reorder | Admin, operator e user |
| Limpeza de incidentes | DELETE /api/incidents | Admin |
| Numpad | GET/POST /api/settings, PATCH /api/settings/:id | Leitura autenticada; escrita admin/operator |
| Observações | GET/POST /api/observations, PATCH/DELETE /api/observations/:id | Leitura autenticada; escrita admin/operator |
| Evento | GET /api/races/current, POST /api/races | Leitura autenticada; escrita admin/operator |
| Estado | GET /health | Público; 200 com MongoDB ligado, 503 sem ligação |

O logout remove a sessão do navegador. Os JWT emitidos expiram em 24 horas; a eliminação da conta torna o token inválido. As sessões antigas exigem novo login após a alteração do segredo/formato JWT.

## Compatibilidade dos dados

Mantêm-se os nomes das coleções (users, wfrs, races, numpadNumbers, obsOptions) e os campos existentes. Não há importação automática, limpeza ou mudança de base. indice permite ordenar incidentes preservando o ID e conteúdo; documentos antigos sem índice continuam a ser lidos e recebem uma posição quando se pede uma reordenação. Faça uma cópia de segurança da base antes de usar a nova versão com dados reais.

## Verificação

Execute **npm test** e **npm audit**. npm test compila a interface e testa a API com MongoDB temporário, sem usar a base configurada. Na primeira execução, a ferramenta pode descarregar o binário MongoDB para testes.

Para verificar a interface com dados de teste isolados, execute npm run build e npm run verify:server e abra http://127.0.0.1:3100. Este comando cria uma base temporária e contas admin, operator e user, com password testing-password, apenas nessa base. Não o use como servidor de produção. Termine com Ctrl+C.

A exportação Excel é carregada num ficheiro separado e pode produzir um aviso de tamanho de chunk no build.
