# Docker Deployment Guide for TruthForge AI

This guide covers deploying TruthForge AI using Docker and Docker Compose for production environments.

## Prerequisites

- Docker 24.0+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.20+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- Linux, macOS, or Windows with WSL2
- 2GB+ available disk space
- 512MB+ available memory

## Quick Start

### 1. Prepare Environment

Create or update your `.env` file with required variables:

```bash
# .env
GEMINI_API_KEY=your-api-key-here
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
TRUTHFORGE_DB_PATH=/data/truthforge.db
```

**Important:** Never commit `.env` to version control. This file contains secrets.

### 2. Build the Docker Image

```bash
# Make build script executable (Linux/macOS)
chmod +x docker-build.sh

# Build with default tag (latest)
./docker-build.sh

# Or build with custom tag
./docker-build.sh v1.0.0
```

**Or use Docker directly:**
```bash
docker build -t truthforge-ai:latest .
```

### 3. Run with Docker Compose

```bash
# Make run script executable (Linux/macOS)
chmod +x docker-run.sh

# Start the application
./docker-run.sh
```

**Or use Docker Compose directly:**
```bash
docker-compose up --build
```

**Background execution:**
```bash
docker-compose up -d --build
```

### 4. Access the Application

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## Configuration

### Environment Variables

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI operations | Yes | N/A |
| `NODE_ENV` | Execution environment | No | production |
| `PORT` | API port inside container | No | 3000 |
| `TRUTHFORGE_DB_PATH` | SQLite database file path inside container | No | /data/truthforge.db |
| `LOG_LEVEL` | Logging verbosity (error, warn, info, debug) | No | info |

### Port Mappings

- `3000:3000` - Express API server (host:container)
- `5173:5173` - Vite dev server frontend (host:container)

To use different host ports:

```yaml
# docker-compose.yml
ports:
  - "8000:3000"    # API on port 8000
  - "3000:5173"    # Frontend on port 3000
```

### Volume Persistence

Database files are persisted in a Docker volume named `truthforge-data`:

```bash
# View volumes
docker volume ls | grep truthforge

# Inspect volume
docker volume inspect truthforge_truthforge-data

# Backup database
docker run --rm -v truthforge_truthforge-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/truthforge-db-backup.tar.gz -C /data .

# Restore database
docker run --rm -v truthforge_truthforge-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/truthforge-db-backup.tar.gz -C /data
```

## Management Commands

### View Running Containers

```bash
docker ps
docker-compose ps
```

### View Logs

```bash
# Live logs from all services
docker-compose logs -f

# Live logs from specific service
docker-compose logs -f truthforge

# Last 100 lines
docker-compose logs --tail=100
```

### Stop the Application

```bash
# Graceful shutdown
docker-compose down

# Remove volumes too (WARNING: deletes database)
docker-compose down -v
```

### Restart the Application

```bash
docker-compose restart
```

### Execute Commands Inside Container

```bash
# Interactive shell
docker-compose exec truthforge sh

# Run single command
docker-compose exec truthforge npm list
```

## Health Checks

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker-compose ps

# Or check directly
curl http://localhost:3000/health
```

Health check states:
- `healthy` - Application is running correctly
- `unhealthy` - Application has issues
- `starting` - Application is starting up

## Image Management

### List Images

```bash
docker images | grep truthforge-ai
```

### Remove Image

```bash
# Remove specific tag
docker rmi truthforge-ai:latest

# Remove all versions
docker rmi $(docker images -q truthforge-ai)
```

### Push to Registry

Push to Docker Hub, GitHub Container Registry, or private registry:

```bash
# Make push script executable (Linux/macOS)
chmod +x docker-push.sh

# Push to Docker Hub
./docker-push.sh docker.io yourusername

# Push to GitHub Container Registry
./docker-push.sh ghcr.io yourusername

# Push with specific tag
./docker-push.sh docker.io yourusername v1.0.0
```

**Manual push:**
```bash
docker tag truthforge-ai:latest docker.io/yourusername/truthforge-ai:latest
docker push docker.io/yourusername/truthforge-ai:latest
```

## Docker Compose Reference

### Start Services

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# Start specific service
docker-compose up truthforge
```

### Stop Services

