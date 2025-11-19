import { Router } from 'express';
import { body, param } from 'express-validator';
import { stanceController } from '../controllers/stanceController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', stanceController.getAll);
router.get('/categories', stanceController.getCategories);
router.get('/category/:category', stanceController.getByCategory);
router.get('/:id', stanceController.getById);

// Admin routes
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validate([
    body('category').notEmpty().trim(),
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('order').optional().isInt(),
  ]),
  stanceController.create
);

router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate([
    param('id').isString(),
    body('category').optional().trim(),
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('order').optional().isInt(),
    body('isActive').optional().isBoolean(),
  ]),
  stanceController.update
);

export default router;
