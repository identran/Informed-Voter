# Phase 2: Voter Features Implementation

## Overview
Phase 2 adds advanced user engagement features to the Informed Voter Platform while maintaining strict non-partisan principles.

## Completed Features

### 1. ✅ Voter Matching Survey System
**Purpose:** Help users discover candidates who align with their policy preferences

**Implementation:**
- **Database Models:**
  - `SurveyQuestion` - 20 policy questions linked to stances
  - `UserSurveyResponse` - User answers with position + importance (1-5)
  - `CandidateMatch` - Calculated alignment scores (0-100%)

- **API Endpoints:**
  - `GET /api/survey/questions` - Get all survey questions
  - `POST /api/survey/start` - Start survey (returns questions + progress)
  - `POST /api/survey/response` - Save single response
  - `POST /api/survey/responses` - Batch save responses
  - `GET /api/survey/results` - Get user's survey results
  - `POST /api/survey/retake` - Clear responses to retake
  - `GET /api/survey/statistics` - Admin: survey statistics

- **Matching Algorithm:**
  - Compares user survey responses to candidate stances
  - Weights matches by user's importance ratings
  - Calculates 0-100% alignment score
  - Provides detailed breakdown of agreements/disagreements

- **API Endpoints:**
  - `GET /api/survey/matches` - Get user's top candidate matches
  - `GET /api/survey/matches/:candidateId/explanation` - Detailed match breakdown
  - `POST /api/survey/matches/refresh` - Recalculate matches

### 2. ✅ Swipe-Based Candidate Discovery
**Purpose:** Mobile-first interface for quickly discovering and shortlisting candidates

**Implementation:**
- **Database Models:**
  - `SwipeAction` - Tracks all swipes (right/left/up/down)
  - Uses existing `SavedCandidate` for shortlist

- **Features:**
  - **Daily Deterministic Shuffle:** Same order for each user all day
  - **Smart Filtering:**
    - Excludes already-swiped candidates
    - Excludes already-shortlisted candidates
    - Filters by user's state/district
  - **Alignment Scores:** Shows match percentage if survey completed
  - **Top 3 Stances:** Displays candidate's key positions on each card

- **Swipe Actions:**
  - **Right:** Add to shortlist
  - **Left:** Skip (temporary)
  - **Up:** View full profile
  - **Down:** Skip for now

- **API Endpoints:**
  - `GET /api/swipe/deck` - Get shuffled candidate deck
  - `POST /api/swipe/action` - Record swipe action
  - `GET /api/swipe/shortlist` - Get user's shortlisted candidates
  - `DELETE /api/swipe/shortlist/:candidateId` - Remove from shortlist
  - `PUT /api/swipe/shortlist/:candidateId/notes` - Update candidate notes
  - `GET /api/swipe/analytics/:candidateId` - Admin: swipe analytics

### 3. ✅ Public Community Polling
**Purpose:** Transparent, privacy-conscious polling without selling data

**Implementation:**
- **Database Models:**
  - `PollResponse` - Individual user responses (private)
  - `AggregatedPollData` - Public aggregated data (k-anonymity)

- **Privacy Protections:**
  - Minimum 100 responses before public display (k-anonymity)
  - Individual responses never exposed
  - Users opt-in to polling
  - Aggregate data only

- **Poll Questions:**
  - Intent to Vote: definitely / likely / unlikely / definitely_not
  - Favorability: 1-5 scale

- **API Endpoints:**
  - `POST /api/polls/respond` - Submit poll response
  - `GET /api/polls/aggregate/:candidateId` - Get public aggregated data
  - `GET /api/polls/trends/:candidateId` - Admin: polling trends over time
  - `GET /api/polls/top/:state` - Top candidates by state

**Revenue Model (NOT data sales):**
- All poll data is FREE and PUBLIC
- Revenue from grants, donations, verified badges ($50/month for candidates)

---

## Database Schema Changes

