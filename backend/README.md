# Informed Voter Platform - Backend

Express.js API server for the Informed Voter Platform.

## Tech Stack

- Node.js 18+
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 (via Docker or installed locally)
- Redis (via Docker or installed locally)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT tokens
- API keys for external services (ProPublica, Google Civic, etc.)

3. Start databases (using Docker Compose from project root):
```bash
cd ..
docker-compose up -d
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Seed the database:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001/api`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with initial data
- `npm run prisma:studio` - Open Prisma Studio GUI
- `npm run prisma:migrate` - Run database migrations
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Candidates
- `GET /api/candidates` - Search candidates
- `GET /api/candidates/:id` - Get candidate by ID
- `POST /api/candidates` - Create candidate profile
- `PUT /api/candidates/:id` - Update candidate profile
- `POST /api/candidates/:id/stances` - Add stance to candidate
- `PUT /api/candidates/:id/stances/:stanceId` - Update candidate stance

### Stances
- `GET /api/stances` - Get all stances
- `GET /api/stances/categories` - Get stance categories
- `GET /api/stances/category/:category` - Get stances by category
- `GET /api/stances/:id` - Get stance by ID

### Voting Records
- `GET /api/voting-records/candidate/:candidateId` - Get voting records for candidate
- `GET /api/voting-records/comparison/:candidateId` - Get all comparisons for candidate
- `GET /api/voting-records/comparison/:candidateId/:stanceId` - Get specific comparison

### Admin (requires authentication)
- `GET /api/candidates/admin/pending` - Get pending candidate submissions
- `PUT /api/candidates/:id/verification` - Update verification status
- `POST /api/voting-records` - Create voting record
- `POST /api/voting-records/bulk` - Bulk create voting records

## Database Schema

The database uses Prisma ORM with PostgreSQL. Main models:

- **User** - Platform users (voters, candidates, admins)
- **Candidate** - Candidate profiles with verification status
- **Stance** - Standardized policy position categories
- **CandidateStance** - Candidate's stated positions on stances
- **Bill** - Legislative bills from various sources
- **VotingRecord** - Individual votes by candidates on bills
- **BillStance** - Mapping of bills to related stances
- **Election** - Election information

See `prisma/schema.prisma` for full schema definition.

## External API Integrations

### ProPublica Congress API
- Fetches federal voting records
- Updates member information
- Imports bill data

Configure with `PROPUBLICA_API_KEY` in `.env`

## Content Moderation

The platform includes automated content validation:
- Prohibits party affiliation mentions
- Blocks opponent references
- Enforces character limits
- Sanitizes user input

See `src/utils/contentValidation.ts` for implementation.

## Development

### Database Migrations

Create a new migration:
```bash
npx prisma migrate dev --name migration_name
```

Reset database (⚠️ deletes all data):
```bash
npx prisma migrate reset
```

### Viewing Data

Open Prisma Studio to browse data:
```bash
npm run prisma:studio
```

### Adding New Endpoints

1. Create service in `src/services/`
2. Create controller in `src/controllers/`
3. Add routes in `src/routes/`
4. Import routes in `src/routes/index.ts`

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Run migrations:
```bash
npx prisma migrate deploy
```

4. Start the server:
```bash
npm start
```

## License

[Add license information]
