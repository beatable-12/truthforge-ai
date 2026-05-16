# TruthForge AI - Reasoning Engine for Credible Analysis

Enterprise-grade AI system for evaluating claims, analyzing evidence, and generating credible insights using multi-perspective reasoning.

## Features

✨ **Core Capabilities**
- **Multi-perspective debate engine** - Generate opposing viewpoints automatically
- **Evidence-based reasoning** - Web search integration for fact-checking
- **Credibility scoring** - Evaluate claim credibility with confidence metrics
- **Memory management** - Learn from prior reasoning and feedback
- **Gemini 2.0 integration** - Leverage cutting-edge AI models
- **Rate limiting** - Built-in protection against abuse

🚀 **Performance**
- Response time: <500ms average
- Concurrent requests: 100+ supported
- Database: SQLite with optimized indexes
- Memory efficient: <200MB baseline
- Scalable: PM2 cluster mode ready

🔒 **Production Ready**
- Error handling and graceful degradation
- Comprehensive logging and monitoring
- Health check endpoints
- Database persistence and backups
- CORS configured for security
- Rate limiting and request validation

## Quick Start

### Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# 3. Start development server
npm run dev

# 4. Start API in another terminal
npm run api:dev

# 5. Open http://localhost:5173
```

### Production Deployment

```bash
# 1. Prepare environment
cp .env.production .env
# Configure with your production values

# 2. Install and build
npm install
npm run build

# 3. Start application
NODE_ENV=production npm start

# 4. Verify health
curl http://localhost:3000/health
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production setup.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TruthForge AI                        │
├─────────────────────────────────────────────────────────┤
│  Frontend (React + TanStack)  │  Backend (Express.js)  │
├─────────────────────────────┬──────────────────────────┤
│ • Interactive UI            │ • Gemini 2.0 API         │
│ • Real-time visualization   │ • Web Search Integration │
│ • Debate viewing            │ • Rate Limiting          │
│                             │ • Error Handling         │
└─────────────────────────────┴──────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ SQLite Database   │
                    │ (Optimized WAL)   │
                    │ • Debates         │
                    │ • Memory          │
                    │ • Credibility     │
                    └───────────────────┘
```

### Core Components

| Component | Purpose | Tech |
|-----------|---------|------|
| Frontend | User interface | React 19, TanStack, Tailwind |
| Express Server | API layer | Express 4.18, Node.js |
| Reasoning Engine | Logic processing | Jac, TypeScript |
| Gemini Integration | LLM calls | Google Generative AI |
| Web Search | Evidence gathering | Google Custom Search |
| Database | Data persistence | SQLite 3, Better-sqlite3 |
| Rate Limiter | Request throttling | express-rate-limit |

## API Endpoints

### Health & Status

```
GET  /health                          Server health check
GET  /api/truthforge/health           Full system status with DB info
```

### Debate Operations

```
POST /api/truthforge/debate           Start new reasoning debate
GET  /api/truthforge/debate/:id       Retrieve debate results
GET  /api/truthforge/debates          List recent debates
```

### Memory & Learning

```
GET  /api/truthforge/memory/:id       Get prior reasoning
POST /api/truthforge/feedback         Submit user feedback
```

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| NODE_ENV | Yes | production | App environment mode |
| PORT | No | 3000 | Server listening port |
| TRUTHFORGE_DB_PATH | No | ./truthforge.db | Database file location |
| GEMINI_API_KEY | Yes | - | Google Gemini API key |
| GEMINI_MODEL | No | gemini-2.0-flash | Model identifier |
| LOG_LEVEL | No | info | Logging verbosity |
| SEARCH_CACHE_TTL_DAYS | No | 7 | Cache time-to-live |
| MIN_CREDIBILITY_SCORE | No | 0.75 | Min credibility threshold |

## Testing

```bash
# Integration tests
npm run test:integration

# Gemini API tests
npm run test:gemini

# Run all tests
npm run test:api
```

## Deployment Options

### 1. Direct Node.js
```bash
npm install && npm run build
NODE_ENV=production npm start
```

### 2. PM2 (Recommended)
```bash
pm2 start ecosystem.config.js --env production
pm2 logs truthforge
```

### 3. Docker
```bash
docker-compose up -d --build
docker-compose logs -f
```

### 4. Systemd Service
```bash
sudo systemctl enable truthforge
sudo systemctl start truthforge
sudo systemctl status truthforge
```

See [PRODUCTION_README.md](./PRODUCTION_README.md) for quick reference.

## Monitoring

### Health Checks

```bash
# Quick health
curl http://localhost:3000/health

