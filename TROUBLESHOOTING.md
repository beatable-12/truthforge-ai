# TruthForge AI - Troubleshooting Guide

Solutions for common issues in production deployment.

## Quick Diagnosis

### Check if app is running

```bash
# Is port 3000 listening?
netstat -tuln | grep 3000
# or
lsof -i :3000

# Is process running?
ps aux | grep node
pgrep -f "truthforge\|express-server"

# Health check
curl http://localhost:3000/health
```

---

## Port Already in Use

**Symptom**: `Error: listen EADDRINUSE :::3000`

### Solution 1: Find and kill the process

```bash
# Find process on port 3000
lsof -i :3000
# Output: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME

# Kill by PID
kill -9 <PID>

# Verify it's gone
lsof -i :3000  # Should return nothing
```

### Solution 2: Use different port

```bash
# Edit .env
PORT=3001

# Or run with different port
PORT=3001 NODE_ENV=production npm start
```

### Solution 3: Check what's using the port

```bash
# Show process details
netstat -tuln | grep 3000
ps aux | grep $(lsof -t -i :3000)

# Look for:
# - Other node processes
# - Leftover PM2 instances
# - Docker containers
```

### Prevention

```bash
# Clean process before restart
pm2 delete truthforge
pm2 start ecosystem.config.js --env production

# Or with systemd
systemctl stop truthforge
systemctl start truthforge
```

---

## Database Locked / Connection Failed

**Symptom**: 
```
Error: database is locked
SQLITE_CANTOPEN: unable to open database file
```

### Solution 1: Check file permissions

```bash
# Check database file
ls -la /data/truthforge.db

# Should show:
# -rw-r--r-- 1 user user 1234567 Jan 15 10:30 /data/truthforge.db

# Fix permissions if wrong
chmod 644 /data/truthforge.db
chmod 755 /data
```

### Solution 2: Verify directory exists

```bash
# Create if missing
mkdir -p /data
chmod 755 /data

# Verify it exists
ls -la /data/truthforge.db
```

### Solution 3: Check for stuck processes

```bash
# Find processes accessing the database
lsof /data/truthforge.db

# If multiple processes are holding it:
# Kill all and restart
pkill -f node
sleep 2
NODE_ENV=production npm start
```

### Solution 4: Backup and reset database

```bash
# Backup current database
cp /data/truthforge.db /data/truthforge.db.backup

# Move the problematic database
mv /data/truthforge.db /data/truthforge.db.corrupted

# Restart to create new database
NODE_ENV=production npm start

# If it works, you can delete corrupted copy
rm /data/truthforge.db.corrupted
```

### Solution 5: Check disk space

```bash
# Is /data partition full?
df -h /data

# Clean up old backups if needed
rm /data/backups/truthforge_*.db  # Keep recent ones
```

---

## Gemini API Errors

**Symptom**: 
```
Error: Invalid API key provided
403: Forbidden
503: Service Unavailable
```

### Solution 1: Verify API key

```bash
# Check if key is set
echo $GEMINI_API_KEY

# If empty, set in .env
GEMINI_API_KEY=your-production-key-here

# Reload environment
source .env
echo $GEMINI_API_KEY  # Should now show key
```

### Solution 2: Test API key directly

```bash
# Test with curl
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Test"}]}]}' | jq .

# Successful response:
# {"candidates": [{"content": {...}}]}

# Error responses:
# {"error": {"code": 400, "message": "Invalid API key"}}
# {"error": {"code": 429, "message": "Resource exhausted"}}
```

### Solution 3: Check API quota in Google Cloud

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to: APIs & Services > Generative AI API
4. Check:
   - API is enabled
   - Quotas are sufficient
   - Billing is active
   - No recent quota resets

### Solution 4: Rate limiting

```bash
# Check if rate limited (429 error)
# This is expected - wait and retry

# Check rate limit in your app
grep -n "createTruthForgeRateLimiter" src/express-server.ts

# Current: 10 requests per minute
# To adjust, edit .env or code

# Debug rate limiting
NODE_ENV=development npm start  # More verbose logging
```

