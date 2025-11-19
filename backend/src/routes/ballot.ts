import express from 'express';
import {
  getBallotPreview,
  saveBallotPreview,
  getSavedBallotPreviews,
  getBallotPreviewById,
  deleteBallotPreview,
  getUpcomingElections,
  createElectionReminder,
  getElectionReminders,
  deleteElectionReminder,
  getBallotGuide,
} from '../controllers/ballotController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Ballot Routes
 *
 * Public routes:
 * - GET /api/ballot/preview - Get ballot preview for address
 * - GET /api/ballot/elections - Get upcoming elections
 *
 * Protected routes (require authentication):
 * - POST /api/ballot/save - Save ballot preview
 * - GET /api/ballot/saved - Get user's saved ballot previews
 * - GET /api/ballot/saved/:id - Get specific ballot preview
 * - DELETE /api/ballot/saved/:id - Delete ballot preview
 * - POST /api/ballot/reminder - Create election reminder
 * - GET /api/ballot/reminders - Get user's election reminders
 * - DELETE /api/ballot/reminder/:id - Delete election reminder
 * - GET /api/ballot/guide/:id - Get ballot guide summary
 */

// Public routes (no authentication required)
router.get('/preview', getBallotPreview);
router.get('/elections', getUpcomingElections);

// Protected routes (authentication required)
router.post('/save', authenticate, saveBallotPreview);
router.get('/saved', authenticate, getSavedBallotPreviews);
router.get('/saved/:id', authenticate, getBallotPreviewById);
router.delete('/saved/:id', authenticate, deleteBallotPreview);

router.post('/reminder', authenticate, createElectionReminder);
router.get('/reminders', authenticate, getElectionReminders);
router.delete('/reminder/:id', authenticate, deleteElectionReminder);

router.get('/guide/:id', authenticate, getBallotGuide);

export default router;
