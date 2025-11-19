# Phase 2 Database Migration Instructions

## Prerequisites
- PostgreSQL database running
- Database connection configured in `.env` file

## Steps to Apply Migration

### 1. Copy .env.example to .env
```bash
cd backend
cp .env.example .env
# Edit .env and update DATABASE_URL with your actual database credentials
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Create Migration
```bash
npm run prisma:migrate -- --name phase2_voter_features
```

This will:
- Analyze the Prisma schema changes
- Generate SQL migration files
- Apply the migration to your database
- Update Prisma Client

### 4. Verify Migration
```bash
npm run prisma:studio
```

This opens Prisma Studio where you can verify all the new tables exist:
- SurveyQuestion
- UserSurveyResponse
- CandidateMatch
- BallotMeasure
- UserBallot
- SwipeAction
- PollResponse
- AggregatedPollData
- CandidateVerification
- ContentViolationLog

### 5. Seed Survey Questions
```bash
npm run seed
```

This will populate the database with:
- Standard survey questions for voter matching
- Initial stance categories
- Sample data for testing

## Troubleshooting

### Error: "Can't reach database server"
- Ensure PostgreSQL is running: `docker-compose up -d` (if using Docker)
- Check DATABASE_URL in .env matches your setup

### Error: "Engine not found"
```bash
npx prisma generate
```

### To Reset Database (WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

## What's New in Phase 2

### New Tables:
1. **SurveyQuestion** - Questions for voter matching survey
2. **UserSurveyResponse** - User answers to survey questions
3. **CandidateMatch** - Calculated alignment scores between users and candidates
4. **BallotMeasure** - Propositions and ballot measures
5. **UserBallot** - Saved ballot selections for each user
6. **SwipeAction** - Tracking swipe gestures on candidates
7. **PollResponse** - User poll participation data
8. **AggregatedPollData** - Public polling statistics
9. **CandidateVerification** - Verification workflow for candidates
10. **ContentViolationLog** - Automated content moderation tracking

### Updated Tables:
- **User** - Added relations to Phase 2 tables
- **Candidate** - Added relations to Phase 2 tables
- **Stance** - Added relation to SurveyQuestion
- **Election** - Added relations to BallotMeasure and UserBallot
