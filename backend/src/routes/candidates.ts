import { Router } from 'express';
import { body, param } from 'express-validator';
import { candidateController } from '../controllers/candidateController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { submissionLimiter, searchLimiter } from '../middleware/rateLimit';

const router = Router();

// Public routes
router.get('/', searchLimiter, candidateController.search);
router.get('/:id', candidateController.getById);

// Candidate submission
router.post(
  '/',
  submissionLimiter,
  validate([
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('website').optional().isURL(),
    body('office').notEmpty().trim(),
    body('district').optional().trim(),
    body('state').notEmpty().trim(),
    body('city').optional().trim(),
    body('county').optional().trim(),
    body('electionDate').optional().isISO8601().toDate(),
    body('bio').notEmpty().isLength({ max: 6000 }),
    body('goals').notEmpty().isLength({ max: 3000 }),
    body('reasonForRunning').notEmpty().isLength({ max: 2000 }),
    body('isIncumbent').optional().isBoolean(),
  ]),
  candidateController.create
);

// Protected candidate routes
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isString(),
    body('bio').optional().isLength({ max: 6000 }),
    body('goals').optional().isLength({ max: 3000 }),
    body('reasonForRunning').optional().isLength({ max: 2000 }),
  ]),
  candidateController.update
);

router.post(
  '/:id/stances',
  authenticate,
  validate([
    param('id').isString(),
    body('stanceId').notEmpty(),
    body('position').notEmpty().trim(),
    body('sourceUrl').optional().isURL(),
  ]),
  candidateController.addStance
);

router.put(
  '/:id/stances/:stanceId',
  authenticate,
  validate([
    param('id').isString(),
    param('stanceId').isString(),
    body('position').notEmpty().trim(),
    body('sourceUrl').optional().isURL(),
  ]),
  candidateController.updateStance
);

// Admin routes
router.get(
  '/admin/pending',
  authenticate,
  requireRole('ADMIN', 'MODERATOR'),
  candidateController.getPending
);

router.put(
  '/:id/verification',
  authenticate,
  requireRole('ADMIN', 'MODERATOR'),
  validate([
    param('id').isString(),
    body('status').isIn(['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED']),
  ]),
  candidateController.updateVerification
);

export default router;
