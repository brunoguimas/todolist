# ToDoList

Aplicação de lista de tarefas dividida em duas partes:

| Pasta      | Stack                    | Descrição                              |
|------------|--------------------------|----------------------------------------|
| `backend/` | Fastify + MySQL (mysql2) | API REST de tarefas                    |
| `frontend/`| React 19 + Vite          | Interface da lista de tarefas           |

## Como rodar

### 1. Banco de dados (MySQL via Docker)

Na raiz do projeto:

```bash
sudo docker compose up -d
```

O container `todolist-mysql` sobe na porta `3306`, cria o banco `todolist` e aplica
o `backend/schema.sql` automaticamente.

### 2. Backend (porta `3333`)

```bash
cd backend
npm install
npm run dev
```

Detalhes em [`backend/README.md`](backend/README.md).

### 3. Frontend (porta `5173`)

```bash
cd frontend
npm install
npm run dev
```

Detalhes em [`frontend/README.md`](frontend/README.md).

O backend já libera o CORS para `http://localhost:5173`, então as duas aplicações conversam direto.

## API

| Método   | Rota               | Descrição                                   |
|----------|--------------------|---------------------------------------------|
| `GET`    | `/health`          | Verifica se a API está no ar                |
| `GET`    | `/api/tasks`       | Lista tarefas (com `?search=` e `?status=`) |
| `POST`   | `/api/tasks`       | Cria tarefa `{ title, dueDate? }`           |
| `PATCH`  | `/api/tasks/:id`   | Atualiza `{ completed?, title?, dueDate? }`  |
| `DELETE` | `/api/tasks/:id`   | Exclui tarefa                                |
