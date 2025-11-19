import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').optional().trim(),
    body('zipCode').optional().trim(),
  ]),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  authController.login
);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

router.put(
  '/profile',
  authenticate,
  validate([
    body('name').optional().trim(),
    body('location').optional().trim(),
    body('zipCode').optional().trim(),
  ]),
  authController.updateProfile
);

export default router;
