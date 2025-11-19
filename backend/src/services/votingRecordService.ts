import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { Vote } from '@prisma/client';

export const votingRecordService = {
  async getVotingRecordsByCandidate(candidateId: string) {
    const cacheKey = `voting-records:candidate:${candidateId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const records = await prisma.votingRecord.findMany({
      where: { candidateId },
      include: {
        bill: {
          include: {
            stances: {
              include: {
                stance: true,
              },
            },
          },
        },
      },
      orderBy: { voteDate: 'desc' },
    });

    // Cache for 1 hour
    await cache.set(cacheKey, records, 3600);

    return records;
  },

  async getVotingRecordsByBill(billId: string) {
    const records = await prisma.votingRecord.findMany({
      where: { billId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            office: true,
            state: true,
          },
        },
      },
      orderBy: {
        candidate: {
          name: 'asc',
        },
      },
    });

    return records;
  },

  async createVotingRecord(data: {
    candidateId: string;
    billId: string;
    vote: Vote;
    voteDate: Date;
    rollCallNum?: string;
    sourceUrl: string;
  }) {
    const record = await prisma.votingRecord.create({
      data,
      include: {
        bill: true,
      },
    });

    // Invalidate cache
    await cache.del(`voting-records:candidate:${data.candidateId}`);
    await cache.del(`candidate:${data.candidateId}`);

    return record;
  },

  async bulkCreateVotingRecords(records: Array<{
    candidateId: string;
    billId: string;
    vote: Vote;
    voteDate: Date;
    rollCallNum?: string;
    sourceUrl: string;
  }>) {
    const created = await prisma.votingRecord.createMany({
      data: records,
      skipDuplicates: true,
    });

    // Invalidate caches
    const candidateIds = [...new Set(records.map(r => r.candidateId))];
    for (const id of candidateIds) {
      await cache.del(`voting-records:candidate:${id}`);
      await cache.del(`candidate:${id}`);
    }

    return created;
  },

  async getComparisonData(candidateId: string, stanceId: string) {
    // Get candidate's stated position on the stance
    const candidateStance = await prisma.candidateStance.findUnique({
      where: {
        candidateId_stanceId: {
          candidateId,
          stanceId,
        },
      },
      include: {
        stance: true,
      },
    });

    if (!candidateStance) {
      throw new AppError(404, 'Candidate stance not found');
    }

    // Get bills related to this stance
    const billStances = await prisma.billStance.findMany({
      where: { stanceId },
      include: {
        bill: {
          include: {
            votingRecords: {
              where: { candidateId },
            },
          },
        },
      },
      orderBy: {
        relevance: 'desc',
      },
    });

    // Format the comparison data
    const votes = billStances
      .filter(bs => bs.bill.votingRecords.length > 0)
      .map(bs => ({
        bill: bs.bill,
        vote: bs.bill.votingRecords[0],
        relevance: bs.relevance,
        notes: bs.notes,
      }));

    return {
      stance: candidateStance.stance,
      statedPosition: candidateStance.position,
      sourceUrl: candidateStance.sourceUrl,
      votes,
    };
  },

  async getAllComparisonsForCandidate(candidateId: string) {
    // Get all stances the candidate has taken positions on
    const candidateStances = await prisma.candidateStance.findMany({
      where: { candidateId },
      include: {
        stance: true,
      },
    });

    // For each stance, get the comparison data
    const comparisons = await Promise.all(
      candidateStances.map(async (cs) => {
        try {
          return await this.getComparisonData(candidateId, cs.stanceId);
        } catch (error) {
          return null;
        }
      })
    );

    return comparisons.filter(c => c !== null);
  },
};
