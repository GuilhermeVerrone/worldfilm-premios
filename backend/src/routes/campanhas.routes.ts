import { Router } from 'express';
import { authenticateAdmin, authenticateVendedor } from '../middlewares/authenticate';
import * as ctrl from '../controllers/campanhas.controller';

const router = Router();

router.get('/admin/campanhas', authenticateAdmin, ctrl.adminList);
router.get('/admin/campanhas/:id', authenticateAdmin, ctrl.adminGetById);
router.post('/admin/campanhas', authenticateAdmin, ctrl.create);
router.put('/admin/campanhas/:id', authenticateAdmin, ctrl.update);
router.patch('/admin/campanhas/:id/status', authenticateAdmin, ctrl.updateStatus);

router.get('/campanhas', authenticateVendedor, ctrl.vendedorList);
router.get('/campanhas/:id', authenticateVendedor, ctrl.vendedorGetById);

export default router;