### New Tables (10 total)
1. **SurveyQuestion** - Survey questions for voter matching
2. **UserSurveyResponse** - User survey answers
3. **CandidateMatch** - Calculated user-candidate alignment scores
4. **BallotMeasure** - Ballot propositions and measures
5. **UserBallot** - Saved ballot selections
6. **SwipeAction** - Swipe gesture tracking
7. **PollResponse** - User poll responses (private)
8. **AggregatedPollData** - Public polling statistics
9. **CandidateVerification** - Candidate identity verification workflow
10. **ContentViolationLog** - Automated content moderation logs

### Updated Tables
- **User** - Added relations to all Phase 2 tables
- **Candidate** - Added relations to Phase 2 tables
- **Stance** - Added relation to SurveyQuestion
- **Election** - Added relations to BallotMeasure and UserBallot

---

## Setup Instructions

### 1. Run Database Migrations
```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate -- --name phase2_voter_features

# Seed database (includes 20 survey questions)
npm run seed
```

### 2. Environment Variables
No new environment variables needed for Phase 2A features.
(Google Civic API key will be needed for Phase 2B - Ballot Preview)

### 3. Test API Endpoints

**Survey Flow:**
```bash
# 1. Start survey
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/survey/start

# 2. Submit responses
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"responses": [{"questionId":"...", "position":"support", "importance":5}]}' \
  http://localhost:3001/api/survey/responses

# 3. Get matches
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/survey/matches
```

**Swipe Flow:**
```bash
# 1. Get deck
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/swipe/deck

# 2. Swipe right (shortlist)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"...", "action":"right"}' \
  http://localhost:3001/api/swipe/action

# 3. View shortlist
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/swipe/shortlist
```

**Polling Flow:**
```bash
# 1. Submit poll response
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"...", "intentToVote":"likely", "favorability":4}' \
  http://localhost:3001/api/polls/respond

# 2. Get public poll data (once 100+ responses)
curl http://localhost:3001/api/polls/aggregate/:candidateId
```

---

## Architecture Highlights

### Matching Algorithm
The matching algorithm uses a weighted scoring system:

```typescript
// For each stance:
similarity = calculatePositionSimilarity(userPosition, candidatePosition)
weight = userImportance (1-5)
totalScore += similarity * weight

alignmentScore = (totalScore / totalWeight) * 100
```

**Position Similarity:**
- Perfect match (both support or both oppose): 1.0
- Partial match (one neutral): 0.5
- Complete mismatch (support vs oppose): 0.0

### Swipe Deck Shuffling
Uses deterministic daily shuffle to prevent "first listed" bias:

```typescript
dailySeed = md5(userId + currentDate)
shuffledDeck = fisherYatesShuffle(candidates, dailySeed)
```

This ensures:
- Same shuffle for a user throughout the day
- Different shuffle each day
- Different shuffle for different users
- Fair candidate visibility

### k-Anonymity for Polling
Public poll data only shown when:
- Minimum 100 responses collected
- Individual responses never exposed
- Aggregate percentages only
- Transparent response counts

---

## Non-Partisan Safeguards

### Content Rules (enforced in code)
1. **No party affiliation** anywhere in survey or results
2. **Matching algorithm is neutral:**
   - Based only on policy positions
   - No weighting by party
   - No external political data sources
3. **Swipe deck is randomized daily:**
   - No algorithmic promotion
   - No "trending" or "popular" sorting
   - Geographic relevance only
4. **Polling data is public and transparent:**
   - No selling data to candidates
   - No preferential access
   - All users see same data

---

## Testing Coverage

### Unit Tests Needed
- `surveyService.spec.ts` - Survey CRUD operations
- `matchingService.spec.ts` - Matching algorithm accuracy
- `swipeService.spec.ts` - Shuffle determinism, action recording
- `pollingService.spec.ts` - Aggregation, k-anonymity enforcement

### Integration Tests Needed
- Survey → Match calculation flow
- Swipe → Shortlist updates
- Poll response → Aggregation update

