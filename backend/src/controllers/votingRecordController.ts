import { Response } from 'express';
import { votingRecordService } from '../services/votingRecordService';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

export const votingRecordController = {
  getByCandidate: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { candidateId } = req.params;

    const records = await votingRecordService.getVotingRecordsByCandidate(candidateId);

    res.json({
      success: true,
      data: records,
    });
  }),

  getByBill: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { billId } = req.params;

    const records = await votingRecordService.getVotingRecordsByBill(billId);

    res.json({
      success: true,
      data: records,
    });
  }),

  getComparison: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { candidateId, stanceId } = req.params;

    const comparison = await votingRecordService.getComparisonData(candidateId, stanceId);

    res.json({
      success: true,
      data: comparison,
    });
  }),

  getAllComparisons: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { candidateId } = req.params;

    const comparisons = await votingRecordService.getAllComparisonsForCandidate(candidateId);

    res.json({
      success: true,
      data: comparisons,
    });
  }),

  // Admin endpoints
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const record = await votingRecordService.createVotingRecord(req.body);

    res.status(201).json({
      success: true,
      data: record,
    });
  }),

  bulkCreate: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { records } = req.body;

    const result = await votingRecordService.bulkCreateVotingRecords(records);

    res.status(201).json({
      success: true,
      data: result,
    });
  }),
};
