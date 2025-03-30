# Family Chore Tracker

A simple web app for tracking family chores, built with Next.js, React, and PostgreSQL.

## Features

- Track daily and weekly chores for each family member
- Assign chores to one or more family members
- Mark chores as completed
- View chores by timeframe (today or this week)
- Weekly report showing chore completion statistics
- Simple interface with color-coded family members

## Tech Stack

- **Frontend**: Next.js, React
- **Backend**: Next.js API routes
- **Database**: PostgreSQL (with Neon for production) / SQLite (for development)
- **Deployment**: Vercel

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/chipstar5000/choretracker.git
cd choretracker
```

2. Install dependencies:

```bash
npm install
```

3. Database Configuration:

- For local development, SQLite is used by default (no configuration needed)
- To use PostgreSQL locally, copy `.env.example` to `.env.local` and update the connection string

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment

### Setting up Neon Database

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new project
3. In your project dashboard, create a new database
4. Get your connection string from the "Connection Details" section

### Deploying to Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Link your GitHub repository
3. Configure environment variables in Vercel:
   - `USE_POSTGRES`: Set to `true`
   - `PG_CONNECTION_STRING`: Your Neon connection string

4. Deploy your project:

```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Deploy to Vercel
vercel
```

5. After deployment, initialize the database by visiting:
   `https://your-vercel-domain.vercel.app/api/init-db`
   (Make a POST request to this endpoint)

## Database Schema

- **family_members**: Stores family member information
- **chores**: Stores chore details
- **chore_assignments**: Junction table linking chores to family members

## Local Development Options

The project supports two database options:

1. **SQLite** (default for development):
   - No configuration needed
   - Data stored in `data/choretracker.db`

2. **PostgreSQL** (for production-like development):
   - Requires local PostgreSQL server
   - Update `.env.local` with your connection string

## License

ISC