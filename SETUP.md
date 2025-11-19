# Informed Voter Platform - Setup Guide

Complete installation and setup guide for the Informed Voter Platform.

## Quick Start (Automated)

The easiest way to get started:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This script will:
- Verify Node.js and Docker are installed
- Start PostgreSQL and Redis with Docker Compose
- Install all dependencies
- Create environment files
- Run database migrations
- Seed initial data

## Manual Setup

If you prefer to set up manually or the script doesn't work:

### 1. Prerequisites

Install the following:

- **Node.js 18+**: https://nodejs.org/
- **Docker & Docker Compose**: https://www.docker.com/
- **Git**: https://git-scm.com/

Verify installations:
```bash
node -v    # Should be 18.0.0 or higher
docker -v
docker-compose -v
```

### 2. Clone Repository

```bash
git clone <repository-url>
cd informed-voter-platform
```

### 3. Start Databases

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

Verify they're running:
```bash
docker-compose ps
```

You should see two containers running:
- `informed-voter-db` (PostgreSQL)
- `informed-voter-redis` (Redis)

### 4. Backend Setup

```bash
cd backend
```

#### Install Dependencies

```bash
npm install
```

#### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:

**Required:**
- `DATABASE_URL` - Already configured for Docker setup
- `JWT_SECRET` - Change to a secure random string
  ```bash
  # Generate a secure secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

**Optional (for full functionality):**
- `PROPUBLICA_API_KEY` - Get from https://www.propublica.org/datastore/api/propublica-congress-api
- `GOOGLE_CIVIC_API_KEY` - Get from https://console.cloud.google.com/
- `LEGISCAN_API_KEY` - Get from https://legiscan.com/legiscan
- `SENDGRID_API_KEY` - Get from https://sendgrid.com/ (for email notifications)

#### Run Database Migrations

```bash
npx prisma migrate dev
```

This creates all database tables.

#### Generate Prisma Client

```bash
npx prisma generate
```

#### Seed Database

```bash
npm run seed
```

This creates:
- 25 standardized policy stances
- Admin user (email: admin@informedvoter.org, password: admin123)
- Sample elections

#### Start Backend Server

```bash
npm run dev
```

Backend should now be running at `http://localhost:3001/api`

Test it:
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend
```

#### Install Dependencies

```bash
npm install
```

#### Configure Environment

```bash
cp .env.local.example .env.local
```

The default configuration should work:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### Start Frontend Server

```bash
npm run dev
```

Frontend should now be running at `http://localhost:3000`

### 6. Verify Setup

Open your browser to:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/health
- **Prisma Studio** (database GUI):
  ```bash
  cd backend
  npx prisma studio
  ```
  Opens at http://localhost:5555

## Development Workflow

### Running the Application

You need three terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Database GUI (optional):**
```bash
cd backend
npx prisma studio
```

### Stopping the Application

- Press `Ctrl+C` in each terminal to stop the servers
- Stop databases:
  ```bash
  docker-compose down
  ```

### Restarting After a Reboot

```bash
# Start databases
docker-compose up -d

# Start backend (in terminal 1)
cd backend && npm run dev

# Start frontend (in terminal 2)
cd frontend && npm run dev
```

## Common Issues

### Port Already in Use

If you see "Port 3000 is already in use":
```bash
# Find and kill the process using the port
lsof -ti:3000 | xargs kill -9
```

Same for port 3001 (backend) or 5432 (PostgreSQL).

### Database Connection Error

If backend can't connect to PostgreSQL:

1. Make sure Docker containers are running:
   ```bash
   docker-compose ps
   ```

2. Restart containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. Check DATABASE_URL in `backend/.env` matches:
   ```
   postgresql://postgres:postgres@localhost:5432/informed_voter?schema=public
   ```

### Prisma Client Not Generated

If you see "Cannot find module '@prisma/client'":

```bash
cd backend
npx prisma generate
```

### Frontend Can't Connect to Backend

1. Make sure backend is running on port 3001
2. Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
3. Verify CORS_ORIGIN in `backend/.env` includes `http://localhost:3000`

### Docker Issues

If Docker containers won't start:

```bash
# View logs
docker-compose logs

# Remove all containers and volumes (⚠️ deletes data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Next Steps

After setup:

1. **Explore the Application**
   - Visit http://localhost:3000
   - Try searching for candidates
   - Submit a test candidate profile

2. **View the Database**
   - Open Prisma Studio: `cd backend && npx prisma studio`
   - Browse stances, candidates, users

3. **Test the API**
   - Use Postman, Insomnia, or curl to test endpoints
   - See `backend/README.md` for API documentation

4. **Add Test Data**
   - Create test candidates via the UI
   - Use the admin account to verify candidates
   - Import voting records (requires API keys)

5. **Configure External APIs**
   - Get ProPublica API key for voting records
   - Get Google Civic API key for election data
   - See `backend/.env.example` for all options

## Getting Help

- Check `README.md` for project overview
- See `backend/README.md` for backend documentation
- See `frontend/README.md` for frontend documentation
- Review `docs/` folder for detailed architecture

## Production Deployment

For production deployment, see:
- `docs/DEPLOYMENT.md` (to be created)
- Use environment-specific `.env` files
- Run `npm run build` instead of `npm run dev`
- Use a process manager like PM2 or deploy to a platform like Vercel/Railway
