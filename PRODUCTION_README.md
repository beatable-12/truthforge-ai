# TruthForge AI - Production Quick Reference

Quick startup and troubleshooting reference for production environments.

## Quick Start

### Minimal Setup (5 minutes)

```bash
# 1. Create and configure environment
cp .env.production .env
# Edit .env with your GEMINI_API_KEY

# 2. Prepare database directory
mkdir -p /data
chmod 755 /data

# 3. Install and start
npm install
npm run build
NODE_ENV=production npm start
```

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 logs truthforge
```

### Using Docker

```bash
docker-compose up -d --build
docker-compose logs -f
```

## Health Checks

### Verify system is running

```bash
# Quick health check
curl http://localhost:3000/health

# Full system status
curl http://localhost:3000/api/truthforge/health | jq .

# All endpoints
curl http://localhost:3000/health && echo "✓ OK"
```

### Expected output

```json
{
  "status": "healthy",
  "database": { "healthy": true }
}
```

## Common Commands

### Check status

```bash
# If using PM2
pm2 status
pm2 info truthforge

# If using systemd
systemctl status truthforge

# If using docker
docker-compose ps
```

### View logs

```bash
# PM2 logs
pm2 logs truthforge

# Systemd logs
journalctl -u truthforge -f

# Docker logs
docker-compose logs -f truthforge

# File-based logs
tail -f /var/log/truthforge/app.log
```

### Restart

```bash
# PM2
pm2 restart truthforge

# Systemd
systemctl restart truthforge

# Docker
docker-compose restart truthforge
```

## Environment Variables Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| NODE_ENV | Yes | production | Enable production optimizations |
| PORT | No | 3000 | Server port |
| TRUTHFORGE_DB_PATH | No | ./truthforge.db | Database file location |
| GEMINI_API_KEY | Yes | - | Google Gemini API key |
| GEMINI_MODEL | No | gemini-2.0-flash | Model to use |
| LOG_LEVEL | No | info | Logging verbosity |
| SEARCH_CACHE_TTL_DAYS | No | 7 | Cache time-to-live |
| MIN_CREDIBILITY_SCORE | No | 0.75 | Minimum credibility threshold |

## Database Location

- **Development**: `./truthforge.db` (current directory)
- **Production**: `/data/truthforge.db` (recommend)
- **Custom**: Set `TRUTHFORGE_DB_PATH` in `.env`

Ensure directory is writable:
```bash
chmod 755 /data
chmod 644 /data/truthforge.db
```

## Log Location

| When | Path | Command |
|------|------|---------|
| PM2 logs | `~/.pm2/logs/` | `pm2 logs` |
| Systemd logs | `/var/log/` | `journalctl -u truthforge` |
| Docker logs | stdout | `docker-compose logs` |
| App logs | `/data/logs/` | `cat /data/logs/app.log` |

## Startup Commands

### Start

```bash
# Development
npm run dev

# Production (direct)
NODE_ENV=production npm start

# Production (PM2)
pm2 start ecosystem.config.js --env production

# Production (Docker)
docker-compose up -d

# Production (script)
./deploy.sh
```

### Monitor

```bash
pm2 monit            # Watch resources
pm2 logs             # Stream logs
pm2 info truthforge  # Details
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Server health |
| GET | `/api/truthforge/health` | Full system health |
| POST | `/api/truthforge/debate` | Start reasoning |
| GET | `/api/truthforge/debate/:id` | Get result |
| GET | `/api/truthforge/debates` | List recent |
| GET | `/api/truthforge/memory/:id` | Get memory |
| POST | `/api/truthforge/feedback` | Submit feedback |

### Test endpoints

```bash
# Test health
curl http://localhost:3000/health

# Test API
curl -X POST http://localhost:3000/api/truthforge/debate \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?"}'
```

## Common Issues & Quick Fixes

### Port 3000 already in use

```bash
# Find process using port
lsof -i :3000

# Kill by PID
kill -9 <PID>

# Or use different port
PORT=3001 NODE_ENV=production npm start
```

### "Cannot find module" or "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database locked or corrupted

```bash
# Check permissions
ls -la /data/truthforge.db

# Fix permissions
chmod 644 /data/truthforge.db
chmod 755 /data

# Or backup and restart fresh
cp /data/truthforge.db /data/truthforge.db.backup
rm /data/truthforge.db
NODE_ENV=production npm start
```

### Gemini API errors

```bash
# Verify API key in .env
echo $GEMINI_API_KEY

# Test API connection
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Test"}]}]}'
```

### High memory usage

```bash
# Check Node memory
ps aux | grep node

# Increase available memory or restart
pm2 restart truthforge

# With memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

## Performance Tuning

### For production

```bash
# Set in .env or systemd service
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048
```

### Monitor resources

```bash
# Real-time monitoring with PM2
pm2 monit

# With Node stats
pm2 stats

# System stats
free -m  # Memory
df -h    # Disk
top      # CPU
```

## Backup & Recovery

### Backup database

```bash
# Manual backup
cp /data/truthforge.db /data/truthforge.db.backup

# Restore
cp /data/truthforge.db.backup /data/truthforge.db
```

### Setup daily backups

```bash
# Add to crontab
0 2 * * * cp /data/truthforge.db /data/backups/truthforge_$(date +\%Y\%m\%d).db
```

## Pre-Production Checklist

Before going live:

- [ ] `.env` configured with production values
- [ ] `GEMINI_API_KEY` set and tested
- [ ] Database directory `/data` created and writable
- [ ] Health check responds with `"status": "healthy"`
- [ ] All API endpoints working
- [ ] Logging configured
- [ ] Database backups scheduled
- [ ] Monitoring alerts enabled
- [ ] Rate limiting verified (10 req/min)
- [ ] CORS configured correctly

## Auto-Restart on Reboot

### PM2

```bash
pm2 startup
pm2 save
# Automatically starts on system boot
```

### Systemd

See `truthforge.service` for systemd setup:
```bash
sudo cp truthforge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable truthforge
sudo systemctl start truthforge
```

## Emergency Restart

If service won't start:

```bash
# Check what's wrong
NODE_ENV=production node --loader ts-node/esm src/express-server.ts

# Kill any stuck processes
pkill -f "node"
pkill -f "truthforge"

# Try again
pm2 restart truthforge
# or
systemctl restart truthforge
```

## Need Help?

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions
2. Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full documentation
3. Check application logs: `pm2 logs truthforge`
4. Verify API key and rate limits
5. Ensure database file is not locked

For issues:
- Full error message + logs
- Output of `NODE_ENV=production npm start`
- Result of `curl http://localhost:3000/health`
- System info: `uname -a`, `node --version`, `npm --version`
