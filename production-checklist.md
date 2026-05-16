# Production Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment (Do First)

- [ ] **Code review completed** - All features tested locally
- [ ] **Dependencies updated** - `npm install` ran successfully
- [ ] **Build successful** - `npm run build` completed without errors
- [ ] **Tests passing** - `npm run test:integration` passes
- [ ] **No console errors** - Dev environment runs cleanly

## Environment Configuration

- [ ] **NODE_ENV set to "production"** - `NODE_ENV=production npm start`
- [ ] **`.env` file created** - Copied from `.env.production` template
- [ ] **GEMINI_API_KEY configured** - Valid production API key set
- [ ] **GEMINI_MODEL verified** - Set to `gemini-2.0-flash` or newer
- [ ] **DATABASE PATH set** - Points to persistent `/data/truthforge.db`
- [ ] **PORT configuration** - Default 3000 or changed intentionally
- [ ] **LOG_LEVEL set** - Set to `info` for production

## Database Setup

- [ ] **Database directory created** - `/data` directory exists
- [ ] **Directory permissions correct** - `chmod 755 /data`
- [ ] **Database file writable** - `chmod 644 /data/truthforge.db`
- [ ] **Database initialized** - Tables and indexes created
- [ ] **Database health check passes** - `GET /api/truthforge/health` returns healthy
- [ ] **Backup strategy planned** - Daily backups scheduled or tested
- [ ] **Database migration tested** - If upgrading from previous version
- [ ] **Disk space available** - At least 2GB free on `/data` mount

## Gemini API Configuration

- [ ] **API key is valid** - Tested with curl or API test
- [ ] **API quota available** - Check Google Cloud Console
- [ ] **Rate limits configured** - 10 requests/minute per session
- [ ] **Error handling works** - Invalid key shows proper error
- [ ] **API model availability** - `gemini-2.0-flash` is available
- [ ] **Billing configured** - Payment method on file (if needed)
- [ ] **API access enabled** - Generative AI API enabled in GCP

## Application Configuration

### CORS Setup
- [ ] **CORS origins configured** - Production domains whitelisted
- [ ] **Credentials allowed** - If needed for authentication
- [ ] **Methods allowed** - GET, POST, PUT, DELETE enabled as needed
- [ ] **CORS tested** - Cross-origin requests work

### Rate Limiting
- [ ] **Rate limiter enabled** - Applied to `/api/truthforge` endpoints
- [ ] **Rate limits reasonable** - 10 requests/minute for most users
- [ ] **Rate limit errors handled** - 429 responses properly formatted
- [ ] **Rate limit logging works** - Violations are logged

### Error Handling
- [ ] **Error handler middleware active** - Global error catcher working
- [ ] **All errors logged** - Including stack traces
- [ ] **Sensitive data filtered** - No credentials in error messages
- [ ] **Error responses consistent** - JSON format, status codes correct
- [ ] **Graceful degradation** - Partial failures don't break entire app

### Logging
- [ ] **Log level appropriate** - `info` for production (not debug)
- [ ] **Request logging enabled** - All requests logged with method/path/status
- [ ] **Error logging works** - Errors with full context logged
- [ ] **Log rotation configured** - Prevent infinite log growth
- [ ] **Log storage adequate** - Separate `/data/logs` partition or sufficient space
- [ ] **Log permissions secure** - Not readable by unprivileged users

## Monitoring & Health Checks

### Endpoints
- [ ] **GET /health working** - Returns 200 with health status
- [ ] **GET /api/truthforge/health working** - Includes database status
- [ ] **Health checks report uptime** - Uptime field continuously increases
- [ ] **Database health included** - Shows connection status
- [ ] **Response times acceptable** - Health check < 100ms

### Monitoring Setup
- [ ] **Uptime monitoring configured** - Check health every 5 minutes
- [ ] **Error rate monitoring enabled** - Track 5xx responses
- [ ] **Response time monitoring** - Alert if > 1000ms
- [ ] **Memory usage monitored** - Alert if Node process > 1GB
- [ ] **Disk usage monitored** - Alert if /data > 80% full
- [ ] **Alert recipients configured** - Emails or Slack channels set

## Deployment Method Verification

### If Using PM2
- [ ] **PM2 installed** - `pm2 --version` works
- [ ] **ecosystem.config.js exists** - Configuration file in place
- [ ] **PM2 app starts** - `pm2 start ecosystem.config.js --env production`
- [ ] **PM2 app restarts on crash** - Verified in config
- [ ] **PM2 auto-start on reboot** - `pm2 startup` and `pm2 save` run
- [ ] **Log rotation configured** - PM2 log size limited
- [ ] **PM2 status clean** - `pm2 status` shows app running