### E2E Tests Needed
- Complete survey and view matches
- Swipe through deck and manage shortlist
- Submit poll and view public data (after 100+ responses)

---

## Performance Considerations

### Caching Strategy (Redis)
- Survey questions (TTL: 1 hour)
- User matches (TTL: 1 day, invalidate on survey update)
- Swipe deck (TTL: 24 hours, key includes date)
- Aggregated poll data (TTL: 5 minutes)

### Database Indexes
All critical indexes added in Prisma schema:
- `UserSurveyResponse`: `[userId, questionId]`
- `CandidateMatch`: `[userId, alignmentScore]`
- `SwipeAction`: `[userId, timestamp]`
- `PollResponse`: `[candidateId]`
- `AggregatedPollData`: `[responseCount]`

### Background Jobs Needed
1. **Match Recalculation:** Run when user completes survey
2. **Poll Aggregation:** Update every 5 minutes or on new response
3. **Swipe Analytics:** Calculate daily for admin dashboard

---

## Next Steps (Remaining Phase 2 Features)

### Phase 2B: Ballot Preview (2 weeks)
- [ ] Integrate Google Civic Information API
- [ ] Fetch user's ballot by address
- [ ] Display polling locations
- [ ] Save/export ballot guide (PDF)

### Phase 2C: Candidate Portal (2 weeks)
- [ ] Self-service registration
- [ ] Identity verification workflow
- [ ] Automated content moderation
- [ ] Admin review dashboard

### Phase 2D: Frontend (4 weeks)
- [ ] Survey onboarding component (swipeable cards)
- [ ] Swipe deck interface (Framer Motion gestures)
- [ ] Polling dashboard (Recharts visualizations)
- [ ] Shortlist management page
- [ ] Ballot preview page
- [ ] Candidate portal

---

## API Summary

### Survey & Matching
- `GET /api/survey/questions`
- `POST /api/survey/start`
- `POST /api/survey/response`
- `POST /api/survey/responses`
- `GET /api/survey/results`
- `POST /api/survey/retake`
- `GET /api/survey/statistics` (admin)
- `GET /api/survey/matches`
- `GET /api/survey/matches/:candidateId/explanation`
- `POST /api/survey/matches/refresh`

### Swipe & Shortlist
- `GET /api/swipe/deck`
- `POST /api/swipe/action`
- `GET /api/swipe/shortlist`
- `DELETE /api/swipe/shortlist/:candidateId`
- `PUT /api/swipe/shortlist/:candidateId/notes`
- `GET /api/swipe/analytics/:candidateId` (admin)

### Polling (coming next)
- `POST /api/polls/respond`
- `GET /api/polls/aggregate/:candidateId`
- `GET /api/polls/trends/:candidateId` (admin)
- `GET /api/polls/top/:state`

---

## Success Metrics

### Engagement
- Survey completion rate > 70%
- Average swipe session > 5 minutes
- Shortlist usage > 50% of users
- Poll participation > 30% opt-in

### Quality
- Matching accuracy (user feedback surveys)
- False positive rate < 5% for content moderation
- Poll data meets k-anonymity threshold (100+ responses)

### Growth
- Weekly active users
- Candidate adoption rate
- Geographic coverage expansion

---

## Security & Privacy

### Data Encryption
- User survey responses encrypted at rest
- Poll responses private, never exposed individually
- User shortlists private

### k-Anonymity
- Poll data only public with 100+ responses
- No IP tracking or fingerprinting
- Aggregation prevents individual identification

### Rate Limiting
- Survey submission: 100/hour
- Swipe actions: 1000/hour
- Poll responses: 10/minute

---

## Contributors

Phase 2 Backend Implementation:
- Database schema design
- Survey and matching algorithm
- Swipe functionality
- Polling system with k-anonymity

---

## License

Same as main project (see LICENSE file)

---

## Questions?

See CLAUDE.md for full project specification.
See MIGRATION_INSTRUCTIONS.md for database setup.
See docs/API.md for complete API documentation (coming soon).
