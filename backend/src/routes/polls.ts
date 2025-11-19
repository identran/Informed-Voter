import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  respondToPoll,
  getAggregatePollData,
  getTrends,
  getTopCandidates,
  checkUserResponse,
  getUserResponses,
} from '../controllers/pollingController';

const router = express.Router();

// Public routes (no auth required)
router.get('/aggregate/:candidateId', getAggregatePollData); // Public poll data
router.get('/top/:state', getTopCandidates); // Top candidates by state

// Protected routes (auth required)
router.post('/respond', authenticate, respondToPoll);
router.get('/check/:candidateId', authenticate, checkUserResponse);
router.get('/user-responses', authenticate, getUserResponses);

// Admin routes (auth required, admin check in controller)
router.get('/trends/:candidateId', authenticate, getTrends);

export default router;
