# Informed Voter Platform

## Project Goal
Build a web application that enables citizens to discover and evaluate political candidates for local, state, and national elections based on verified information from official sources, with a focus on comparing stated positions against actual voting records.

## Core Features

### 1. Candidate Discovery
- Search/browse candidates by:
  - Geographic location (zip code, city, state)
  - Election type (municipal, county, state, federal)
  - Office type (executive, legislative, judicial)
- Filter by upcoming election dates
- No party affiliation displayed

### 2. Candidate Profiles
**Information Display:**
- Bio (max 2 pages/~1000 words)
- Campaign goals and proposed changes
- Reasons for running
- Stance checklist (standardized topics)
- Contact information and official website

**Strict Content Rules:**
- Cannot mention opposing candidates
- Cannot include party affiliation
- Must be submitted by candidate or verified campaign
- Character/length limits enforced

### 3. Stance & Voting Record Integration
**Stance Categories (examples):**
- Healthcare
- Education
- Environment/Climate
- Economic policy
- Criminal justice
- Infrastructure
- Civil rights
- Foreign policy
- Technology/Privacy

**For Each Stance:**
- Candidate's stated position (from their profile)
- Voting record on related bills (for incumbents)
- Sponsorship history
- Committee assignments
- Public statements (from official sources only)

**Data Sources:**
- Congress.gov (federal voting records)
- State legislature websites
- Official government portals
- Verified candidate websites/social media
- C-SPAN, official transcripts

### 4. Record Comparison View
- Side-by-side comparison:
  - "Says" column: stated positions
  - "Does" column: voting record
- Consistency score/indicator
- Timeline of votes vs statements
- Visual indicators (aligned, inconsistent, no record)

### 5. User Features
- Save candidates for later
- Set location/elections to follow
- Notification for upcoming elections
- Share candidate profiles
- Report inaccurate information

## Technical Requirements

### Frontend
- Responsive web app (mobile-first)
- Clean, accessible UI (WCAG 2.1 AA)
- Interactive map for geographic search
- Filtering and sorting capabilities
- Print-friendly candidate comparison

### Backend
- User authentication (optional, for saving preferences)
- Candidate profile management system
- Verification workflow for candidate submissions
- API integrations for voting records
- Data validation and moderation tools

### Data Architecture
```
Candidates
  - id, name, office, district, election_date
  - bio, goals, contact_info
  - verification_status, submission_date

Stances
  - stance_id, category, description
  
CandidateStances
  - candidate_id, stance_id
  - stated_position (text)
  - position_source (url)
  - last_updated

VotingRecords
  - candidate_id, bill_id
  - vote (yes/no/abstain/absent)
  - bill_title, date, source_url
  
Bills
  - bill_id, title, description
  - related_stances[] (array of stance_ids)
  - date, chamber, result
```

### Data Sources to Integrate
1. **Federal:**
   - ProPublica Congress API
   - GovInfo API
   - OpenSecrets API (for public records)
   - Federal Election Commission API

2. **State/Local:**
   - State legislative APIs (varies by state)
   - LegiScan API
   - Ballotpedia scraping (with permission)
   - Local government websites

3. **Verification:**
   - Candidate official websites
   - Social media verified accounts
   - Press releases from official sources
   - Government .gov domains only

## Implementation Phases

### Phase 1: MVP (Minimum Viable Product)
- Basic candidate profile system
- Single state/region implementation
- Manual data entry for candidates
- Simple stance checklist
- Basic search by location

### Phase 2: Voting Record Integration
- API integration for federal voting records
- Stance-to-vote mapping system
- Comparison view implementation
- Data verification workflow

### Phase 3: Expansion & Automation
- Multi-state rollout
- Automated data collection from APIs
- Enhanced search/filtering
- User accounts and saved preferences

### Phase 4: Advanced Features
- Mobile apps (iOS/Android)
- Push notifications for elections
- Community-reported updates
- Candidate response system
- Fact-checking integration

## Content Moderation Strategy

