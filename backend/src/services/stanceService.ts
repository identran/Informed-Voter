import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';

export const stanceService = {
  async getAllStances() {
    // Check cache
    const cacheKey = 'stances:all';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const stances = await prisma.stance.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    // Cache for 24 hours
    await cache.set(cacheKey, stances, 86400);

    return stances;
  },

  async getStancesByCategory(category: string) {
    const cacheKey = `stances:category:${category}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const stances = await prisma.stance.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });

    await cache.set(cacheKey, stances, 86400);

    return stances;
  },

  async getStanceById(id: string) {
    const stance = await prisma.stance.findUnique({
      where: { id },
    });

    if (!stance) {
      throw new AppError(404, 'Stance not found');
    }

    return stance;
  },

  async createStance(data: {
    category: string;
    title: string;
    description: string;
    order?: number;
  }) {
    const stance = await prisma.stance.create({
      data,
    });

    // Invalidate cache
    await cache.delPattern('stances:*');

    return stance;
  },

  async updateStance(id: string, data: Partial<{
    category: string;
    title: string;
    description: string;
    order: number;
    isActive: boolean;
  }>) {
    const stance = await prisma.stance.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await cache.delPattern('stances:*');

    return stance;
  },

  async getStanceCategories() {
    const cacheKey = 'stances:categories';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const categories = await prisma.stance.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
    });

    const result = categories.map((c: any) => ({
      category: c.category,
      count: c._count,
    }));

    await cache.set(cacheKey, result, 86400);

    return result;
  },
};
