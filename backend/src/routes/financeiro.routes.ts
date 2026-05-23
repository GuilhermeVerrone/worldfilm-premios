import { Router } from 'express';
import { authenticateAdmin, authenticateVendedor } from '../middlewares/authenticate';
import { uploadComprovante } from '../middlewares/upload';
import * as vendedorCtrl from '../controllers/financeiro.controller';
import * as adminCtrl from '../controllers/financeiro.admin.controller';

const router = Router();

// Vendedor
router.get('/financeiro/saldo', authenticateVendedor, vendedorCtrl.getSaldo);
router.post('/financeiro/solicitar', authenticateVendedor, vendedorCtrl.solicitar);
router.get('/financeiro/extrato', authenticateVendedor, vendedorCtrl.getExtrato);

// Admin — relatorio antes de /:id para não ser capturado como parâmetro
router.get('/admin/financeiro/relatorio', authenticateAdmin, adminCtrl.relatorio);
router.get('/admin/financeiro/solicitacoes', authenticateAdmin, adminCtrl.listSolicitacoes);
router.get('/admin/financeiro/solicitacoes/:id', authenticateAdmin, adminCtrl.getSolicitacaoById);
router.get('/admin/financeiro/solicitacoes/:id/comprovante', authenticateAdmin, adminCtrl.getComprovante);
router.patch('/admin/financeiro/solicitacoes/:id/processar', authenticateAdmin, adminCtrl.processar);
router.patch(
  '/admin/financeiro/solicitacoes/:id/pagar',
  authenticateAdmin,
  uploadComprovante.single('comprovante'),
  adminCtrl.pagar,
);

export default router;
