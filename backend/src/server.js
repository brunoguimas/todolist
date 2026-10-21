import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import tasksRoutes from './routes/tasks.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
});

app.get('/health', async () => ({ status: 'ok' }));

// Erros de banco viravam 500 sem corpo; agora a API responde algo legível
// e o frontend consegue mostrar a mensagem na tela.
const DB_ERROR_CODES = ['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'PROTOCOL_CONNECTION_LOST', 'ENOTFOUND'];

app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'erro ao processar a requisição');

  const isDbError =
    DB_ERROR_CODES.includes(error.code) ||
    (Array.isArray(error.aggregateErrors) &&
      error.aggregateErrors.some((err) => DB_ERROR_CODES.includes(err.code)));

  if (isDbError) {
    return reply.status(503).send({
      message:
        'Banco de dados indisponível. Verifique se o MySQL está rodando (docker compose up -d) e as credenciais do .env.',
    });
  }

  const status = error.statusCode >= 400 ? error.statusCode : 500;
  return reply.status(status).send({
    message: error.message || 'Erro interno do servidor.',
  });
});

await app.register(tasksRoutes);

const port = Number(process.env.PORT) || 3333;

try {
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Servidor rodando em http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
