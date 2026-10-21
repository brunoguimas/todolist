# ToDoList Frontend

Interface da lista de tarefas, construída com **React + Vite**, consumindo a API Fastify que fica em `../backend`.

## Requisitos

- Node.js 18+
- A API do backend rodando em `http://localhost:3333` (veja `../backend/README.md`)

## Como rodar

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure a URL da API (opcional)

O padrão já é `http://localhost:3333`. Para alterar, copie o exemplo e edite:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3333
```

### 3. Inicie o servidor

```bash
npm run dev
```

A interface fica disponível em `http://localhost:5173`.

## Scripts

| Script            | Descrição                                  |
|-------------------|--------------------------------------------|
| `npm run dev`     | Servidor de desenvolvimento com HMR         |
| `npm run build`   | Gera a versão de produção em `dist/`        |
| `npm run preview` | Serve localmente o build de produção       |
| `npm run lint`    | Lint (oxlint)                              |
| `npm test`        | Testes (Vitest + Testing Library + jsdom)  |

## Funcionalidades

- **Listagem** com contadores de total, concluídas e pendentes (mais uma barra de progresso).
- **Criação** de tarefas pelo modal `Create Task` (botão flutuante `+` no canto inferior direito), com data limite opcional.
- **Edição** de tarefas pelo modal `Edit Task`, aberto com o botão de lápis de cada item.
- **Exclusão** de tarefas pelo botão da lixeira (com confirmação).
- **Concluir/desfazer** com checkbox de gradiente (atualização otimista na interface).
- **Busca em tempo real com debounce** de 300 ms — a requisição só é enviada quando o usuário para de digitar.
- **Ordenação automática**: tarefas com a data mais próxima primeiro; tarefas sem prazo no fim.
- **Prazos em atraso**: título em vermelho e selo `Em atraso` quando a data já passou e a tarefa continua pendente.
- **Ações no hover**: os botões de editar e excluir aparecem ao passar o mouse sobre o item.
- **Estado vazio** com o texto `You have no pending tasks.`.

## Estrutura

```
src/
├── api/tasks.js            # Cliente HTTP da API (fetch + tratamento de erros)
├── hooks/
│   ├── useDebouncedValue.js # Debounce genérico (300 ms na busca)
│   └── useTasks.js          # Estado das tarefas: carga, busca, contadores e mutações
├── utils/
│   ├── date.js              # Datas: normalização, atraso e formatação
│   └── tasks.js             # Normalização dos registros e ordenação
├── components/
│   ├── Checkbox.jsx         # Checkbox com gradiente
│   ├── ConfirmDialog.jsx    # Confirmação de exclusão
│   ├── EmptyState.jsx       # "You have no pending tasks."
│   ├── Fab.jsx              # Botão flutuante "+"
│   ├── SearchBar.jsx        # Campo de busca
│   ├── StatsBar.jsx         # Contadores de total / concluídas / pendentes
│   ├── TaskItem.jsx         # Item da lista
│   ├── TaskModal.jsx        # Modal "Create Task" / "Edit Task"
│   └── icons.jsx            # Ícones em SVG
├── App.jsx                  # Layout e orquestração
├── index.css                # Estilos (design tokens, light theme)
└── main.jsx                 # Ponto de entrada
```

## API consumida

| Método   | Rota               | Uso no frontend                              |
|----------|--------------------|----------------------------------------------|
| `GET`    | `/api/tasks`       | Lista com `?search=` (contadores inclusos)   |
| `POST`   | `/api/tasks`       | Criar tarefa (`title`, `dueDate?`)           |
| `PATCH`  | `/api/tasks/:id`   | Editar/concluir (`title`, `dueDate`, `completed`) |
| `DELETE` | `/api/tasks/:id`   | Excluir tarefa                               |
