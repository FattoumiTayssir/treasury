# Treasury Management Backend API

FastAPI backend for the Treasury Management application.

## Features

- **Financial Movements**: Track all financial movements with detailed categorization
- **Manual Entries**: Create and manage manual financial entries
- **Exceptions**: Monitor and manage exceptions from automated imports
- **User Management**: Handle users, roles, and company assignments
- **Dashboard**: Aggregate data for treasury projections
- **Odoo Integration**: Mock integration with Odoo for reference validation

## Tech Stack

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database interactions
- **PostgreSQL**: Database
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

## Setup

### With Docker (Recommended)

1. Make sure you have Docker and Docker Compose installed
2. From the project root, run:
   ```bash
   docker-compose up -d
   ```

The backend will be available at `http://localhost:8000`

### Manual Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the server is running, visit:
- **Interactive docs**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token

### Movements
- `GET /movements` - List all movements
- `GET /movements/{id}` - Get movement by ID
- `POST /movements/deactivate` - Deactivate movements
- `POST /movements/activate` - Activate movements
- `POST /movements/refresh` - Trigger data refresh
- `GET /movements/last-refresh` - Get last refresh timestamp

### Manual Entries
- `GET /manual-entries` - List all manual entries
- `GET /manual-entries/{id}` - Get manual entry by ID
- `POST /manual-entries` - Create manual entry
- `PUT /manual-entries/{id}` - Update manual entry
- `POST /manual-entries/delete` - Delete manual entries
- `GET /manual-entries/{id}/movements` - Get movements for manual entry

### Exceptions
- `GET /exceptions` - List all exceptions
- `GET /exceptions/{id}` - Get exception by ID
- `POST /exceptions/update-state` - Update exception states
- `POST /exceptions/refresh` - Trigger exceptions refresh
- `GET /exceptions/last-refresh` - Get last refresh timestamp

### Users
- `GET /users` - List all users
- `GET /users/me` - Get current user
- `GET /users/{id}` - Get user by ID
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Companies
- `GET /companies` - List all companies
- `GET /companies/{id}` - Get company by ID

### Treasury
- `GET /treasury/balance/{company_id}` - Get treasury balance
- `POST /treasury/balance` - Update treasury balance

### Dashboard
- `POST /dashboard/refresh` - Refresh dashboard
- `GET /dashboard/data` - Get dashboard data

### Odoo Integration
- `GET /odoo/reference-state` - Get reference state from Odoo
- `GET /odoo/check-reference` - Check if reference exists in Odoo

## Database Schema

The application uses the following main tables:
- `User` - User accounts and roles
- `Company` - Companies in the system
- `Movement` - Financial movements (both manual and from Odoo)
- `Manual_Entry` - Parent records for manual entries
- `Exception` - Exceptions from data imports
- `User_Company` - User-company relationships

## Development

### Running Tests
```bash
pytest
```

### Code Style
```bash
black app/
flake8 app/
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `DB_NAME`: Database name
- `SECRET_KEY`: JWT secret key (for production)
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)

## Production Considerations

For production deployment:
1. Set a strong `SECRET_KEY`
2. Enable proper authentication with JWT
3. Configure CORS to allow only specific origins
4. Use environment-specific settings
5. Enable HTTPS
6. Set up proper logging
7. Add rate limiting
8. Implement proper error handling
