import { Router } from 'express';
import { createOrder, getMyOrders, verifyPayment, getOrderById } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Guest checkout is allowed for createOrder, but getMyOrders requires auth
// If using authentication logic in createOrder, we can use an optionalAuth middleware.
// For now, we will assume authenticate is optional for creating an order (handled in controller).

router.post('/', createOrder); // Create an order (and razorpay instance)
router.post('/verify-payment', verifyPayment); // Verify razorpay payment and deduct stock
router.get('/my-orders', authenticate, getMyOrders); // Get past orders for logged in user
router.get('/:id', authenticate, getOrderById); // Get specific order by ID

export default router;
