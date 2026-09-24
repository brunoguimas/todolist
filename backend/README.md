# ToDoList Backend

API REST de lista de tarefas construída com Fastify e MySQL.

## Requisitos

- Node.js 18+
- MySQL (XAMPP, WAMP ou standalone)

## Como rodar

### 1. Crie o banco de dados

Com o MySQL ativo, rode o script `schema.sql`:

```bash
mysql -u root -p < schema.sql
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o `.env`

Ajuste o arquivo `.env` com os dados do seu MySQL:

```env
PORT=3333
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=todolist
CORS_ORIGIN=http://localhost:5173
```

> No XAMPP o usuário `root` normalmente não tem senha — deixe `DB_PASSWORD=` vazio.

### 4. Inicie o servidor

```bash
npm run dev
```

O servidor sobe em `http://localhost:3333`.

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