```bash
# Stop all services (data preserved)
docker-compose stop

# Stop and remove containers (data in volumes preserved)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

### Scale Services

```bash
# Run multiple instances (not recommended for stateful app)
docker-compose up -d --scale truthforge=3
```

## Production Deployment

### Best Practices

1. **Environment Variables**: Use secure secret management (not `.env`)
   - Docker Swarm Secrets
   - Kubernetes Secrets
   - Environment variable injection from CI/CD

2. **Resource Limits**: Set memory and CPU limits in `docker-compose.yml`:
   ```yaml
   services:
     truthforge:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 1G
   ```

3. **Restart Policy**: Container automatically restarts on failure
   ```yaml
   restart: unless-stopped
   ```

4. **Health Checks**: Built-in and monitored by Docker

5. **Logging**: Configure logging driver
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

6. **Security**:
   - Runs as non-root user (nodejs)
   - Uses Alpine Linux for minimal attack surface
   - No secrets in image
   - Read-only root filesystem option available

### Database Backups

```bash
# Automated daily backup script
#!/bin/bash
BACKUP_DIR="/backups/truthforge"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker run --rm \
  -v truthforge_truthforge-data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/truthforge-db-${TIMESTAMP}.tar.gz -C /data .

# Keep only last 7 days
find $BACKUP_DIR -name "truthforge-db-*.tar.gz" -mtime +7 -delete
```

### Monitoring

```bash
# CPU and memory usage
docker stats

# Container events
docker events

# Service health
docker-compose ps
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs truthforge

# Check if port is already in use
lsof -i :3000

# Remove and rebuild
docker-compose down -v
docker system prune
docker-compose up --build
```

### Database Permission Errors

```bash
# Fix volume permissions
docker-compose exec truthforge chown -R nodejs:nodejs /data

# Or recreate volume
docker volume rm truthforge_truthforge-data
docker-compose up -d
```

### Out of Disk Space

```bash
# Remove unused Docker resources
docker system prune

# Remove all unused volumes
docker volume prune

# Remove all unused images
docker image prune -a
```

### API Not Responding

```bash
# Check container status
docker-compose ps

# Restart container
docker-compose restart truthforge

# Check health
curl http://localhost:3000/health

# Check logs for errors
docker-compose logs truthforge | tail -50
```

### High Memory Usage

```bash
# Monitor container
docker stats truthforge

# Restart to reset
docker-compose restart truthforge

# Set memory limit in docker-compose.yml
# See Production Deployment section
```

## Security Considerations

### Image Security

- ✓ Non-root user execution
- ✓ Alpine Linux base (minimal)
- ✓ No secrets in image
- ✓ Specific Node.js version pinned
- ✓ npm ci for reproducible builds

### Runtime Security

- ✓ Read-only filesystem option available
- ✓ Resource limits configurable
- ✓ No privileged mode
- ✓ Network isolation with bridge driver

### Data Security

- ✓ Secrets passed via environment (not in image)
- ✓ Database persistence in Docker volumes
- ✓ Volume encryption available on host

## Multi-Stage Build Benefits

The Dockerfile uses a multi-stage build:

1. **Builder Stage**: Installs all dependencies (including dev) and builds
2. **Runtime Stage**: Contains only built artifacts and production dependencies

Benefits:
- Smaller final image (dev tools excluded)
- Faster deployments
- Reduced attack surface
- No build tools in production

## Architecture

```
┌─────────────────────────────────────────┐
│     Docker Container (truthforge-ai)    │
├─────────────────────────────────────────┤
│  Port 3000: Express API                 │
│  Port 5173: Vite Frontend              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Node.js 22 (Alpine)            │   │
│  │  - Express Server               │   │
│  │  - Built Frontend (dist/)       │   │
│  │  - Node Modules (prod only)     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Health Check: /health endpoint        │
│  User: nodejs (non-root)               │
│  PID 1: node process                   │
└─────────────────────────────────────────┘
         ↓                    ↓
    Port 3000            Port 5173
    (Host)               (Host)
         ↓                    ↓
┌──────────────┐      ┌──────────────┐
│ API Clients  │      │ Web Browser  │
└──────────────┘      └──────────────┘
         ↑
    Volume Mount
┌─────────────────────┐
│ truthforge-data     │
│ SQLite Database     │
└─────────────────────┘
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Alpine Linux](https://alpinelinux.org/)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Docker logs: `docker-compose logs`
3. Verify environment variables: `docker-compose config`
4. Check Docker system status: `docker system info`
