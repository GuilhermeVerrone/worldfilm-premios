import { Router } from 'express';
import { authenticateAdmin } from '../middlewares/authenticate';
import * as ctrl from '../controllers/distribuidores.controller';

const router = Router();

router.use(authenticateAdmin);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.updateStatus);

export default router;
