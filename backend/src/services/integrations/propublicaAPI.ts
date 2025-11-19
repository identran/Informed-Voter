/**
 * ProPublica Congress API Integration
 * https://projects.propublica.org/api-docs/congress-api/
 */

import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { Vote, Chamber, BillStatus } from '@prisma/client';

const PROPUBLICA_BASE_URL = 'https://api.propublica.org/congress/v1';

interface ProPublicaMember {
  id: string;
  first_name: string;
  last_name: string;
  party: string;
  state: string;
  district?: string;
  office?: string;
}

interface ProPublicaVote {
  member_id: string;
  position: string;
  vote_position: string;
}

interface ProPublicaBill {
  bill_id: string;
  bill_slug: string;
  bill_type: string;
  number: string;
  title: string;
  short_title: string;
  sponsor_id: string;
  congressdotgov_url: string;
  introduced_date: string;
  latest_major_action_date: string;
  latest_major_action: string;
  house_passage?: string;
  senate_passage?: string;
}

interface ProPublicaRollCallVote {
  congress: string;
  chamber: string;
  session: string;
  roll_call: string;
  bill?: {
    bill_id: string;
    number: string;
    title: string;
  };
  question: string;
  description: string;
  vote_uri: string;
  date: string;
  time: string;
  result: string;
  positions: ProPublicaVote[];
}

export class ProPublicaAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = env.PROPUBLICA_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('ProPublica API key not configured');
    }
  }

  private async fetch(endpoint: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('ProPublica API key not configured');
    }

    const response = await fetch(`${PROPUBLICA_BASE_URL}${endpoint}`, {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ProPublica API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results?.[0] || data.results || data;
  }

  async getMembers(congress: number, chamber: 'house' | 'senate'): Promise<ProPublicaMember[]> {
    try {
      const data = await this.fetch(`/${congress}/${chamber}/members.json`);
      return data.members || [];
    } catch (error) {
      logger.error('Error fetching ProPublica members:', error);
      return [];
    }
  }

  async getMemberVotes(memberId: string): Promise<any[]> {
    try {
      const data = await this.fetch(`/members/${memberId}/votes.json`);
      return data.votes || [];
    } catch (error) {
      logger.error(`Error fetching votes for member ${memberId}:`, error);
      return [];
    }
  }

  async getRecentBills(congress: number, chamber: 'house' | 'senate', type: string = 'introduced'): Promise<ProPublicaBill[]> {
    try {
      const data = await this.fetch(`/${congress}/${chamber}/bills/${type}.json`);
      return data.bills || [];
    } catch (error) {
      logger.error('Error fetching recent bills:', error);
      return [];
    }
  }

  async getRollCallVote(congress: number, chamber: 'house' | 'senate', session: number, rollCall: number): Promise<ProPublicaRollCallVote | null> {
    try {
      const data = await this.fetch(`/${congress}/${chamber}/sessions/${session}/votes/${rollCall}.json`);
      return data.vote || null;
    } catch (error) {
      logger.error(`Error fetching roll call vote ${rollCall}:`, error);
      return null;
    }
  }

  /**
   * Import a bill from ProPublica into our database
   */
  async importBill(bill: ProPublicaBill, congress: number): Promise<any> {
    try {
      const chamber = this.mapChamber(bill.bill_type);
      const status = this.mapBillStatus(bill);

      const created = await prisma.bill.upsert({
        where: { billNumber: bill.bill_id },
        update: {
          title: bill.short_title || bill.title,
          status,
          lastActionDate: new Date(bill.latest_major_action_date),
        },
        create: {
          billNumber: bill.bill_id,
          title: bill.short_title || bill.title,
          summary: bill.title,
          chamber,
          congress,
          legislativeBody: 'US Congress',
          introducedDate: new Date(bill.introduced_date),
          lastActionDate: new Date(bill.latest_major_action_date),
          status,
          sourceUrl: bill.congressdotgov_url,
        },
      });

      logger.info(`Imported bill ${bill.bill_id}`);
      return created;
    } catch (error) {
      logger.error(`Error importing bill ${bill.bill_id}:`, error);
      return null;
    }
  }

  /**
   * Import voting records from a roll call vote
   */
  async importRollCallVote(congress: number, chamber: 'house' | 'senate', session: number, rollCall: number): Promise<number> {
    try {
      const voteData = await this.getRollCallVote(congress, chamber, session, rollCall);
      if (!voteData || !voteData.bill) {
        logger.warn(`No bill found for roll call ${rollCall}`);
        return 0;
      }

      // Make sure bill exists
      const bill = await prisma.bill.findUnique({
        where: { billNumber: voteData.bill.bill_id },
      });

      if (!bill) {
        logger.warn(`Bill ${voteData.bill.bill_id} not found in database`);
        return 0;
      }

      let imported = 0;

      // Import each member's vote
      for (const position of voteData.positions) {
        try {
          // Find candidate by bioguide ID
          const candidate = await prisma.candidate.findUnique({
            where: { bioguideId: position.member_id },
          });

          if (!candidate) {
            continue;
          }

          const vote = this.mapVote(position.vote_position);

          await prisma.votingRecord.upsert({
            where: {
              candidateId_billId: {
                candidateId: candidate.id,
                billId: bill.id,
              },
            },
            update: {
              vote,
              voteDate: new Date(voteData.date),
            },
            create: {
              candidateId: candidate.id,
              billId: bill.id,
              vote,
              voteDate: new Date(voteData.date),
              rollCallNum: voteData.roll_call,
              sourceUrl: voteData.vote_uri,
            },
          });

          imported++;
        } catch (error) {
          logger.error(`Error importing vote for member ${position.member_id}:`, error);
        }
      }

      logger.info(`Imported ${imported} votes from roll call ${rollCall}`);
      return imported;
    } catch (error) {
      logger.error(`Error importing roll call vote ${rollCall}:`, error);
      return 0;
    }
  }

  private mapChamber(billType: string): Chamber {
    if (billType.toLowerCase().includes('h')) return 'HOUSE';
    if (billType.toLowerCase().includes('s')) return 'SENATE';
    return 'HOUSE';
  }

  private mapBillStatus(bill: ProPublicaBill): BillStatus {
    if (bill.house_passage && bill.senate_passage) return 'PASSED_BOTH';
    if (bill.house_passage || bill.senate_passage) return 'PASSED_CHAMBER';
    return 'INTRODUCED';
  }

  private mapVote(position: string): Vote {
    const pos = position.toLowerCase();
    if (pos === 'yes' || pos === 'yea') return 'YES';
    if (pos === 'no' || pos === 'nay') return 'NO';
    if (pos === 'present') return 'PRESENT';
    if (pos === 'not voting') return 'NOT_VOTING';
    return 'ABSENT';
  }
}

export const propublicaAPI = new ProPublicaAPI();
