#!/bin/bash

# TruthForge AI Production Deployment Script
# Usage: ./deploy.sh
# 
# This script:
# 1. Pulls latest code from Git
# 2. Installs/updates dependencies
# 3. Builds the frontend
# 4. Migrates database if needed
# 5. Starts/restarts the application
# 6. Verifies health checks

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="truthforge"
NODE_ENV="production"
HEALTH_CHECK_URL="http://localhost:3000/health"
MAX_WAIT_TIME=30
LOG_FILE="$DEPLOY_DIR/deployment.log"

# Functions

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
}

check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
  fi
  
  NODE_VERSION=$(node -v)
  log_success "Node.js: $NODE_VERSION"
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
  fi
  
  NPM_VERSION=$(npm -v)
  log_success "npm: $NPM_VERSION"
  
  # Check Git
  if ! command -v git &> /dev/null; then
    log_warning "Git is not installed - skipping git pull"
  else
    log_success "Git: $(git --version)"
  fi
  
  # Check .env file
  if [ ! -f "$DEPLOY_DIR/.env" ]; then
    log_error ".env file not found"
    log_info "Please create .env from .env.production"
    exit 1
  fi
  
  log_success "All prerequisites met"
}

pull_latest() {
  log_info "Pulling latest code from Git..."
  
  if ! command -v git &> /dev/null; then
    log_warning "Skipping git pull - Git not available"
    return
  fi
  
  cd "$DEPLOY_DIR"
  
  if git status > /dev/null 2>&1; then
    git pull origin main 2>&1 | tee -a "$LOG_FILE"
    log_success "Code pulled successfully"
  else
    log_warning "Not a Git repository - skipping pull"
  fi
}

install_dependencies() {
  log_info "Installing/updating dependencies..."
  
  cd "$DEPLOY_DIR"
  
  if npm install 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Dependencies installed"
  else
    log_error "Failed to install dependencies"
    exit 1
  fi
}

build_application() {
  log_info "Building application..."
  
  cd "$DEPLOY_DIR"
  
  if npm run build 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Build completed successfully"
  else
    log_error "Build failed"
    exit 1
  fi
}

migrate_database() {
  log_info "Checking database..."
  
  cd "$DEPLOY_DIR"
  
  # The database is auto-initialized on startup, but we can verify
  if [ -f "./truthforge.db" ] || [ -f "/data/truthforge.db" ]; then
    log_success "Database file exists"
  else
    log_info "Database will be created on first run"
  fi
}

start_application() {
  log_info "Starting application..."
  
  cd "$DEPLOY_DIR"
  
  # Check if PM2 is available
  if command -v pm2 &> /dev/null; then
    log_info "Starting with PM2..."
    
    # Delete existing app if running
    pm2 delete "$APP_NAME" 2>/dev/null || true
    sleep 1
    
    # Start with PM2
    if pm2 start ecosystem.config.js --env production 2>&1 | tee -a "$LOG_FILE"; then
      log_success "Application started with PM2"
      
      # Save PM2 config
      pm2 save 2>&1 | tee -a "$LOG_FILE"
      log_success "PM2 configuration saved"
    else
      log_error "Failed to start with PM2"
      exit 1
    fi
  else
    log_info "PM2 not available, starting directly..."
    
    # Start directly
    NODE_ENV="$NODE_ENV" npm start > "$DEPLOY_DIR/app.log" 2>&1 &
    APP_PID=$!
    log_success "Application started with PID: $APP_PID"
  fi
}

wait_for_startup() {
  log_info "Waiting for application to be ready..."
  
  local elapsed=0
  local interval=2
  
  while [ $elapsed -lt $MAX_WAIT_TIME ]; do
    if curl -sf "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
      log_success "Application is ready"
      return 0
    fi
    
    echo -n "."
    sleep $interval
    elapsed=$((elapsed + interval))
  done
  
  log_error "Application failed to start within $MAX_WAIT_TIME seconds"
  return 1
}

verify_health() {
  log_info "Verifying application health..."
  
  if curl -s "$HEALTH_CHECK_URL" | grep -q '"status"' 2>/dev/null; then
    # Get full health info
    HEALTH=$(curl -s "$HEALTH_CHECK_URL" | head -c 200)
    log_success "Health check passed: $HEALTH..."
  else
    log_error "Health check failed"
    return 1
  fi
  
  # Check API health
  API_HEALTH_URL="http://localhost:3000/api/truthforge/health"
  if curl -s "$API_HEALTH_URL" | grep -q '"database"' 2>/dev/null; then
    log_success "API health check passed"
  else
    log_warning "API health check incomplete"
  fi
}

print_status() {
  log_info "Deployment Status:"
  echo ""
  
  if command -v pm2 &> /dev/null; then
    pm2 status 2>&1 | tee -a "$LOG_FILE"
  fi
  
  echo ""
  log_info "Application is running at: http://localhost:3000"
  log_info "View logs: pm2 logs $APP_NAME"
  log_info "Restart: pm2 restart $APP_NAME"
  log_info "Stop: pm2 stop $APP_NAME"
}

main() {
  echo ""
  log_info "╔════════════════════════════════════════╗"
  log_info "║ TruthForge AI Deployment Script        ║"
  log_info "║ $(date '+%Y-%m-%d %H:%M:%S')              ║"
  log_info "╚════════════════════════════════════════╝"
  echo ""
  
  # Create log directory
  mkdir -p "$(dirname "$LOG_FILE")"
  
  # Run deployment steps
  check_prerequisites
  echo ""
  
  pull_latest
  echo ""
  
  install_dependencies
  echo ""
  
  build_application
  echo ""
  
  migrate_database
  echo ""
  
  start_application
  echo ""
  
  if wait_for_startup; then
    verify_health
    echo ""
    print_status
    echo ""
    log_success "╔════════════════════════════════════════╗"
    log_success "║ Deployment completed successfully! ✓  ║"
    log_success "╚════════════════════════════════════════╝"
    echo ""
    return 0
  else
    log_error "╔════════════════════════════════════════╗"
    log_error "║ Deployment failed ✗                   ║"
    log_error "╚════════════════════════════════════════╝"
    echo ""
    log_error "Check logs at: $LOG_FILE"
    return 1
  fi
}

# Run main function
main
exit $?
