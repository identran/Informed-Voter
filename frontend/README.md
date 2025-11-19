# Informed Voter Platform - Frontend

Next.js 14 application for the Informed Voter Platform.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Query (TanStack Query)
- Leaflet (maps)
- Recharts (visualizations)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Backend API running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

3. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router pages
│   ├── (public)/           # Public pages group
│   ├── candidates/         # Candidate-related pages
│   ├── search/             # Search page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout components (Header, Footer)
│   ├── candidate/          # Candidate-related components
│   ├── search/             # Search components
│   └── shared/             # Shared components
├── lib/
│   ├── api/                # API client
│   └── utils/              # Utility functions
└── types/                  # TypeScript types
```

## Key Features

### Home Page
- Search hero with quick location search
- "How It Works" section
- Featured candidates
- Mission statement

### Candidate Search
- Search by location (zip code, city, state)
- Filter by office type, district
- Paginated results
- Candidate cards with key information

### Candidate Profile
- Verified candidate information
- Bio, goals, and reasons for running
- Policy positions on key issues
- Contact information
- Election details

### Says vs Does Comparison
- Side-by-side comparison of stated positions vs voting records
- Visual indicators for consistency
- Links to official vote sources
- Bill details and summaries

### Candidate Submission
- Multi-step form for candidate profile creation
- Content validation and character limits
- Automatic moderation checks
- Submission confirmation

## API Integration

The frontend uses React Query to interact with the backend API. API clients are located in `src/lib/api/`:

- `auth.ts` - Authentication endpoints
- `candidates.ts` - Candidate CRUD operations
- `stances.ts` - Policy stances
- `votingRecords.ts` - Voting records and comparisons

All API requests go through the central `client.ts` which handles:
- Authentication tokens
- Request/response formatting
- Error handling

## Styling

The application uses Tailwind CSS with a custom design system:

- Color tokens defined in `globals.css`
- Responsive utility classes
- Dark mode support (not yet enabled)
- shadcn/ui component library for consistent UI

### Adding New Components

To add a new shadcn/ui component:

1. Check [shadcn/ui documentation](https://ui.shadcn.com)
2. Copy component code to `src/components/ui/`
3. Customize as needed

## State Management

- **React Query** - Server state and caching
- **Local Storage** - Authentication token
- **URL Search Params** - Search/filter state

No global state management library is used. Component state is managed locally with useState/useReducer.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL` - Your backend API URL
4. Deploy

### Docker

Build and run:
```bash
docker build -t informed-voter-frontend .
docker run -p 3000:3000 informed-voter-frontend
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Performance

- Server components for static content
- Client components only where needed
- React Query caching for API responses
- Image optimization with Next.js Image
- Code splitting and lazy loading

## Accessibility

The application follows WCAG 2.1 AA guidelines:

- Semantic HTML
- Keyboard navigation support
- ARIA labels where appropriate
- Color contrast ratios meet AA standards
- Focus indicators

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add license information]
