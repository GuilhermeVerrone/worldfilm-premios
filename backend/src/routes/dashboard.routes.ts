import { Router } from 'express';
import { authenticateAdmin } from '../middlewares/authenticate';
import { getDashboard, getDashboardResumo } from '../controllers/dashboard.controller';

const router = Router();

router.get('/admin/dashboard', authenticateAdmin, getDashboard);
router.get('/admin/dashboard/resumo', authenticateAdmin, getDashboardResumo);

export default router;
