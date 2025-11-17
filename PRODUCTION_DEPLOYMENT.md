# Production Deployment Guide

## Overview
This guide covers deploying the Treasury application in a production environment using Docker Compose with nginx as a reverse proxy.

## Architecture

```
┌─────────────────┐
│     Internet    │
└────────┬────────┘
         │
         │ :80 (HTTP)
         │
┌────────▼────────────┐
│  Nginx (Reverse     │
│  Proxy)             │
└──┬──────────────┬───┘
   │              │
   │ /api/        │ /
   │              │
┌──▼──────┐  ┌───▼─────────┐
│ Backend │  │  Frontend   │
│ (FastAPI)│  │  (React)    │
└──┬──────┘  └─────────────┘
   │
┌──▼──────┐
│PostgreSQL│
└─────────┘
```

## Prerequisites

1. Docker and Docker Compose installed
2. Production server with Ubuntu/Debian
3. .env file configured (see `.env.production.example`)

## Quick Start

### 1. Configure Environment

```bash
# Copy the example env file
cp .env.production.example .env

# Edit with your production values
nano .env
```

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 3. Verify Deployment

```bash
# Check nginx health
curl http://localhost/health

# Check API docs
curl http://localhost/api/docs
```

## Service Details

### Nginx (Port 80)
- Main entry point for all traffic
- Routes `/api/*` to backend
- Routes `/*` to frontend
- Health check: `http://your-server/health`

### Backend
- FastAPI application
- 4 workers for production
- Only accessible via nginx (not exposed externally)
- Health check enabled

### Frontend
- Built React application served by nginx
- Multi-stage build for optimized image size
- Only accessible via main nginx (not exposed externally)

### PostgreSQL
- Data persisted in Docker volume `pg_data_prod`
- Not exposed externally by default
- To access from host, uncomment ports in docker-compose.prod.yml

## Security Considerations

### Current Setup
- ✅ Non-root users in containers
- ✅ Backend and frontend not directly exposed
- ✅ Security headers configured
- ✅ Health checks enabled
- ⚠️  HTTP only (no SSL yet)
- ⚠️  Database not exposed externally

### SSH Access
SSH remains accessible on standard port 22 and is NOT behind VPN (as requested).

### WireGuard VPN (Future)
Configuration is prepared but commented out in `docker-compose.prod.yml`. To enable:

1. Uncomment the wireguard service
2. Configure environment variables
3. Restart services

```bash
# When ready to enable WireGuard
docker-compose -f docker-compose.prod.yml up -d wireguard
```

### SSL/TLS Setup (Future)
To add SSL certificates:

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Uncomment SSL port in nginx service (443)
3. Add SSL configuration to nginx.conf
4. Mount certificates volume

## Maintenance

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Update Services
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup Database
```bash
# Create backup
docker exec postgres-treasury-prod pg_dump -U postgres treasurydb > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i postgres-treasury-prod psql -U postgres treasurydb < backup_20241117.sql
```

### Stop Services
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (⚠️  destroys data)
docker-compose -f docker-compose.prod.yml down -v
```

## Monitoring

### Health Checks
All services have health checks configured. View status:
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Database connection issues
```bash
# Check if postgres is healthy
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Frontend not loading
```bash
# Check if frontend built successfully
docker-compose -f docker-compose.prod.yml logs frontend

# Verify nginx configuration
docker exec treasury-nginx-prod nginx -t
```

## Performance Tuning

### Backend Workers
Adjust workers in `backend/Dockerfile.prod`:
```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```
Rule of thumb: `(2 x CPU cores) + 1`

### Nginx Caching
Configured for static assets (1 year cache for js/css/images)

### Database Connection Pool
Configure in backend application settings based on load.

## Next Steps

1. **SSL/TLS**: Set up Let's Encrypt certificates
2. **WireGuard**: Configure VPN for secure access
3. **Monitoring**: Add Prometheus + Grafana
4. **Backups**: Automate database backups
5. **CI/CD**: Set up automated deployment pipeline
