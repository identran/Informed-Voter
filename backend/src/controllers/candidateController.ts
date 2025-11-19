import { Response } from 'express';
import { candidateService } from '../services/candidateService';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

export const candidateController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const candidate = await candidateService.createCandidate(req.body);

    res.status(201).json({
      success: true,
      data: candidate,
      message: 'Candidate profile submitted for review',
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const candidate = await candidateService.getCandidateById(id);

    res.json({
      success: true,
      data: candidate,
    });
  }),

  search: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = {
      zipCode: req.query.zipCode as string,
      city: req.query.city as string,
      state: req.query.state as string,
      county: req.query.county as string,
      office: req.query.office as string,
      district: req.query.district as string,
      isIncumbent: req.query.isIncumbent === 'true' ? true : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await candidateService.searchCandidates(query);

    res.json({
      success: true,
      ...result,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const candidate = await candidateService.updateCandidate(id, req.body);

    res.json({
      success: true,
      data: candidate,
    });
  }),

  addStance: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { stanceId, position, sourceUrl } = req.body;

    const candidateStance = await candidateService.addStanceToCandidate(
      id,
      stanceId,
      position,
      sourceUrl
    );

    res.status(201).json({
      success: true,
      data: candidateStance,
    });
  }),

  updateStance: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, stanceId } = req.params;
    const { position, sourceUrl } = req.body;

    const candidateStance = await candidateService.updateCandidateStance(
      id,
      stanceId,
      position,
      sourceUrl
    );

    res.json({
      success: true,
      data: candidateStance,
    });
  }),

  // Admin endpoints
  getPending: asyncHandler(async (req: AuthRequest, res: Response) => {
    const candidates = await candidateService.getPendingCandidates();

    res.json({
      success: true,
      data: candidates,
    });
  }),

  updateVerification: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const candidate = await candidateService.updateVerificationStatus(id, status);

    res.json({
      success: true,
      data: candidate,
    });
  }),
};
