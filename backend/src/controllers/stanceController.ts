import { Response } from 'express';
import { stanceService } from '../services/stanceService';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

export const stanceController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const stances = await stanceService.getAllStances();

    res.json({
      success: true,
      data: stances,
    });
  }),

  getByCategory: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { category } = req.params;

    const stances = await stanceService.getStancesByCategory(category);

    res.json({
      success: true,
      data: stances,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const stance = await stanceService.getStanceById(id);

    res.json({
      success: true,
      data: stance,
    });
  }),

  getCategories: asyncHandler(async (req: AuthRequest, res: Response) => {
    const categories = await stanceService.getStanceCategories();

    res.json({
      success: true,
      data: categories,
    });
  }),

  // Admin endpoints
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const stance = await stanceService.createStance(req.body);

    res.status(201).json({
      success: true,
      data: stance,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const stance = await stanceService.updateStance(id, req.body);

    res.json({
      success: true,
      data: stance,
    });
  }),
};