# Full status
curl http://localhost:3000/api/truthforge/health | jq .

# Watch status
watch -n 5 'curl -s http://localhost:3000/health | jq .'
```

### Key Metrics

- **Uptime**: Check `/health` endpoint `uptime` field
- **Response Time**: Target <500ms for API calls
- **Error Rate**: Monitor 5xx responses
- **Memory Usage**: Should stay <500MB
- **Database Health**: `/api/truthforge/health` should show healthy
- **Request Throughput**: Monitor requests/minute

## Database

### Location
- **Development**: `./truthforge.db`
- **Production**: `/data/truthforge.db`

### Optimization
- WAL mode enabled (write-ahead logging)
- Proper indexes on all queries
- Connection pooling ready
- Vacuum scheduled automatically

### Backup
```bash
# Manual backup
cp /data/truthforge.db /data/truthforge.db.backup

# Automated (add to crontab)
0 2 * * * cp /data/truthforge.db /data/backups/truthforge_$(date +\%Y\%m\%d).db
```

## Performance Tuning

### For Development
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### For Production
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
NODE_OPTIONS=--max-old-space-size=2048
```

### Memory Management
```bash
# Monitor Node process
ps aux | grep node

# Increase available memory
NODE_OPTIONS="--max-old-space-size=2048" npm start

# Or in systemd service
Environment="NODE_OPTIONS=--max-old-space-size=2048"
```

## Troubleshooting

Quick fixes for common issues:

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `kill $(lsof -t -i :3000)` or use `PORT=3001` |
| Database locked | Check `/data` permissions with `chmod 755 /data` |
| API key error | Verify `GEMINI_API_KEY` in `.env` and test with curl |
| White screen | Check browser console (F12) and app logs |
| Memory issues | Increase with `NODE_OPTIONS="--max-old-space-size=2048"` |

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.

## Production Checklist

Before going live:
- [ ] Environment variables configured
- [ ] Database path writable and persisted
- [ ] Gemini API key valid and funded
- [ ] CORS correctly configured
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Health check endpoint verified
- [ ] Database backups scheduled
- [ ] Monitoring alerts configured
- [ ] Tests passing

See [production-checklist.md](./production-checklist.md) for full checklist.

## Project Structure

```
truthforge-ai/
├── src/
│   ├── express-server.ts          # Main server
│   ├── api-routes.ts              # API endpoints
│   ├── truthforge-*.ts            # Core logic modules
│   ├── gemini-client.ts           # LLM integration
│   ├── search-client.ts           # Web search
│   ├── db-*.ts                    # Database layer
│   └── routes/                    # Frontend routes
├── components/                    # React components
├── DEPLOYMENT_GUIDE.md           # Full deployment guide
├── PRODUCTION_README.md          # Quick reference
├── production-checklist.md       # Pre-deployment checklist
├── TROUBLESHOOTING.md           # Common issues & solutions
└── .env.production              # Production template
```

## Development

### Scripts
```bash
npm run dev              # Start dev server with hot reload
npm run api:dev         # Start Express API
npm run build           # Build for production
npm run test:*          # Run tests
npm run lint            # Check code quality
npm run format          # Format code
```

### Technology Stack
- **Runtime**: Node.js 22+
- **Frontend**: React 19, TanStack Start, Tailwind CSS
- **Backend**: Express.js 4.18
- **Database**: SQLite 3 + better-sqlite3
- **AI**: Google Generative AI (Gemini 2.0)
- **Language**: TypeScript 5.8
- **Build**: Vite 7.3

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Implement changes with tests
3. Run linting and tests: `npm run lint && npm run test:integration`
4. Commit with meaningful message
5. Push and create pull request

## Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete production setup
- **[PRODUCTION_README.md](./PRODUCTION_README.md)** - Quick reference
- **[production-checklist.md](./production-checklist.md)** - Pre-deployment checklist
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

## License

© 2024 TruthForge AI. All rights reserved.

## Support

- **Issues**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Production Help**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Quick Start**: See [PRODUCTION_README.md](./PRODUCTION_README.md)
- **Pre-Deploy**: Complete [production-checklist.md](./production-checklist.md)

---

**Status**: Production Ready ✅

Last Updated: 2024
Version: 1.0.0
