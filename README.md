# WFR RaceTech

Gestão de incidentes em provas de karting com **React + Vite**, **Node.js + Express**, **MVC** e **MongoDB + Mongoose**.

## Funcionalidades

- Login com JWT e perfis admin, operator e user.
- Criação, edição, eliminação e ordenação de incidentes, com hora, câmara, curva/posto, vídeo, Report, N.F.A., prioridade e observações.
- Numpad configurável sempre disponível na página principal, junto da tabela, com botões para toque e seleção direta de Curva/Posto/Camera. Atalhos 1–9, P (Start), R (Red Flag) e S (Slow Flag).
- Pesquisa por curva/posto, hora, observação ou câmara e filtro por corrida.
- Atualização automática a cada dois segundos sem recarregar a página ou fechar formulários.
- Exportação dos incidentes filtrados para Excel, com uma folha por corrida (Corrida 1, Corrida 2, etc.), ordenadas por número; a biblioteca é carregada apenas ao exportar.
- Configuração do evento, corrida atual, pontos de pista e observações predefinidas.
- Manifest e service worker para instalação como PWA. Não há gravação offline; os pedidos autenticados não são colocados em cache.

## Estrutura e MVC

```text
wfRacing/
├── client/
│   ├── public/              # Imagens, favicon e PWA
│   ├── src/
│   │   ├── components/      # Views React
│   │   ├── hooks/           # Consulta e atualização dos dados
│   │   ├── services/        # Cliente da API e exportação Excel
│   │   ├── App.jsx          # Sessão e controlo da corrida
│   │   └── main.jsx         # Entrada da aplicação
│   └── vite.config.mjs      # Build e proxy de desenvolvimento
├── server/src/
│   ├── config/             # Variáveis de ambiente
│   ├── controller/         # Controllers HTTP
│   ├── middleware/         # Autenticação, permissões e validação
│   ├── models/             # Models Mongoose
│   ├── services/           # Regras de negócio e validação do histórico
│   ├── routes/             # Endpoints da API
│   ├── utilities/          # JWT e hashing
│   └── app.js              # Configuração Express e ligação MongoDB
├── scripts/                # Criação de admin e verificação isolada
├── test/                   # Testes de integração
├── legacy/                 # HTML/JS anterior, não servido
├── .env.example            # Exemplo de configuração
├── package.json            # Dependências e comandos
└── server.js               # Entrada do backend
```

React assume a View. Express encaminha os pedidos para os Controllers e os Models persistem os dados. O backend nunca é carregado como script no navegador.

## Preparação

Requer Node.js **22.13 ou superior** e MongoDB local ou uma ligação MongoDB acessível.

Instale as dependências e crie a configuração local. Se já tiver um ficheiro `.env`, mantenha-o.

