import { Response } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

export const authController = {
  register: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, name, zipCode } = req.body;

    const result = await authService.register({
      email,
      password,
      name,
      zipCode,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  }),

  login: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      data: result,
    });
  }),

  getProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const profile = await authService.getProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { name, location, zipCode } = req.body;

    const profile = await authService.updateProfile(userId, {
      name,
      location,
      zipCode,
    });

    res.json({
      success: true,
      data: profile,
    });
  }),
};
