# TruthForge AI - Environment Setup & Deployment Guide

## Environment Configuration

TruthForge AI uses environment variables to manage configuration for different deployment environments (development, staging, production). All configuration is loaded from a `.env` file at startup.

### Setting Up Your Environment

#### 1. Create `.env` File

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

#### 2. Configure Environment Variables

Edit `.env` and provide values for each variable:

```env
# Node environment
NODE_ENV=development

# Server configuration
PORT=3000

# Database configuration
TRUTHFORGE_DB_PATH=./truthforge.db
DATABASE_URL=sqlite:./truthforge.db

# Gemini API configuration
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Logging configuration
LOG_LEVEL=info
```

### Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | development | Node environment (development, staging, production) |
| `PORT` | number | 3000 | Server port for API endpoints |
| `TRUTHFORGE_DB_PATH` | string | ./truthforge.db | Path to SQLite database file |
| `DATABASE_URL` | string | sqlite:./truthforge.db | Database connection URL |
| `GEMINI_API_KEY` | string | (required) | Google Gemini API key for reasoning engine |
| `GEMINI_MODEL` | string | gemini-2.0-flash | Gemini model version to use |
| `LOG_LEVEL` | string | info | Logging level (debug, info, warn, error) |

### Getting Gemini API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gemini API
4. Create an API key credential
5. Copy the key to `GEMINI_API_KEY` in your `.env` file

### Important Security Notes

⚠️ **Never commit `.env` to version control!**
- The `.env` file is listed in `.gitignore` and should never be committed
- Always use `.env.example` as a template for new environments
- Never share your `.env` file or API keys with others
- Rotate API keys regularly

## Development Setup

### Prerequisites

- Node.js 18+ or Bun
- npm or Bun package manager

### Installation

1. Install dependencies:

```bash
npm install
# or with Bun
bun install
```

2. Create and configure `.env`:

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and other values
```

3. Start development server:

```bash
npm run dev
# or
bun run dev
```

The frontend will be available at `http://localhost:5173` (Vite default).

## Backend Architecture

TruthForge uses environment variables throughout the system:

### TypeScript API (`src/truthforge_api.ts`)

```typescript
// Loads environment variables via dotenv
import 'dotenv/config';

// Access environment variables in code
const dbPath = process.env.TRUTHFORGE_DB_PATH || './truthforge.db';
const geminiKey = process.env.GEMINI_API_KEY;
const logLevel = process.env.LOG_LEVEL || 'info';
```

### Jac Configuration (`src/truthforge_config.jac`)

```jac
# Global configuration read from environment variables
global GEMINI_API_KEY = "";  # Set from process.env.GEMINI_API_KEY
global GEMINI_MODEL = "gemini-2.0-flash";  # Can be overridden
global DB_PATH = "./truthforge.db";  # Can be overridden by TRUTHFORGE_DB_PATH
global LOG_LEVEL = "info";  # Can be overridden by LOG_LEVEL
```

## Production Deployment

### Environment Configuration

For production deployment:

1. Set `NODE_ENV=production`
2. Use environment-specific values:
   - Dedicated production database path
   - Production API keys
   - Appropriate log level (usually `warn` or `error`)

### Example Production `.env`

```env
NODE_ENV=production
PORT=3000
TRUTHFORGE_DB_PATH=/var/lib/truthforge/truthforge.db
DATABASE_URL=sqlite:/var/lib/truthforge/truthforge.db
GEMINI_API_KEY=prod_key_xyz
GEMINI_MODEL=gemini-2.0-flash
LOG_LEVEL=warn
```

### Database Setup

1. Ensure database directory exists and has write permissions
2. Database will be automatically initialized on first run using schema in `src/truthforge_schema.sql`

## Troubleshooting

### Missing API Key

If you see errors about missing GEMINI_API_KEY:
1. Verify `.env` file exists in project root
2. Check that `GEMINI_API_KEY` is set and not empty
3. Ensure the key has proper permissions for Gemini API

### Database Errors

If database operations fail:
1. Verify `TRUTHFORGE_DB_PATH` points to an accessible location
2. Check file permissions on the database directory
3. Ensure the path exists or can be created

### Configuration Not Loading

If environment variables aren't being read:
1. Verify `dotenv` package is installed: `npm list dotenv`
2. Check that `.env` file is in project root
3. Restart the development server after changing `.env`

## Next Steps

After setting up environment configuration:

1. Configure your Gemini API key
2. Verify database connectivity
3. Start the development server
4. Begin integrating Gemini API and web search functionality