```powershell
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copie o segredo gerado para `JWT_SECRET` no `.env` e configure `MONGODB_URI` para a base existente:

```dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/local
JWT_SECRET=coloque_aqui_o_segredo_gerado
CORS_ORIGINS=
```

| Variável | Finalidade |
|---|---|
| `PORT` | Porta do servidor Express; 3000 por omissão |
| `MONGODB_URI` | Ligação à base MongoDB que pretende utilizar |
| `JWT_SECRET` | Segredo obrigatório com pelo menos 32 caracteres |
| `CORS_ORIGINS` | Origens adicionais autorizadas, separadas por vírgulas; opcional |

O .env é ignorado pelo Git e não deve ser publicado. PORT controla a porta da API. CORS_ORIGINS é opcional para origens adicionais; a interface usa a mesma origem em produção e um proxy em desenvolvimento.

Não se criam contas nem se apagam dados no arranque. Numa base vazia, crie o primeiro administrador explicitamente:

```powershell
npm run create-admin
```
 O comando pede nome e password; a password introduzida nesse terminal é visível. Também aceita ADMIN_USERNAME e ADMIN_PASSWORD no ambiente do processo. Não substitui contas existentes.

Novas contas através da API exigem um administrador autenticado. Na interface, o botão **Utilizadores** permite ao Admin listar, criar, editar e eliminar contas.

## Desenvolvimento

```powershell
npm run dev
```

Abra [a interface React](http://localhost:5173). Vite serve React e encaminha /api para Express na porta configurada (3000 por omissão). MongoDB tem de estar disponível. Não é necessário http-server, Live Server nem alterar IPs em scripts.

## Execução do build

```powershell
npm run build
npm start
```

Abra [a aplicação](http://localhost:3000), ou a porta configurada. Express serve client/dist e a API. run.bat executa npm start, pelo que o build deve existir. Os antigos caminhos /index.html, /admin.html e /cliente.html redirecionam para React.

## API e permissões

Os pedidos protegidos exigem Authorization: Bearer <token>; a autorização usa o perfil atual na base de dados.

| Recurso | Endpoints | Permissões |
|---|---|---|
| Sessão | POST /api/auth/login, POST /api/auth/logout, GET /api/auth/protected | Login público; consulta autenticada |
| Utilizadores | GET /api/auth/users, POST /api/auth/register, PUT /api/auth/edit/:id, DELETE /api/auth/delete/:id | Admin |
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

```powershell
npm test
npm audit
```
 npm test compila a interface e testa a API com MongoDB temporário, sem usar a base configurada. Na primeira execução, a ferramenta pode descarregar o binário MongoDB para testes.

Para verificar a interface com dados de teste isolados:

```powershell
npm run build
npm run verify:server
```

Abra [o servidor de verificação](http://127.0.0.1:3100). Este comando cria uma base temporária e contas admin, operator e user, com password testing-password, apenas nessa base. Não o use como servidor de produção. Termine com Ctrl+C.

A exportação Excel é carregada num ficheiro separado e pode produzir um aviso de tamanho de chunk no build.

## Comandos disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia React e backend em simultâneo |
| `npm run dev:client` | Inicia apenas Vite |
| `npm run dev:server` | Inicia apenas Express, com reinício automático |
| `npm run build` | Compila React para `client/dist` |
| `npm start` | Inicia Express e serve o build React |
| `npm run create-admin` | Cria uma conta de administrador na base configurada |
| `npm test` | Compila a interface e executa os testes de integração |
| `npm run verify:server` | Inicia o servidor isolado com dados temporários |
| `npm audit` | Consulta os avisos de segurança das dependências |

## Primeiro uso

1. Entre com uma conta existente ou com o administrador criado no terminal.
2. Em **Configurações**, indique o nome do evento, a corrida atual e o número de pontos de pista.
3. Acrescente observações predefinidas, se necessário.
4. Clique em **Start** ou prima **P** para registar imediatamente o início da corrida atual, com hora e número de corrida, sem abrir formulário. Um novo Start na mesma corrida só é permitido após Red Flag.
5. Registe os restantes incidentes pelo numpad ou pelo botão **Novo incidente**.
6. Consulte, edite e ordene os registos na tabela.
7. Aplique os filtros pretendidos e escolha **Exportar Excel** para descarregar esses registos.

## Resolução de problemas

| Problema | Verificação |
|---|---|
| Erro de `JWT_SECRET` ao iniciar | Confirme que o `.env` existe na raiz e contém um segredo com pelo menos 32 caracteres |
| Não é possível ligar ao MongoDB | Confirme `MONGODB_URI`, a disponibilidade do serviço e o acesso de rede |
| Mensagem para executar o build | Execute `npm run build` antes de `npm start` |
| Interface abre, mas a API falha em desenvolvimento | Confirme que o backend arrancou e que `PORT` corresponde à configuração local |
| Sem permissão numa operação | Confirme o perfil da conta; configurações exigem admin/operator e limpeza total exige admin |
| Login antigo deixa de funcionar após a migração | Faça novo login; o formato e segredo JWT anteriores não são reutilizados |
| Primeira execução dos testes demora | A ferramenta pode estar a descarregar ou a iniciar o MongoDB temporário |

A aplicação mantém os dados na base MongoDB escolhida. O servidor de verificação usa dados temporários; os seus registos não aparecem na base real.

## Nova corrida e histórico

O botão **+ Nova corrida**, junto dos controlos Start/Red Flag/Slow Flag, está disponível para admin e operator. Cria uma nova sessão na base de dados, escolhe o próximo número ainda não utilizado e muda a corrida atual do numpad. Mantém a configuração dos pontos de pista e todos os incidentes anteriores.

Ao criar a Corrida 2, a tabela passa a mostrar essa corrida vazia. Clique em **Start** ou prima **P** quando a prova começar. Os novos registos ficam associados à Corrida 2; para consultar a Corrida 1, selecione-a no filtro **Corrida**. A criação da nova sessão não regista um Start automaticamente e não exige Red Flag da corrida anterior: a regra de reinício é aplicada separadamente a cada número de corrida.

A API disponibiliza GET /api/races para listar as sessões criadas e POST /api/races/new com o corpo { "currentRace": 1 } para criar a próxima sessão. A criação exige admin/operator e rejeita pedidos com um número atual desatualizado. Não são inventadas sessões para registos históricos; esses registos continuam acessíveis pelo seu número de corrida.

## Validação de Start e reinício

- O primeiro Start é permitido numa corrida sem início registado.
- Um novo Start exige uma Red Flag da mesma corrida posterior ao último Start.
- Cada Red Flag permite um único reinício. Slow Flag, observações e Red Flag de outra corrida não autorizam novo Start.
- O botão Start fica indisponível enquanto a corrida está em curso. A tecla P segue a mesma regra.
- A API volta a validar o histórico atual, incluindo pedidos simultâneos de utilizadores no mesmo servidor Node.
- A ordem visual da tabela e a edição da hora não alteram a cronologia usada para esta validação.
- Editar, mover para outra corrida ou eliminar uma Red Flag que sustenta um reinício existente é bloqueado. É possível corrigir primeiro o reinício e depois a Red Flag.
- Registos históricos inválidos não são apagados ou corrigidos automaticamente; novas alterações não podem acrescentar reinícios inválidos.

Esta validação verifica o pré-requisito pedido para o registo de um reinício. Não decide se a prova deve ser retomada: essa decisão e o procedimento aplicável pertencem à direção da prova, de acordo com o regulamento da competição. Referência: [Prescrições Gerais FIA Karting 2024, artigos 2.21 e 2.22](https://www.fiakarting.com/sites/default/files/2024-01/4.1_Pr%C3%A9pa%20PG2024.pdf).

## Gestão de utilizadores

Entre como Admin e clique em **Utilizadores** na barra principal. Pode criar contas com perfil Admin, Operador ou Utilizador; editar o nome e o perfil; definir uma nova password; e eliminar contas.

Na edição, deixar a password vazia mantém a atual. Alterar a password termina as sessões anteriores dessa conta; se alterar a sua própria password, terá de entrar novamente. Não é possível eliminar a própria conta, retirar o próprio perfil Admin ou deixar a aplicação sem administradores. Passwords e hashes nunca são devolvidos na listagem da API.

O administrador inicial da base real é criado com npm run create-admin. As contas do servidor temporário de testes não são transferidas automaticamente para a base real. Quando existe um ficheiro .local/admin-access.txt, este contém credenciais iniciais locais e é excluído do Git, tal como os logs nessa pasta.

## Teclado no popup de incidente

- Enter nos campos de entrada valida e guarda o registo. Quando o foco está na caixa de observações, Enter insere uma nova linha sem guardar. Campos obrigatórios, número de corrida e formato da hora são validados antes do envio.
- Esc ou Delete cancela o popup sem guardar, incluindo durante a edição de um registo.
- Shift+Enter permite uma nova linha nas observações.
- Enquanto uma gravação está em curso, teclas repetidas não criam novos pedidos nem cancelam a operação já enviada.
