# TruthForge AI - Production Deployment Guide

Complete guide for deploying TruthForge AI to production environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Gemini API Setup](#gemini-api-setup)
5. [Running the Application](#running-the-application)
6. [Monitoring and Health Checks](#monitoring-and-health-checks)
7. [Scaling Considerations](#scaling-considerations)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- **Node.js 22+** - `node --version` should show v22.x or higher
- **npm 10+** - `npm --version` should show 10.x or higher
- **SQLite 3** - Pre-installed on most systems
- **1GB+ RAM** - Minimum recommended
- **2GB free disk space** - For database and logs

### Optional
- **Docker 24+** - For containerized deployment
- **PM2** - For process management and auto-restart
- **Git** - For deployment via git pull

### System Requirements
| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| CPU Cores | 1 | 2+ |
| RAM | 512MB | 2GB+ |
| Disk Space | 1GB | 5GB+ |
| Node.js | 20 LTS | 22+ |

## Environment Setup

### 1. Create `.env` file from template

```bash
cp .env.production .env
```

### 2. Configure environment variables

Edit `.env` with your production values:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
TRUTHFORGE_DB_PATH=/data/truthforge.db

# Gemini API (REQUIRED)
GEMINI_API_KEY=your-production-api-key-here
GEMINI_MODEL=gemini-2.0-flash

# Logging
LOG_LEVEL=info

# Search Configuration
SEARCH_CACHE_TTL_DAYS=7
MIN_CREDIBILITY_SCORE=0.75
SEARCH_RESULT_LIMIT=10

# Optional: Google Custom Search (if using web search)
GOOGLE_SEARCH_API_KEY=your-key-here
GOOGLE_SEARCH_ENGINE_ID=your-cx-here
```

### 3. Validate configuration

```bash
# Check all required variables are set
node -e "const env = require('dotenv').config(); Object.keys(env.parsed || {}).forEach(k => console.log(k))"
```

## Database Configuration

### 1. Create database directory

```bash
mkdir -p /data
chmod 755 /data
```

### 2. Initialize database

```bash
# Database will be auto-initialized on first run
# Or manually initialize:
NODE_ENV=production node --loader ts-node/esm src/express-server.ts

# Wait for message: "✓ Database initialized: X tables, Y indexes"
# Then stop with Ctrl+C
```

### 3. Setup database backups

Create a backup script (`backup-db.sh`):

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/data/backups"
DB_FILE="/data/truthforge.db"

mkdir -p "$BACKUP_DIR"
cp "$DB_FILE" "$BACKUP_DIR/truthforge_$DATE.db"

# Keep only last 30 backups
find "$BACKUP_DIR" -name "truthforge_*.db" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/truthforge_$DATE.db"
```

Make executable and add to crontab:

```bash
chmod +x backup-db.sh
crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh  (daily at 2 AM)
```

### 4. Set permissions

```bash
# Ensure database directory is writable
chmod 755 /data
chmod 644 /data/truthforge.db

# For production security
umask 0022
```

## Gemini API Setup

### 1. Create API key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Copy the key to `.env` as `GEMINI_API_KEY`

### 2. Verify API key

```bash
# Test the Gemini API connection
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Say hello"}]}]}'
```

### 3. Monitor API usage

- Check [Google Cloud Console](https://console.cloud.google.com) for:
  - API usage quota
  - Request rate limits
  - Error logs
  - Billing status

### 4. Rate limiting

The application includes built-in rate limiting:
- 10 requests per minute per session
- Adjustable in `.env` if needed
- Respects Gemini API rate limits

## Running the Application

### Option A: Direct Node.js (Recommended)

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Start application
NODE_ENV=production npm start
```

Monitor output:
- Look for: `✓ TruthForge API server running on http://localhost:3000`
- Check: `✓ Database initialized`
- Verify: Available endpoints listed

### Option B: Using PM2 (Recommended for production)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2 ecosystem config
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# Monitor logs
pm2 logs truthforge

# Auto-start on boot
pm2 startup
pm2 save
```

### Option C: Docker (If using containerization)

```bash
# Build image
docker build -t truthforge:latest .

# Run container
docker-compose up -d --build

# Check logs
docker-compose logs -f truthforge
```

### Option D: Using deployment script

```bash
# Run the deployment script
./deploy.sh

# Script will:
# - Git pull latest
# - npm install
# - Build frontend
# - Start application
# - Verify health checks
```

## Monitoring and Health Checks

### Health Check Endpoints

| Endpoint | Purpose | Expected Status |
|----------|---------|-----------------|
| `GET /health` | Basic server health | 200 OK |
| `GET /api/truthforge/health` | Full system health | 200 OK |

### Check health status

```bash
# Basic health
curl http://localhost:3000/health

# Full health with database info
curl http://localhost:3000/api/truthforge/health

# With pretty JSON output
curl -s http://localhost:3000/health | jq .
```

### Response format

```json
{
  "status": "healthy",
  "service": "truthforge-api",
  "database": {
    "healthy": true,
    "message": "Database connection successful",
    "lastCheck": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Monitoring with systemd

If using systemd service (see `PRODUCTION_README.md`):

```bash
# Check service status
systemctl status truthforge

# View logs
journalctl -u truthforge -f

# Check recent errors
journalctl -u truthforge -n 50 -p err
```

### Set up monitoring alerts

Monitor these metrics:

1. **Uptime**: `uptime` field should continuously increase
2. **Response Time**: Track API response times (target: <500ms)
3. **Error Rate**: Monitor 5xx responses
4. **Memory Usage**: Node process shouldn't exceed 1GB
5. **Database**: Ensure `healthy: true`

### Example monitoring with cron

Create `monitor.sh`:

```bash
#!/bin/bash
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
  echo "OK: $(date)"
else
  echo "ALERT: Service unhealthy at $(date)"
  # Send alert (email, Slack, etc.)
fi
```

Add to crontab every 5 minutes:
```bash
*/5 * * * * /path/to/monitor.sh >> /var/log/truthforge-monitor.log
```

## Scaling Considerations

### Single Server

- Suitable for: <1000 users/day
- Configuration: Direct Node.js or PM2
- Monitoring: Basic health checks

### Multiple Instances

For higher load, run multiple instances with load balancer:

```bash
# With PM2 cluster mode
pm2 start ecosystem.config.js --env production -i max

# With Nginx load balancing
# See: nginx.conf example in project docs
```

### Database Optimization

For high load:

1. **Enable WAL mode**: Already configured in db-init
2. **Index optimization**: Already configured
3. **Connection pooling**: Single connection (SQLite limitation)
4. **Cache strategy**: Implement response caching

### Performance Tips

1. **Set NODE_ENV=production** - Enables optimizations
2. **Use PM2 cluster mode** - Multiple processes
3. **Enable gzip compression** - Reduce payload size
4. **Cache search results** - 7-day default TTL
5. **Monitor memory** - Restart if exceeds threshold

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions to common issues.

Quick reference:
- **Port in use**: Change `PORT` in `.env` or kill existing process
- **Database locked**: Check file permissions on `/data/truthforge.db`
- **Gemini API errors**: Verify `GEMINI_API_KEY` in `.env`
- **White screen**: Check browser console and app logs
- **Memory issues**: Increase Node memory or use PM2 auto-restart

## Production Checklist

Before deploying to production, verify all items in [production-checklist.md](./production-checklist.md):

- [ ] Environment variables configured
- [ ] Database path writable
- [ ] Gemini API key valid
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Health check endpoints verified
- [ ] Database backups scheduled

## Support

For issues and support:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review application logs in `/data/logs/`
- Check Gemini API status: https://status.cloud.google.com
- Report issues with full error output and logs

## Next Steps

1. Follow [PRODUCTION_README.md](./PRODUCTION_README.md) for quick reference
2. Complete [production-checklist.md](./production-checklist.md)
3. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Set up monitoring and alerts
5. Configure database backups
6. Test all endpoints before going live