### Candidate Submission Process:
1. Candidate registers with verification
2. Submits profile content
3. Automated checks (length, prohibited words)
4. Manual review by moderation team
5. Verification of identity
6. Publication with "Verified" badge

### Prohibited Content:
- Mentions of opposing candidates
- Party affiliation references
- Attacks or negative campaigning
- Misinformation
- Excessive promotional language

### Ongoing Monitoring:
- Regular audits of voting record accuracy
- User reporting system
- Periodic re-verification of sources

## Success Metrics
- Number of registered candidates
- User engagement (searches, profile views)
- Geographic coverage
- Voting record accuracy rate
- User satisfaction (surveys)
- Impact on voter turnout (long-term)

## Technical Stack

**Frontend:**
- React with Next.js 14 (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for component library
- React Query for data fetching
- Leaflet for interactive maps
- Recharts for data visualization

**Backend:**
- Node.js with Express
- TypeScript
- PostgreSQL database
- Prisma ORM
- Redis for caching
- JWT for authentication

**Infrastructure:**
- Docker for containerization
- GitHub Actions for CI/CD
- Vercel (frontend) / Railway (backend)
- AWS S3 for file storage

**APIs/Services:**
- ProPublica Congress API
- Google Civic Information API
- LegiScan API
- SendGrid for emails

## Project Structure
```
informed-voter-platform/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── env.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── candidateController.ts
│   │   │   ├── stanceController.ts
│   │   │   ├── votingRecordController.ts
│   │   │   ├── searchController.ts
│   │   │   └── authController.ts
│   │   │
│   │   ├── models/
│   │   │   └── (Prisma generates these)
│   │   │
│   │   ├── services/
│   │   │   ├── candidateService.ts
│   │   │   ├── votingRecordService.ts
│   │   │   ├── verificationService.ts
│   │   │   ├── moderationService.ts
│   │   │   └── integrations/
│   │   │       ├── propublicaAPI.ts
│   │   │       ├── legiscanAPI.ts
│   │   │       └── civicInfoAPI.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimit.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── candidates.ts
│   │   │   ├── stances.ts
│   │   │   ├── voting-records.ts
│   │   │   ├── search.ts
│   │   │   └── auth.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── contentValidation.ts
│   │   │   ├── geocoding.ts
│   │   │   ├── comparison.ts
│   │   │   └── logger.ts
│   │   │
│   │   ├── types/
│   │   │   ├── candidate.ts
│   │   │   ├── stance.ts
│   │   │   ├── votingRecord.ts
│   │   │   └── api.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── scripts/
│   │   ├── sync-voting-records.ts
│   │   ├── seed-stances.ts
│   │   └── import-candidates.ts
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx                    # Home/search page
│   │   │   │   ├── search/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── candidates/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── page.tsx            # Candidate profile
│   │   │   │   │   │   └── compare/
│   │   │   │   │   │       └── page.tsx        # Says vs Does view
│   │   │   │   │   └── page.tsx                # All candidates
│   │   │   │   ├── about/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── elections/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── saved/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (candidate-portal)/
│   │   │   │   └── candidate/
│   │   │   │       ├── submit/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── profile/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── (admin)/
│   │   │   │   └── admin/
│   │   │   │       ├── candidates/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── moderation/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── analytics/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   └── (proxy routes if needed)
│   │   │   │
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                             # shadcn components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   │
│   │   │   ├── candidate/
│   │   │   │   ├── CandidateCard.tsx
│   │   │   │   ├── CandidateProfile.tsx
│   │   │   │   ├── CandidateBio.tsx
│   │   │   │   ├── StanceList.tsx
│   │   │   │   ├── ComparisonView.tsx
│   │   │   │   └── VotingHistory.tsx
│   │   │   │
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── LocationSearch.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── ResultsList.tsx
│   │   │   │
│   │   │   ├── maps/
│   │   │   │   ├── InteractiveMap.tsx
│   │   │   │   └── DistrictOverlay.tsx
│   │   │   │
│   │   │   ├── charts/
│   │   │   │   ├── VotingTimeline.tsx
│   │   │   │   ├── ConsistencyScore.tsx
│   │   │   │   └── StanceAlignment.tsx
│   │   │   │
│   │   │   ├── forms/
│   │   │   │   ├── CandidateSubmissionForm.tsx
│   │   │   │   ├── StanceSelector.tsx
│   │   │   │   └── VerificationUpload.tsx
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Toast.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCandidates.ts
│   │   │   ├── useVotingRecords.ts
│   │   │   ├── useSearch.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useGeolocation.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   ├── candidates.ts
│   │   │   │   ├── stances.ts
│   │   │   │   └── votingRecords.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── formatting.ts
│   │   │   │   ├── validation.ts
│   │   │   │   ├── dates.ts
│   │   │   │   └── cn.ts
│   │   │   │
│   │   │   └── constants/
│   │   │       ├── stances.ts
│   │   │       ├── offices.ts
│   │   │       └── routes.ts
│   │   │
│   │   ├── types/
│   │   │   ├── candidate.ts
│   │   │   ├── stance.ts
│   │   │   ├── votingRecord.ts
│   │   │   └── user.ts
│   │   │
│   │   └── styles/
│   │       └── (additional CSS if needed)
│   │
│   ├── .env.local.example
│   ├── .gitignore
│   ├── next.config.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   └── README.md
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── architecture/
│       ├── system-design.md
│       ├── data-flow.md
│       └── security.md
│
├── scripts/
│   ├── setup.sh
│   ├── dev.sh
│   └── deploy.sh
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── LICENSE
```

## Database Schema (Prisma)
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String?
  role          UserRole  @default(VOTER)
  location      String?
  zipCode       String?
  
  savedCandidates SavedCandidate[]
  notifications   Notification[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
}

enum UserRole {
  VOTER
  CANDIDATE
  MODERATOR
  ADMIN
}

model Candidate {
  id                String              @id @default(cuid())
  
  // Basic Info
  name              String
  email             String              @unique
  phone             String?
  website           String?
  
  // Electoral Info
  office            String
  district          String?
  state             String
  city              String?
  county            String?
  electionDate      DateTime?
  
  // Profile Content
  bio               String              @db.Text
  goals             String              @db.Text
  reasonForRunning  String              @db.Text
  contactInfo       String?
  
  // Verification
  verificationStatus VerificationStatus @default(PENDING)
  verifiedAt        DateTime?
  isIncumbent       Boolean            @default(false)
  
  // External IDs (for vote record matching)
  bioguideId        String?            @unique // Congress
  stateLegiId       String?            // State legislature
  localGovId        String?            // Local government
  
  // Relations
  stances           CandidateStance[]
  votingRecords     VotingRecord[]
  savedBy           SavedCandidate[]
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@index([state, district])
  @@index([electionDate])
  @@index([verificationStatus])
}

enum VerificationStatus {
  PENDING
  UNDER_REVIEW
  VERIFIED
  REJECTED
}

model Stance {
  id          String   @id @default(cuid())
  category    String   // Healthcare, Education, etc.
  title       String
  description String   @db.Text
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  
  candidates  CandidateStance[]
  bills       BillStance[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
}

model CandidateStance {
  id              String   @id @default(cuid())
  
  candidateId     String
  candidate       Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  
  stanceId        String
  stance          Stance   @relation(fields: [stanceId], references: [id], onDelete: Cascade)
  
  position        String   @db.Text  // Their stated position
  sourceUrl       String?             // Where they stated this
  priority        Int?                // How important (1-5)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([candidateId, stanceId])
  @@index([candidateId])
  @@index([stanceId])
}

model Bill {
  id              String         @id @default(cuid())
  
  // Bill Identification
  billNumber      String         @unique  // e.g., "HR-1234", "S-5678"
  title           String
  summary         String?        @db.Text
  fullText        String?        @db.Text
  
  // Legislative Info
  chamber         Chamber
  congress        Int?           // 118th Congress, etc.
  session         String?
  legislativeBody String         // "US Congress", "NY State Senate", etc.
  state           String?
  
  // Status
  introducedDate  DateTime
  lastActionDate  DateTime?
  status          BillStatus     @default(INTRODUCED)
  
  // URLs
  sourceUrl       String         // Official government source
  fullTextUrl     String?
  
  // Relations
  votingRecords   VotingRecord[]
  stances         BillStance[]
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@index([billNumber])
  @@index([chamber, congress])
  @@index([introducedDate])
}

enum Chamber {
  HOUSE
  SENATE
  STATE_HOUSE
  STATE_SENATE
  CITY_COUNCIL
  COUNTY_BOARD
  OTHER
}

enum BillStatus {
  INTRODUCED
  IN_COMMITTEE
  PASSED_CHAMBER
  PASSED_BOTH
  SENT_TO_EXECUTIVE
  SIGNED
  VETOED
  FAILED
}

model BillStance {
  id        String   @id @default(cuid())
  
  billId    String
  bill      Bill     @relation(fields: [billId], references: [id], onDelete: Cascade)
  
  stanceId  String
  stance    Stance   @relation(fields: [stanceId], references: [id], onDelete: Cascade)
  
  relevance Int      @default(5)  // How relevant (1-10)
  notes     String?  @db.Text     // Why this bill relates to stance
  
  @@unique([billId, stanceId])
  @@index([billId])
  @@index([stanceId])
}

model VotingRecord {
  id            String     @id @default(cuid())
  
  candidateId   String
  candidate     Candidate  @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  
  billId        String
  bill          Bill       @relation(fields: [billId], references: [id], onDelete: Cascade)
  
  vote          Vote
  voteDate      DateTime
  rollCallNum   String?    // Roll call number if available
  
  sourceUrl     String     // Link to official vote record
  
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  
  @@unique([candidateId, billId])
  @@index([candidateId])
  @@index([billId])
  @@index([voteDate])
}

enum Vote {
  YES
  NO
  ABSTAIN
  ABSENT
  PRESENT
  NOT_VOTING
}

model SavedCandidate {
  id          String    @id @default(cuid())
  
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  candidateId String
  candidate   Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  
  notes       String?   @db.Text
  
  createdAt   DateTime  @default(now())
  
  @@unique([userId, candidateId])
  @@index([userId])
}

model Notification {
  id        String            @id @default(cuid())
  
  userId    String
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type      NotificationType
  title     String
  message   String            @db.Text
  read      Boolean           @default(false)
  
  createdAt DateTime          @default(now())
  
  @@index([userId, read])
}

enum NotificationType {
  ELECTION_REMINDER
  CANDIDATE_UPDATE
  NEW_VOTING_RECORD
  VERIFICATION_STATUS
}

model Election {
  id          String   @id @default(cuid())
  name        String
  date        DateTime
  type        String   // Primary, General, Special
  state       String?
  county      String?
  city        String?
  description String?  @db.Text
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([date])
  @@index([state])
}
```

## Initial Setup Steps

### 1. Environment Setup
```bash
# Clone repository
git clone <repo-url>
cd informed-voter-platform

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Start PostgreSQL and Redis with Docker
docker-compose up -d

# Run database migrations
cd backend
npx prisma migrate dev
npx prisma generate

# Seed initial data (stances, etc.)
npm run seed
```

### 2. Development Workflow
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Database GUI (optional)
cd backend
npx prisma studio
```

### 3. API Integration Setup
- Get API keys from:
  - ProPublica Congress API
  - Google Civic Information API
  - LegiScan API (if using)
- Add keys to backend/.env

### 4. Initial Data Population
- Create seed file with standard stances
- Import sample candidates for testing
- Set up automated vote record sync scripts

## Legal & Compliance Considerations
- 501(c)(3) non-profit status (if applicable)
- FEC compliance for political content
- State election law compliance
- Privacy policy (GDPR, CCPA)
- Terms of service
- Content liability protections (Section 230)
- Accessibility compliance (ADA)

## Development Priorities

### Week 1-2: Foundation
- [x] Project structure setup
- [ ] Database schema implementation
- [ ] Basic API endpoints (CRUD for candidates)
- [ ] Frontend scaffolding with Next.js
- [ ] Authentication system

### Week 3-4: Core Features
- [ ] Candidate profile submission form
- [ ] Geographic search implementation
- [ ] Stance selection system
- [ ] Basic candidate listing/detail pages

### Week 5-6: Voting Records
- [ ] ProPublica API integration
- [ ] Vote record import system
- [ ] Bill-to-stance mapping
- [ ] Comparison view UI

### Week 7-8: Polish & Testing
- [ ] Content moderation workflow
- [ ] Verification system
- [ ] Responsive design refinement
- [ ] Testing and bug fixes

## Testing Strategy
- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
- Accessibility testing (WCAG 2.1 AA)
- Performance testing for search

## Security Considerations
- Input sanitization (prevent XSS)
- SQL injection protection (Prisma handles this)
- Rate limiting on API endpoints
- CSRF protection
- Secure password hashing (bcrypt)
- JWT token security
- Content Security Policy headers
- HTTPS only in production

## Monitoring & Analytics
- Error tracking (Sentry)
- Analytics (privacy-focused: Plausible or Fathom)
- API performance monitoring
- Database query optimization
- User behavior tracking (consent-based)

## Questions for Refinement
- What geographic scope for MVP? (Single city, state, or national?)
- How to handle unopposed races?
- Include ballot measures/propositions?
- How to verify candidate identity?
- Monetization strategy? (Donation-based, grants, ads)
- How to handle candidates without voting records (first-time runners)?
- Include judicial philosophy statements for judges?
- What about appointed vs elected positions?
```
```
I need you to help me build the "Informed Voter Platform" - a non-partisan web application that helps voters evaluate political candidates based on verified information and voting records rather than party affiliation.

## PROJECT OVERVIEW

This is a civic engagement platform where:
1. Candidates create profiles WITHOUT party affiliation displayed
2. Candidates describe their positions on key issues (healthcare, education, environment, etc.)
3. For incumbents, we display their ACTUAL voting record from official government sources
4. Users see a side-by-side "Says vs Does" comparison view
5. Voters can search by location to find candidates in their area

## KEY PRINCIPLES

**Content Rules:**
- No party affiliation displayed anywhere in the app
- Candidates cannot mention opponents in their profiles (auto-moderated)
- Profile content limited to ~2 pages (1000 words)
- All voting records MUST come from official government sources only
- Verification required before candidate profiles go live

**Core Comparison Feature:**
- Show what candidates SAY they support (from their profile)
- Show what they actually VOTED for/against (from official records)
- Visual indicators for alignment (consistent, inconsistent, no record)
- Link to original bill texts and vote records

## TECHNICAL STACK

**Backend:**
- Node.js with Express + TypeScript
- PostgreSQL database
- Prisma ORM
- Redis for caching
- JWT authentication

**Frontend:**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui components
- React Query for data fetching
- Leaflet for interactive maps

**External APIs:**
- ProPublica Congress API (federal voting records)
- Google Civic Information API (elections/districts)
- LegiScan API (state legislatures)

## PROJECT STRUCTURE

I've designed a comprehensive structure:
```
informed-voter-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, etc.
│   │   └── config/         # DB, Redis, env
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── app/            # Next.js pages (App Router)
│       │   ├── (public)/
│       │   │   ├── page.tsx              # Home/search
│       │   │   ├── candidates/[id]/
│       │   │   │   ├── page.tsx          # Profile view
│       │   │   │   └── compare/
│       │   │   │       └── page.tsx      # Says vs Does
│       │   │   └── search/
│       │   ├── (auth)/     # Login/register
│       │   └── (admin)/    # Moderation tools
│       │
│       ├── components/
│       │   ├── candidate/
│       │   │   ├── ComparisonView.tsx
│       │   │   ├── VotingHistory.tsx
│       │   │   └── StanceList.tsx
│       │   ├── search/
│       │   └── maps/
│       │
│       ├── hooks/          # Custom React hooks
│       └── lib/            # API client, utilities
│
└── docs/
```

## DATABASE SCHEMA

Core models (see full Prisma schema in CLAUDE.md):
- **Candidate**: name, bio, office, district, verification status
- **Stance**: standardized issue categories (healthcare, education, etc.)
- **CandidateStance**: candidate's stated position on each stance
- **Bill**: bill details from government sources
- **VotingRecord**: how a candidate voted on each bill
- **BillStance**: mapping bills to relevant stance categories

## CRITICAL FEATURES FOR MVP

### Phase 1: Foundation (Weeks 1-2)
1. Set up project structure
2. Implement database schema with Prisma
3. Create basic API endpoints:
   - POST /api/candidates (create profile)
   - GET /api/candidates (search/list)
   - GET /api/candidates/:id (profile details)
4. Basic Next.js pages with routing
5. Authentication system (JWT)

### Phase 2: Core Functionality (Weeks 3-4)
1. Candidate profile submission form
2. Geographic search (by zip code/city/state)
3. Stance selection system (checkboxes for 10-15 key issues)
4. Content validation and moderation workflow
5. Candidate profile display page

### Phase 3: Voting Records (Weeks 5-6)
1. ProPublica API integration
2. Automated vote record import for incumbents
3. Bill-to-stance mapping system
4. "Says vs Does" comparison view component
5. Voting timeline visualization

### Phase 4: Polish (Weeks 7-8)
1. Interactive map for geographic search
2. Verification badge system
3. Responsive design refinement
4. Content moderation dashboard for admins
5. Testing and bug fixes

## IMPLEMENTATION APPROACH

**Start with:**
1. Initialize the monorepo structure
2. Set up PostgreSQL + Redis with Docker Compose
3. Implement Prisma schema and migrations
4. Create seed data for stances (healthcare, education, etc.)
5. Build basic CRUD API endpoints for candidates
6. Set up Next.js with TypeScript and Tailwind
7. Create main layout and navigation components

**Then build incrementally:**
- Each component with example data first
- Then connect to real API
- Add error handling and loading states
- Test with real voting record data

## DATA SOURCES INTEGRATION

**ProPublica Congress API:**
- Get member voting records
- Map to our Candidate by bioguide_id
- Import votes with bill details
- Update regularly (daily script)

**Content Moderation:**
- Automated checks for prohibited words ("opponent", party names)
- Character limits enforced
- Manual review queue for new submissions
- Verification workflow (email, government ID check)

## QUESTIONS TO ADDRESS AS WE BUILD

1. **Geographic scope**: Start with federal only, or include state/local?
2. **Verification process**: Email verification sufficient for MVP, or need more?
3. **First-time candidates**: How to handle those without voting records?
4. **Stance categories**: Start with 10-15 issues, which ones are priority?
5. **Bill relevance**: How to map bills to stance categories (manual or ML)?

## IMMEDIATE NEXT STEPS

Please help me:

1. **Initialize project structure**
   - Create folder structure
   - Set up package.json files
   - Configure TypeScript
   - Set up Docker Compose for PostgreSQL/Redis

2. **Implement Prisma schema**
   - Create the full schema based on our design
   - Set up migrations
   - Create seed file for stances

3. **Build basic backend**
   - Express server setup
   - Database connection
   - Basic candidate CRUD endpoints
   - Authentication middleware

4. **Frontend scaffolding**
   - Next.js project initialization
   - Tailwind + shadcn/ui setup
   - Main layout components
   - API client setup

Let's start with project initialization and database setup. I want to build this incrementally, testing each component before moving to the next. Please confirm you understand the requirements and let me know if you need any clarification before we begin.

For development:
- Use TypeScript strictly
- Follow REST API conventions
- Write clean, documented code
- Include error handling
- Use environment variables for all config
- Follow security best practices (input validation, SQL injection prevention, etc.)

Ready to start?