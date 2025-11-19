# Informed Voter Platform

A non-partisan web application that helps voters evaluate political candidates based on verified information and voting records rather than party affiliation.

## Overview

The Informed Voter Platform enables citizens to:
- Discover political candidates by location and office type
- View candidate profiles with bios, goals, and policy stances
- Compare what candidates SAY vs what they actually VOTE for
- Access verified voting records from official government sources
- Make informed decisions without party affiliation bias

## Key Principles

- **No Party Affiliation**: Party labels are not displayed anywhere in the app
- **Verified Information Only**: All voting records come from official government sources
- **Transparency**: Side-by-side comparison of stated positions vs actual votes
- **Content Moderation**: Candidates cannot mention opponents; profiles are verified
- **Accessibility**: Mobile-responsive design meeting WCAG 2.1 AA standards

## Tech Stack

### Backend
- Node.js with Express + TypeScript
- PostgreSQL database
- Prisma ORM
- Redis for caching
- JWT authentication

### Frontend
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui components
- React Query for data fetching
- Leaflet for interactive maps

### External APIs
- ProPublica Congress API (federal voting records)
- Google Civic Information API (elections/districts)
- LegiScan API (state legislatures)

## Project Structure

```
informed-voter-platform/
├── backend/          # Express API server
├── frontend/         # Next.js application
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd informed-voter-platform
```

2. **Start databases**
```bash
docker-compose up -d
```

3. **Set up backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```

4. **Set up frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your configuration
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: `npx prisma studio` (from backend directory)

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npx prisma studio    # Open database GUI
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

## API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

## Database Schema

See [docs/DATABASE.md](docs/DATABASE.md) for database schema documentation.

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.

## License

[Add license information]

## Contact

[Add contact information]
