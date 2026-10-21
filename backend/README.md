# ToDoList Backend

API REST de lista de tarefas construída com Fastify e MySQL.

## Requisitos

- Node.js 18+
- MySQL 8 (via Docker, XAMPP, WAMP ou standalone)

## Como rodar

### 1. Suba o MySQL

A forma mais simples é usar o Docker, com o `docker-compose.yml` da raiz do projeto
(já aplica o `schema.sql` automaticamente na primeira criação do container):

```bash
sudo docker compose up -d
```

Para derrubar o container (mantendo os dados):

```bash
sudo docker compose down
```

Para recriar do zero, apagando o volume:

```bash
sudo docker compose down -v && sudo docker compose up -d
```

Se preferir o MySQL do XAMPP/WAMP ou um MySQL instalado no sistema, pule esta etapa
e use o passo 2 normalmente.

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o `.env`

Ajuste o arquivo `.env` com os dados do seu MySQL:

```env
PORT=3333
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=todolist
CORS_ORIGIN=http://localhost:5173
```

> No XAMPP o usuário `root` normalmente não tem senha — deixe `DB_PASSWORD=` vazio.
> Use `127.0.0.1` (e não `localhost`) para o Node não tentar o IPv6 `::1` primeiro.
> Com o Docker do projeto, `root` sem senha já funciona como está.

### 4. Inicie o servidor

```bash
npm run dev
```

O servidor sobe em `http://localhost:3333`.

> Se o MySQL estiver parado, a API responde `503` com a mensagem
> "Banco de dados indisponível..." — o frontend mostra o aviso na tela.

## Rotas

| Método | Rota                | Descrição                        |
|--------|---------------------|----------------------------------|
| GET    | `/health`           | Verifica se a API está no ar     |
| GET    | `/api/tasks`        | Lista tarefas (com `?search=` e `?status=pending\|completed`) |
| POST   | `/api/tasks`        | Cria tarefa `{ title, dueDate? }` |
| PATCH  | `/api/tasks/:id`    | Atualiza `{ completed?, title?, dueDate? }` |
| DELETE | `/api/tasks/:id`    | Exclui tarefa                     |

## Testar as rotas

Abra o arquivo `rotas.http` no VS Code com a extensão **REST Client** e clique em "Send Request", ou use `curl`:

```bash
curl http://localhost:3333/health

curl -X POST http://localhost:3333/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Minha tarefa"}'
```

## Estrutura

```
src/
├── server.js         # Configuração e inicialização do Fastify
├── db.js             # Pool de conexões com o MySQL
└── routes/tasks.js   # Rotas CRUD de tarefas
```