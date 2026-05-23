import { Router } from 'express';
import * as adminAuth from '../controllers/auth.admin.controller';
import * as vendedorAuth from '../controllers/auth.vendedor.controller';
import { unifiedLogin } from '../controllers/auth.unified.controller';

const router = Router();

router.post('/login', unifiedLogin);

router.post('/admin/login', adminAuth.login);
router.post('/admin/refresh', adminAuth.refresh);
router.post('/admin/logout', adminAuth.logout);

router.post('/vendedor/register', vendedorAuth.register);
router.post('/vendedor/login', vendedorAuth.login);
router.post('/vendedor/refresh', vendedorAuth.refresh);
router.post('/vendedor/logout', vendedorAuth.logout);
router.post('/vendedor/recover', vendedorAuth.recover);
router.post('/vendedor/reset-password', vendedorAuth.resetPassword);

export default router;
