import { Router } from 'express';
import authRoutes from './auth';
import candidateRoutes from './candidates';
import stanceRoutes from './stances';
import votingRecordRoutes from './voting-records';
import surveyRoutes from './survey';
import swipeRoutes from './swipe';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/candidates', candidateRoutes);
router.use('/stances', stanceRoutes);
router.use('/voting-records', votingRecordRoutes);
router.use('/survey', surveyRoutes);
router.use('/swipe', swipeRoutes);

export default router;
