# Deployment Guide - User Management System

## Quick Start

Follow these steps to deploy the new user management system with JWT authentication.

## Prerequisites

- Docker and Docker Compose installed
- Current project files in place

## Deployment Steps

### 1. Stop Current Services

```bash
cd /home/mss_ds/treasury
docker-compose down
```

### 2. Rebuild and Start Services

This will automatically run all database migrations including the new user authentication tables:

```bash
docker-compose up -d --build
```

### 3. Monitor Startup

Watch the logs to ensure everything starts correctly:

```bash
# All services
docker-compose logs -f

# Or individually
docker-compose logs -f postgres
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Verify Database Migrations

Check that the new tables were created:

```bash
docker-compose exec postgres psql -U postgres -d appdb -c "\dt"
```

You should see:
- `tab_permissions`
- `user_tab_permissions`

### 5. Verify Admin User

```bash
docker-compose exec postgres psql -U postgres -d appdb -c "SELECT user_id, display_name, email, role FROM \"User\" WHERE role='Admin';"
```

Expected output:
```
 user_id |  display_name  |         email          | role
---------+----------------+------------------------+-------
       1 | Admin User     | admin@treasury.local   | Admin
```

## Access the Application

### Frontend
Open your browser to: **http://localhost:3000**

### Backend API Documentation
Open: **http://localhost:8000/docs**

### Default Admin Credentials

```
Email: admin@treasury.local
Password: admin123
```

⚠️ **CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

## First Steps After Deployment

### 1. Login as Admin

Navigate to http://localhost:3000 and login with the default credentials.

### 2. Change Admin Password

1. Click on "Gestion des utilisateurs" in the sidebar
2. Edit the admin user
3. Enter a strong new password
4. Save

### 3. Create Additional Users

1. Click "Nouvel utilisateur"
2. Fill in user details
3. Select companies they can access
4. Set permissions for each tab
5. Save

### 4. Test User Access

1. Logout
2. Login as the new user
3. Verify they only see permitted tabs
4. Test view vs modify permissions

## Verification Checklist

- [ ] All services started successfully
- [ ] Database migrations applied
- [ ] Admin user exists
- [ ] Can login as admin
- [ ] User Management page visible (admin only)
- [ ] Can create new users
- [ ] Can set permissions
- [ ] Manager users only see permitted tabs
- [ ] Dashboard removed from navigation
- [ ] Analytics is default landing page

## Troubleshooting

### Services Won't Start

```bash
# Check Docker resources
docker system df

# Clean up if needed
docker system prune

# Restart
docker-compose down
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Backend Errors

```bash
# View backend logs
docker-compose logs -f backend

# Common issues:
# - Database not ready: Wait a few seconds and it should auto-recover
# - Port conflict: Ensure port 8000 is free
```

### Frontend Won't Load

```bash
# View frontend logs
docker-compose logs -f frontend

# Common issues:
# - Dependencies not installed: Rebuild with --build flag
# - Port conflict: Ensure port 3000 is free
```

### Cannot Login

1. **Check backend is running**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verify admin user exists**
   ```bash
   docker-compose exec postgres psql -U postgres -d appdb -c "SELECT email, role FROM \"User\";"
   ```

3. **Check browser console** for error messages

4. **Clear browser cache** and try again

### Permission Issues

If permissions don't work correctly:

1. **Logout and login again** to refresh token
2. **Check user permissions in database**:
   ```bash
   docker-compose exec postgres psql -U postgres -d appdb -c "
   SELECT u.email, t.tab_name, utp.can_view, utp.can_modify 
   FROM \"User\" u 
   JOIN user_tab_permissions utp ON u.user_id = utp.user_id 
   JOIN tab_permissions t ON utp.tab_id = t.tab_id;
   "
   ```

## Rollback Procedure

If you need to rollback:

```bash
# Stop services
docker-compose down

# Remove new migration files
rm init/postgres/19-user-auth-permissions.sql
rm init/postgres/20-seed-admin-user.sql

# Restore from backup if needed

# Restart
docker-compose up -d --build
```

## Backup Recommendations

Before deployment, backup:

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres appdb > backup_$(date +%Y%m%d).sql

# Backup .env file
cp .env .env.backup
```

## Environment Variables

Ensure your `.env` file has:

```env
# Database
POSTGRES_PASSWORD=your_secure_password
DB_NAME=appdb
POSTGRES_USER=postgres

# Ports
HOST_PG_PORT=5432
```

## Security Checklist

After deployment:

- [ ] Changed default admin password
- [ ] All users have strong passwords
- [ ] Reviewed and assigned minimal necessary permissions
- [ ] Tested permission boundaries
- [ ] Backup strategy in place
- [ ] Monitor logs for suspicious activity

## Support

For issues:
1. Check logs: `docker-compose logs -f [service]`
2. Review `USER_MANAGEMENT_SYSTEM.md` for detailed documentation
3. Check database state with SQL queries above
4. Verify all files are in place

## Migration Files Applied

These SQL files run automatically on database init:
- `init/postgres/10-schema.sql` - Base schema
- `init/postgres/19-user-auth-permissions.sql` - Permission tables
- `init/postgres/20-seed-admin-user.sql` - Default admin user

## Next Steps

After successful deployment:

1. **Document your users**: Keep a secure record of created users
2. **Set up monitoring**: Monitor authentication failures
3. **Regular audits**: Review user permissions quarterly
4. **Update admin password**: Change periodically
5. **Train users**: Brief users on the new system

## Production Recommendations

For production deployment:

1. **Change JWT secret**: Update SECRET_KEY in `backend/app/auth_utils.py`
2. **Use environment variable**: Move SECRET_KEY to environment variable
3. **HTTPS only**: Configure SSL/TLS
4. **Firewall rules**: Restrict database port access
5. **Regular backups**: Automated backup schedule
6. **Monitoring**: Set up application monitoring
7. **Rate limiting**: Add API rate limiting
8. **Log rotation**: Configure log rotation
