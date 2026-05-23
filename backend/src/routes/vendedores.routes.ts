import { Router } from 'express';
import { authenticateAdmin, authenticateVendedor } from '../middlewares/authenticate';
import * as ctrl from '../controllers/vendedores.controller';

const router = Router();

// Admin routes
router.get('/admin/vendedores', authenticateAdmin, ctrl.adminList);
router.get('/admin/vendedores/:id', authenticateAdmin, ctrl.adminGetById);
router.patch('/admin/vendedores/:id/aprovar', authenticateAdmin, ctrl.aprovar);
router.patch('/admin/vendedores/:id/reprovar', authenticateAdmin, ctrl.reprovar);
router.patch('/admin/vendedores/:id/bloquear', authenticateAdmin, ctrl.bloquear);
router.patch('/admin/vendedores/:id/desbloquear', authenticateAdmin, ctrl.desbloquear);
router.patch('/admin/vendedores/:id/role', authenticateAdmin, ctrl.changeRole);

// Vendedor (self) routes
router.get('/vendedor/resumo-mes', authenticateVendedor, ctrl.resumoMes);
router.get('/vendedor/perfil', authenticateVendedor, ctrl.getPerfil);
router.put('/vendedor/perfil', authenticateVendedor, ctrl.updatePerfil);
router.put('/vendedor/senha', authenticateVendedor, ctrl.updateSenha);
router.put('/vendedor/fcm-token', authenticateVendedor, ctrl.updateFcmToken);

export default router;
