import { Router } from 'express';
import { body, param } from 'express-validator';
import { votingRecordController } from '../controllers/votingRecordController';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/candidate/:candidateId', votingRecordController.getByCandidate);
router.get('/bill/:billId', votingRecordController.getByBill);
router.get('/comparison/:candidateId/:stanceId', votingRecordController.getComparison);
router.get('/comparison/:candidateId', votingRecordController.getAllComparisons);

// Admin routes
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'MODERATOR'),
  validate([
    body('candidateId').notEmpty(),
    body('billId').notEmpty(),
    body('vote').isIn(['YES', 'NO', 'ABSTAIN', 'ABSENT', 'PRESENT', 'NOT_VOTING']),
    body('voteDate').isISO8601().toDate(),
    body('rollCallNum').optional(),
    body('sourceUrl').isURL(),
  ]),
  votingRecordController.create
);

router.post(
  '/bulk',
  authenticate,
  requireRole('ADMIN'),
  validate([
    body('records').isArray(),
  ]),
  votingRecordController.bulkCreate
);

export default router;
