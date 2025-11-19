import express from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getQuestions,
  startSurvey,
  saveResponse,
  saveBatchResponses,
  getResults,
  retakeSurvey,
  getStatistics,
  getMatches,
  getMatchDetail,
  refreshMatches,
} from '../controllers/surveyController';

const router = express.Router();

// Survey routes
router.get('/questions', getQuestions); // Public - can view questions without auth
router.post('/start', requireAuth, startSurvey);
router.post('/response', requireAuth, saveResponse);
router.post('/responses', requireAuth, saveBatchResponses);
router.get('/results', requireAuth, getResults);
router.post('/retake', requireAuth, retakeSurvey);
router.get('/statistics', requireAuth, getStatistics); // Admin only (checked in controller)

// Matching routes
router.get('/matches', requireAuth, getMatches);
router.get('/matches/:candidateId/explanation', requireAuth, getMatchDetail);
router.post('/matches/refresh', requireAuth, refreshMatches);

export default router;
