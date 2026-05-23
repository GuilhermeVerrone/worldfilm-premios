import { Router } from 'express';
import { authenticateAdmin, authenticateVendedor } from '../middlewares/authenticate';
import * as vendedorCtrl from '../controllers/vendas.controller';
import * as adminCtrl from '../controllers/vendas.admin.controller';

const router = Router();

// Vendedor
router.post('/vendas', authenticateVendedor, vendedorCtrl.createVenda);
router.get('/vendas', authenticateVendedor, vendedorCtrl.listVendas);
router.get('/vendas/:id', authenticateVendedor, vendedorCtrl.getVendaById);

// Admin — exportar deve vir antes de /:id para não ser capturado como parâmetro
router.get('/admin/vendas/exportar', authenticateAdmin, adminCtrl.exportar);
router.get('/admin/vendas', authenticateAdmin, adminCtrl.adminList);
router.get('/admin/vendas/:id', authenticateAdmin, adminCtrl.adminGetById);
router.patch('/admin/vendas/:id/aprovar', authenticateAdmin, adminCtrl.aprovar);
router.patch('/admin/vendas/:id/reprovar', authenticateAdmin, adminCtrl.reprovar);
router.patch('/admin/vendas/:id/solicitar-revisao', authenticateAdmin, adminCtrl.solicitarRevisao);

// Transações
router.patch('/admin/transacoes/:id/liberar', authenticateAdmin, adminCtrl.liberarTransacao);

export default router;
