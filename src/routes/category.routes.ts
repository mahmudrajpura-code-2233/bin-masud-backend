import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/category.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getCategories);
router.post('/', authenticate, requireAdmin, createCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;
