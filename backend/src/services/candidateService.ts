import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { validateCandidateContent, sanitizeContent } from '../utils/contentValidation';
import { normalizeState, normalizeZipCode } from '../utils/geocoding';
import { CandidateSearchQuery, PaginatedResponse } from '../types/api';
import { Candidate, VerificationStatus } from '@prisma/client';

export const candidateService = {
  async createCandidate(data: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    office: string;
    district?: string;
    state: string;
    city?: string;
    county?: string;
    electionDate?: Date;
    bio: string;
    goals: string;
    reasonForRunning: string;
    isIncumbent?: boolean;
  }) {
    // Validate content
    const validation = validateCandidateContent({
      bio: data.bio,
      goals: data.goals,
      reasonForRunning: data.reasonForRunning,
    });

    if (!validation.isValid) {
      throw new AppError(400, validation.errors.join(', '));
    }

    // Sanitize content
    const sanitizedData = {
      ...data,
      bio: sanitizeContent(data.bio),
      goals: sanitizeContent(data.goals),
      reasonForRunning: sanitizeContent(data.reasonForRunning),
      state: normalizeState(data.state),
    };

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        ...sanitizedData,
        verificationStatus: 'PENDING',
      },
    });

    return candidate;
  },

  async getCandidateById(id: string) {
    // Check cache first
    const cacheKey = `candidate:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        stances: {
          include: {
            stance: true,
          },
          orderBy: {
            stance: {
              order: 'asc',
            },
          },
        },
        votingRecords: {
          include: {
            bill: true,
          },
          orderBy: {
            voteDate: 'desc',
          },
        },
      },
    });

    if (!candidate) {
      throw new AppError(404, 'Candidate not found');
    }

    // Only return verified candidates to public
    if (candidate.verificationStatus !== 'VERIFIED') {
      throw new AppError(404, 'Candidate not found');
    }

    // Cache for 1 hour
    await cache.set(cacheKey, candidate, 3600);

    return candidate;
  },

  async searchCandidates(query: CandidateSearchQuery): Promise<PaginatedResponse<Candidate>> {
    const {
      zipCode,
      city,
      state,
      county,
      office,
      district,
      isIncumbent,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {
      verificationStatus: 'VERIFIED',
    };

    if (zipCode) {
      const normalized = normalizeZipCode(zipCode);
      // In a real implementation, you'd use a geocoding service
      // For now, we'll just do basic matching
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (state) {
      where.state = normalizeState(state);
    }

    if (county) {
      where.county = {
        contains: county,
        mode: 'insensitive',
      };
    }

    if (office) {
      where.office = {
        contains: office,
        mode: 'insensitive',
      };
    }

    if (district) {
      where.district = district;
    }

    if (isIncumbent !== undefined) {
      where.isIncumbent = isIncumbent;
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { electionDate: 'asc' },
          { name: 'asc' },
        ],
      }),
      prisma.candidate.count({ where }),
    ]);

    return {
      data: candidates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async updateCandidate(id: string, data: Partial<Candidate>) {
    // Validate content if provided
    if (data.bio || data.goals || data.reasonForRunning) {
      const validation = validateCandidateContent({
        bio: data.bio,
        goals: data.goals,
        reasonForRunning: data.reasonForRunning,
      });

      if (!validation.isValid) {
        throw new AppError(400, validation.errors.join(', '));
      }

      // Sanitize
      if (data.bio) data.bio = sanitizeContent(data.bio);
      if (data.goals) data.goals = sanitizeContent(data.goals);
      if (data.reasonForRunning) data.reasonForRunning = sanitizeContent(data.reasonForRunning);
    }

    if (data.state) {
      data.state = normalizeState(data.state);
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await cache.del(`candidate:${id}`);

    return candidate;
  },

  async updateVerificationStatus(id: string, status: VerificationStatus) {
    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });

    // Invalidate cache
    await cache.del(`candidate:${id}`);

    return candidate;
  },

  async addStanceToCandidate(candidateId: string, stanceId: string, position: string, sourceUrl?: string) {
    const candidateStance = await prisma.candidateStance.create({
      data: {
        candidateId,
        stanceId,
        position: sanitizeContent(position),
        sourceUrl,
      },
      include: {
        stance: true,
      },
    });

    // Invalidate cache
    await cache.del(`candidate:${candidateId}`);

    return candidateStance;
  },

  async updateCandidateStance(candidateId: string, stanceId: string, position: string, sourceUrl?: string) {
    const candidateStance = await prisma.candidateStance.update({
      where: {
        candidateId_stanceId: {
          candidateId,
          stanceId,
        },
      },
      data: {
        position: sanitizeContent(position),
        sourceUrl,
      },
      include: {
        stance: true,
      },
    });

    // Invalidate cache
    await cache.del(`candidate:${candidateId}`);

    return candidateStance;
  },

  async getPendingCandidates() {
    return prisma.candidate.findMany({
      where: {
        verificationStatus: {
          in: ['PENDING', 'UNDER_REVIEW'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  },
};
