import { Router } from 'express';
import { getProductReviews, createReview } from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, createReview);

export default router;
