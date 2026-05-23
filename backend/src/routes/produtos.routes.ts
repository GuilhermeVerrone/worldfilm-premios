import { Router } from 'express';
import { authenticateAdmin, authenticateVendedor } from '../middlewares/authenticate';
import * as ctrl from '../controllers/produtos.controller';

const router = Router();

router.get('/admin/produtos', authenticateAdmin, ctrl.adminList);
router.get('/admin/produtos/:id', authenticateAdmin, ctrl.adminGetById);
router.post('/admin/produtos', authenticateAdmin, ctrl.create);
router.put('/admin/produtos/:id', authenticateAdmin, ctrl.update);
router.patch('/admin/produtos/:id/status', authenticateAdmin, ctrl.updateStatus);

router.get('/produtos', authenticateVendedor, ctrl.vendedorList);

export default router;