### If Using Docker
- [ ] **Docker installed** - `docker --version` works
- [ ] **Docker image builds** - `docker build -t truthforge:latest .`
- [ ] **Docker Compose configured** - `docker-compose.yml` valid
- [ ] **Container starts** - `docker-compose up -d --build`
- [ ] **Container healthcheck** - `docker-compose ps` shows healthy
- [ ] **Volume mounts working** - `/data` properly mounted
- [ ] **Network configured** - Port 3000 exposed/accessible

### If Using Systemd
- [ ] **Service file created** - `/etc/systemd/system/truthforge.service`
- [ ] **Service enabled** - `systemctl enable truthforge`
- [ ] **Service starts** - `systemctl start truthforge`
- [ ] **Service auto-restarts** - `Restart=always` in service file
- [ ] **Logs accessible** - `journalctl -u truthforge` works
- [ ] **User permissions correct** - Service runs as appropriate user

### If Using Direct Node
- [ ] **Node 22+ installed** - `node --version` shows v22+
- [ ] **npm installed** - `npm --version` shows 10+
- [ ] **Build succeeds** - `npm run build` completes
- [ ] **App starts** - `NODE_ENV=production npm start`
- [ ] **Process stays running** - Or use nohup/screen

## Performance Validation

- [ ] **Startup time acceptable** - App ready in < 10 seconds
- [ ] **First request succeeds** - Sample API call works
- [ ] **Response times good** - API responses < 500ms average
- [ ] **Memory usage stable** - Not continuously growing
- [ ] **CPU usage reasonable** - < 50% at idle
- [ ] **Database queries fast** - Health check < 100ms
- [ ] **Concurrent requests handled** - Multiple clients don't break it

## Security Verification

- [ ] **No secrets in code** - API keys in .env only
- [ ] **NODE_ENV set** - Production mode enabled
- [ ] **HTTPS ready** - Proxy configured if needed
- [ ] **CORS restrictive** - Only allow required origins
- [ ] **Rate limiting active** - Prevents abuse
- [ ] **Input validation** - Request validation in place
- [ ] **Error messages safe** - No stack traces to users
- [ ] **Logs don't contain secrets** - API keys/tokens filtered
- [ ] **Permissions correct** - /data directory not world-readable

## Backup & Disaster Recovery

- [ ] **Backup script exists** - `backup-db.sh` or equivalent
- [ ] **Backup runs daily** - Scheduled in crontab
- [ ] **Backup location separate** - `/data/backups` or external
- [ ] **Backup restoration tested** - Can restore from backup
- [ ] **Database encryption** - If required by policy
- [ ] **Retention policy set** - Keep last 30+ backups
- [ ] **Backup validation** - Backups are valid/usable

## Integration Tests

- [ ] **Health check endpoint** - `curl http://localhost:3000/health`
- [ ] **API health endpoint** - `curl http://localhost:3000/api/truthforge/health`
- [ ] **Debate endpoint** - POST request to `/api/truthforge/debate` succeeds
- [ ] **Memory retrieval** - `GET /api/truthforge/memory/:id` works
- [ ] **List debates** - `GET /api/truthforge/debates` returns data
- [ ] **Feedback submission** - `POST /api/truthforge/feedback` succeeds
- [ ] **Error handling** - Invalid requests return proper errors

## Load Testing (Optional but Recommended)

- [ ] **Single user load** - 1 concurrent user, 100 requests - OK
- [ ] **Multi-user load** - 10 concurrent users - OK
- [ ] **High load test** - 50+ concurrent - Acceptable performance
- [ ] **Memory stability** - No memory leaks under load
- [ ] **Error handling** - Rate limiting kicks in appropriately

## Final Sign-Off

- [ ] **Tech lead approval** - Reviewed and approved
- [ ] **Security review** - No vulnerabilities found
- [ ] **Documentation complete** - All guides updated
- [ ] **Rollback plan** - Know how to quickly revert
- [ ] **Emergency contacts** - Team notified and available
- [ ] **Deployment window scheduled** - Time selected
- [ ] **Success criteria defined** - Know what "done" looks like

## Post-Deployment (First 24 Hours)

- [ ] **Monitor health checks** - Running continuously
- [ ] **Review error logs** - Check for any issues
- [ ] **Verify backups** - Backup ran successfully
- [ ] **User testing** - Initial user feedback OK
- [ ] **Performance metrics** - Within expected ranges
- [ ] **API load balanced** - If using multiple instances
- [ ] **Alerts working** - Test alert notifications

## Sign-Off

- **Deployment Date**: _______________
- **Deployed By**: _______________
- **Verified By**: _______________
- **Notes**: 

---

This checklist ensures TruthForge AI is production-ready and properly configured.
Review before every deployment.
