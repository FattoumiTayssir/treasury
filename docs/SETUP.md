# Treasury Management System - Setup Guide

## Overview

This project consists of three services running in Docker:
1. **PostgreSQL Database** - Stores treasury data
2. **FastAPI Backend** - REST API server 
3. **React Frontend** - User interface built with Vite

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- `.env` file configured (see below)

### Environment Configuration

Create a `.env` file in the project root with:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here
DB_NAME=appdb
HOST_PG_PORT=5432
```

**Important**: If your password contains special characters like `@`, they will be handled automatically by the backend configuration.

### Start All Services

```bash
docker-compose up -d
```

This will start:
- **Postgres**: `localhost:5432`
- **Backend API**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`

### Verify Services

Check that all services are running:
```bash
docker-compose ps
```

Test the backend API:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

curl http://localhost:8000/movements
# Should return JSON array of movements
```

Access the frontend:
- Open browser to `http://localhost:3000`

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Available Endpoints

### Movements
- `GET /movements` - List all financial movements
- `GET /movements/{id}` - Get movement by ID
- `POST /movements/deactivate` - Deactivate movements
- `POST /movements/activate` - Activate movements
- `POST /movements/refresh` - Trigger ETL refresh
- `GET /movements/last-refresh` - Get last refresh timestamp

### Manual Entries
- `GET /manual-entries` - List all manual entries
- `POST /manual-entries` - Create new manual entry
- `PUT /manual-entries/{id}` - Update manual entry
- `POST /manual-entries/delete` - Delete manual entries

### Exceptions
- `GET /exceptions` - List all exceptions
- `POST /exceptions/update-state` - Update exception visibility

### Companies
- `GET /companies` - List all companies
- `GET /companies/{id}` - Get company by ID

### Users
- `GET /users` - List all users
- `POST /users` - Create new user
- `GET /users/me` - Get current user

### Auth
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

## Troubleshooting

### Backend not connecting to database
Check the logs:
```bash
docker logs treasury-backend
```

Verify database connection:
```bash
docker exec postgres-treasury psql -U postgres -d appdb -c "SELECT COUNT(*) FROM movement;"
```

### Frontend not loading data
1. Check backend is running: `curl http://localhost:8000/health`
2. Check browser console for CORS errors
3. Verify VITE_API_URL in frontend `.env`: should be `http://localhost:8000`

### Port conflicts
If ports 3000, 5432, or 8000 are already in use, you can modify them in `docker-compose.yml`

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Development

### Backend Development
The backend uses volume mounting, so code changes will auto-reload:
```bash
# Watch backend logs
docker logs -f treasury-backend
```

### Frontend Development
The frontend also uses volume mounting with Vite's HMR:
```bash
# Watch frontend logs
docker logs -f treasury-frontend
```

### Rebuild After Dependencies Change
```bash
# Rebuild backend
docker-compose build backend

# Restart services
docker-compose up -d
```

## Database Schema

Tables in use:
- `User` - System users
- `company` - Companies
- `movement` - Financial movements
- `manual_entry` - Manual entry metadata
- `exception` - Import exceptions
- `user_company` - User-company relationships

## Project Structure

```
/home/mss_ds/treasury/
├── backend/
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── database.py   # DB connection
│   │   └── main.py       # FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── front2/              # React frontend
├── init/postgres/       # Database init scripts
└── docker-compose.yml
```

## Data Population

To populate the database with data from Odoo:
```bash
# From the project root
poetry run python run_all_etls.py
```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify all services are healthy: `docker-compose ps`
3. Review the API docs at http://localhost:8000/docs
