import express from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getDeck,
  recordAction,
  getShortlist,
  removeFromShortlist,
  updateNotes,
  getAnalytics,
} from '../controllers/swipeController';

const router = express.Router();

// Swipe deck routes
router.get('/deck', requireAuth, getDeck);
router.post('/action', requireAuth, recordAction);

// Shortlist routes
router.get('/shortlist', requireAuth, getShortlist);
router.delete('/shortlist/:candidateId', requireAuth, removeFromShortlist);
router.put('/shortlist/:candidateId/notes', requireAuth, updateNotes);

// Analytics (admin only)
router.get('/analytics/:candidateId', requireAuth, getAnalytics);

export default router;