### Solution 5: Check API status

- Visit [Google Cloud Status](https://status.cloud.google.com)
- Look for "Generative AI API"
- If there's an incident, wait for resolution

---

## White Screen / No Response

**Symptom**: Browser shows blank page or `Cannot connect to server`

### Step 1: Verify app is running

```bash
ps aux | grep node
# Should see: node ... express-server.ts

# If not running, start it
NODE_ENV=production npm start
```

### Step 2: Check port

```bash
# Is port 3000 open?
netstat -tuln | grep 3000

# If not, might be:
PORT=3000 NODE_ENV=production npm start
```

### Step 3: Check localhost connectivity

```bash
# From same machine
curl http://localhost:3000
curl http://127.0.0.1:3000

# From different machine (replace IP)
curl http://<server-ip>:3000
```

### Step 4: Check firewall

```bash
# Linux firewall
sudo ufw status
sudo ufw allow 3000

# macOS firewall
# System Settings > Security & Privacy > Firewall

# Windows firewall
netsh advfirewall firewall add rule name="TruthForge" dir=in action=allow protocol=tcp localport=3000
```

### Step 5: Check browser console

```
Open browser:
1. Press F12 (Developer Tools)
2. Go to Console tab
3. Look for error messages
4. Check Network tab - does request get to server?
```

### Step 6: Review logs

```bash
# Check application logs
pm2 logs truthforge

# Or if using systemd
journalctl -u truthforge -f

# Or if running directly
# Should see logs in console
```

---

## Memory Issues / Out of Memory

**Symptom**: 
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
JavaScript heap out of memory
```

### Solution 1: Increase Node memory

```bash
# Set memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm start

# In .env
NODE_OPTIONS=--max-old-space-size=2048

# In ecosystem.config.js
node_args: "--max-old-space-size=2048"
```

### Solution 2: Monitor memory usage

```bash
# Check Node process memory
ps aux | grep node | grep -v grep

# Check top memory consumers
top -p $(pgrep -f node)

# Or with Node's process
node -e "console.log(process.memoryUsage())"
```

### Solution 3: Restart with memory limit

```bash
# PM2 with memory limit
pm2 kill
pm2 start ecosystem.config.js --env production -- --max-old-space-size=2048

# Or manually
pkill -f node
NODE_OPTIONS="--max-old-space-size=2048" NODE_ENV=production npm start
```

### Solution 4: Check for memory leaks

```bash
# Monitor for continuous growth
watch -n 5 'ps aux | grep node | grep -v grep'

# If memory keeps growing, there might be a leak
# Restart more frequently:
pm2 restart truthforge --cron "0 * * * *"  # Hourly
```

### Solution 5: Reduce load

- Check if too many concurrent requests
- Lower `maxRequests` in rate limiter
- Cache responses more aggressively
- Use PM2 cluster mode with multiple instances

---

## Application Won't Start

**Symptom**: `npm start` fails or exits immediately

### Step 1: Check error message

```bash
NODE_ENV=production npm start 2>&1 | head -50

# Look for:
# - Module not found
# - Cannot find variable
# - Port in use
# - Database error
```

### Step 2: Verify dependencies

```bash
# Reinstall everything
rm -rf node_modules package-lock.json
npm install

# Check for missing packages
npm ls

# Should show no errors
```

### Step 3: Check TypeScript compilation

```bash
# Try compiling
npm run build

# If fails, fix errors shown
```

### Step 4: Check .env file

```bash
# Verify .env exists
cat .env

# Check for required variables
grep GEMINI_API_KEY .env
grep NODE_ENV .env

# If GEMINI_API_KEY missing:
echo "GEMINI_API_KEY=your-key-here" >> .env
```

### Step 5: Run with verbose logging

```bash
# Add debug info
DEBUG=* NODE_ENV=production npm start

# Or run directly
NODE_ENV=production node --loader ts-node/esm src/express-server.ts

# Watch for the actual error
```

---

## Database Initialization Issues

**Symptom**: 
```
Error initializing database
Tables failed to create
```

### Solution 1: Check database path

```bash
# Verify path in .env
grep TRUTHFORGE_DB_PATH .env

# Create directory if missing
mkdir -p $(dirname $(grep TRUTHFORGE_DB_PATH .env | cut -d'=' -f2))
```

### Solution 2: Check permissions

```bash
# Make sure write permission
chmod 755 /data
touch /data/test.txt
rm /data/test.txt

# If failed, fix permissions
sudo chown $USER /data
chmod 755 /data
```

### Solution 3: Remove corrupted database

```bash
# Backup current
cp /data/truthforge.db /data/truthforge.db.old

# Remove
rm /data/truthforge.db

# Restart to recreate
NODE_ENV=production npm start

# Watch for: "✓ Database initialized: X tables, Y indexes"
```

---

## High CPU / Slow Performance

**Symptom**: CPU usage high, responses slow, system sluggish

### Step 1: Check what's using CPU

```bash
# Show CPU usage
top
# Press 'P' to sort by CPU
# Look for node process

# Or specific
ps aux | grep node | grep -v grep
```

### Step 2: Check request patterns

```bash
# View recent requests
tail -f /var/log/truthforge/app.log | grep -E "GET|POST"

# Look for:
# - Too many requests from one source
# - Expensive operations repeating
# - Infinite loops
```

### Step 3: Enable better logging

```bash
LOG_LEVEL=debug NODE_ENV=production npm start

# Look for slow queries or operations
# Each log should have timestamp and duration
```

### Step 4: Check database performance

```bash
# If database is slow, check:
# - File system performance
# - I/O bottlenecks
# - Database file corruption

iostat -x 1

# High %iowait = I/O bottleneck
# Check disk: df -h
```

### Step 5: Implement caching

```bash
# Add response caching in .env
SEARCH_CACHE_TTL_DAYS=7

# Or restart with fresh database optimization
# Delete and recreate to rebuild indexes
```

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `EADDRINUSE` | Port in use | Kill process or use different port |
| `SQLITE_CANTOPEN` | Database permission | Fix file/dir permissions |
| `database is locked` | Multiple processes | Check lsof, kill stuck processes |
| `Invalid API key` | Wrong/expired key | Get new key from Google Cloud |
| `Rate limit exceeded` | Too many requests | Wait or increase limit |
| `Cannot find module` | Missing dependency | `npm install` |
| `ENOMEM` | Out of memory | Increase `--max-old-space-size` |
| `ECONNREFUSED` | Service not running | Start service |
| `CORS error` | Wrong origin | Check CORS config in .env |

---

## Performance Baseline

Use these to verify health:

```bash
# Should be <100ms
time curl http://localhost:3000/health

# Should be <500ms
time curl http://localhost:3000/api/truthforge/health

# Memory check (should be stable)
ps aux | grep node | grep -v grep | awk '{print $6}'  # RSS in KB

# CPU check (should be <10% idle)
top -bn1 | grep node | head -1
```

---

## Getting Help

If issue persists:

1. **Gather information**:
   ```bash
   # Save this output
   node --version
   npm --version
   lsof -i :3000
   curl http://localhost:3000/health
   pm2 logs truthforge | head -100
   ```

2. **Check logs**:
   ```bash
   # Application logs
   tail -f /data/logs/app.log
   
   # System logs
   dmesg | tail -20
   ```

3. **Contact support** with:
   - Error message (full)
   - System info
   - Steps taken so far
   - Last 50 lines of logs
   - Output of troubleshooting commands above

---

## Emergency Restart

If everything is broken:

```bash
# Nuclear option: Stop everything
pkill -9 -f node
pkill -9 -f truthforge
sleep 2

# Remove stale state
rm -rf ~/.pm2/

# Start fresh
npm install
npm run build
NODE_ENV=production npm start

# Monitor output
pm2 logs truthforge
```

---

This guide covers 90% of common production issues.
For issues not covered, check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) or review logs in detail.
