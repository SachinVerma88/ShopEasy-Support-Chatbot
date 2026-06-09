import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import chatRoutes from './routes/chat.routes';
import { errorHandler } from './middleware/errorHandler';
import { disconnectDb } from './db';

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(morgan('dev'));
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/chat', chatRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function shutdown(): Promise<void> {
  console.log('Shutting down gracefully...');
  server.close();
  await disconnectDb();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
