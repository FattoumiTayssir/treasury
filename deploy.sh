#!/bin/bash

# Treasury Production Deployment Script
set -e

echo "🚀 Starting Treasury Production Deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create .env from .env.production.example"
    echo "   cp .env.production.example .env"
    echo "   nano .env"
    exit 1
fi

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    exit 1
fi

# Parse command line arguments
COMMAND=${1:-up}

case $COMMAND in
    up|start)
        echo "📦 Building and starting services..."
        docker compose -f docker-compose.prod.yml up -d --build
        echo "✅ Services started!"
        echo ""
        echo "📊 Service Status:"
        docker compose -f docker-compose.prod.yml ps
        echo ""
        echo "🔗 Application should be available at http://localhost"
        echo "📚 API docs: http://localhost/api/docs"
        echo ""
        echo "📋 View logs with: ./deploy.sh logs"
        ;;
        
    down|stop)
        echo "🛑 Stopping services..."
        docker compose -f docker-compose.prod.yml down
        echo "✅ Services stopped!"
        ;;
        
    restart)
        echo "🔄 Restarting services..."
        docker compose -f docker-compose.prod.yml restart
        echo "✅ Services restarted!"
        ;;
        
    logs)
        SERVICE=${2:-}
        if [ -z "$SERVICE" ]; then
            docker compose -f docker-compose.prod.yml logs -f
        else
            docker compose -f docker-compose.prod.yml logs -f $SERVICE
        fi
        ;;
        
    ps|status)
        echo "📊 Service Status:"
        docker compose -f docker-compose.prod.yml ps
        ;;
        
    rebuild)
        echo "🔨 Rebuilding from scratch..."
        docker compose -f docker-compose.prod.yml down
        docker compose -f docker-compose.prod.yml build --no-cache
        docker compose -f docker-compose.prod.yml up -d
        echo "✅ Rebuild complete!"
        ;;
        
    backup)
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "💾 Creating database backup: $BACKUP_FILE"
        docker exec postgres-treasury-prod pg_dump -U postgres treasurydb > $BACKUP_FILE
        echo "✅ Backup saved to $BACKUP_FILE"
        ;;
        
    health)
        echo "🏥 Checking service health..."
        echo ""
        echo "Nginx Health:"
        curl -s http://localhost/health || echo "❌ Failed"
        echo ""
        echo ""
        echo "Service Status:"
        docker compose -f docker-compose.prod.yml ps
        ;;
        
    update)
        echo "⬆️  Updating deployment..."
        git pull
        docker compose -f docker-compose.prod.yml up -d --build
        echo "✅ Update complete!"
        ;;
        
    clean)
        echo "🧹 Cleaning up Docker resources..."
        echo "⚠️  This will remove unused images and containers"
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker system prune -f
            echo "✅ Cleanup complete!"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
        
    shell)
        SERVICE=${2:-backend}
        echo "🐚 Opening shell in $SERVICE container..."
        docker compose -f docker-compose.prod.yml exec $SERVICE sh
        ;;
        
    *)
        echo "Treasury Production Deployment Script"
        echo ""
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  up, start     - Build and start all services (default)"
        echo "  down, stop    - Stop all services"
        echo "  restart       - Restart all services"
        echo "  logs [svc]    - View logs (optionally for specific service)"
        echo "  ps, status    - Show service status"
        echo "  rebuild       - Rebuild from scratch (no cache)"
        echo "  backup        - Create database backup"
        echo "  health        - Check service health"
        echo "  update        - Pull latest code and redeploy"
        echo "  clean         - Clean up Docker resources"
        echo "  shell [svc]   - Open shell in service (default: backend)"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh up"
        echo "  ./deploy.sh logs backend"
        echo "  ./deploy.sh backup"
        exit 1
        ;;
esac
