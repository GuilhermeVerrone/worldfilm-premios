import 'dotenv/config';
import { validateEnv, env } from './utils/env';

validateEnv();

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/auth.routes';
import distribuidoresRoutes from './routes/distribuidores.routes';
import { listPublic as distribuidoresListPublic } from './controllers/distribuidores.controller';
import vendedoresRoutes from './routes/vendedores.routes';
import produtosRoutes from './routes/produtos.routes';
import campanhasRoutes from './routes/campanhas.routes';
import vendasRoutes from './routes/vendas.routes';
import financeiroRoutes from './routes/financeiro.routes';
import notificacoesRoutes from './routes/notificacoes.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import { startJobs } from './jobs/liberarSaldo.job';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(env.uploadPath)));

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', env: env.nodeEnv }));

app.use('/auth', authRoutes);
app.get('/distribuidores/lista-publica', distribuidoresListPublic);
app.use('/admin/distribuidores', distribuidoresRoutes);
app.use('/', vendedoresRoutes);
app.use('/', produtosRoutes);
app.use('/', campanhasRoutes);
app.use('/', vendasRoutes);
app.use('/', financeiroRoutes);
app.use('/', notificacoesRoutes);
app.use('/', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[server] Running on port ${env.port} (${env.nodeEnv})`);
  if (env.nodeEnv !== 'test') startJobs();
});

export default app;
