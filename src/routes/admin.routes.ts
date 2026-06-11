import { Router } from 'express';
import { getDashboardStats, getAllOrders, updateOrderStatus, getAllUsers, approveWholesaleUser } from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// All routes require Admin privileges
router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', getAllUsers);
router.put('/users/:id/wholesale', approveWholesaleUser);

export default router;
