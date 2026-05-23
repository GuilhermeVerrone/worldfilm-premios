import { Router } from 'express';
import { authenticateAdmin, authenticateVendedor } from '../middlewares/authenticate';
import * as ctrl from '../controllers/notificacoes.controller';

const router = Router();

// Vendedor — rotas estáticas antes de /:id
router.get('/notificacoes/nao-lidas/count', authenticateVendedor, ctrl.countNaoLidas);
router.patch('/notificacoes/todas-lidas', authenticateVendedor, ctrl.marcarTodasLidas);
router.get('/notificacoes', authenticateVendedor, ctrl.listNotificacoes);
router.patch('/notificacoes/:id/lida', authenticateVendedor, ctrl.marcarLida);

// Admin
router.get('/admin/notificacoes/historico', authenticateAdmin, ctrl.historicoNotificacoes);
router.post('/admin/notificacoes/enviar', authenticateAdmin, ctrl.enviarManual);

export default router;
