# User Management System with JWT Authentication

## Overview

A comprehensive user management system with JWT authentication, password encryption, and granular permissions has been implemented. The system includes:

- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control** (Admin/Manager)
- **Tab-level permissions** (view/modify) for each module
- **Company-level access control**
- **User management interface** (Admin only)

## Database Changes

### New Tables

#### `tab_permissions`
Stores available tabs/modules in the application:
- `tab_id` (PK)
- `tab_name` - Unique identifier (e.g., 'analytics', 'movements')
- `tab_label` - Display name
- `description` - Tab description

#### `user_tab_permissions`
Stores user permissions for each tab:
- `user_tab_permission_id` (PK)
- `user_id` (FK to User)
- `tab_id` (FK to tab_permissions)
- `can_view` - Boolean: can the user view this tab
- `can_modify` - Boolean: can the user modify data in this tab

### Modified Tables

#### `User` table
- Added `password_hash` column to store bcrypt-hashed passwords

### Default Admin User

A default admin user is created automatically:
- **Email**: `admin@treasury.local`
- **Password**: `admin123`
- **Role**: Admin

⚠️ **IMPORTANT**: Change this password in production!

## Backend Changes

### New Files

1. **`app/auth_utils.py`**
   - JWT token creation and validation
   - Password hashing and verification (bcrypt)
   - Authentication dependencies for route protection
   - Permission checking utilities

### Updated Files

1. **`app/models.py`**
   - Added `password_hash` to User model
   - Created `TabPermission` model
   - Created `UserTabPermission` model with relationships

2. **`app/schemas.py`**
   - Added permission schemas
   - Updated UserResponse to include permissions
   - Added UserWithPermissionsUpdate for complete user updates

3. **`app/routers/auth.py`**
   - Complete rewrite with real JWT authentication
   - Password verification
   - Token generation
   - `/auth/login` - Login with email/password
   - `/auth/logout` - Logout endpoint
   - `/auth/me` - Get current user with permissions

4. **`app/routers/users.py`**
   - Complete rewrite with admin-only access
   - `/users` (GET) - List all users (Admin only)
   - `/users/tabs` (GET) - Get available tabs (Admin only)
   - `/users` (POST) - Create user (Admin only)
   - `/users/{id}` (PUT) - Update user with permissions/companies (Admin only)
   - `/users/{id}` (DELETE) - Delete user (Admin only)

## Frontend Changes

### New Files

1. **`pages/UserManagement.tsx`**
   - Complete user management interface
   - List all users with their roles, companies, and permissions
   - Add/Edit/Delete users
   - Visual permission and company management

2. **`components/users/UserDialog.tsx`**
   - User creation/edit dialog
   - Form for user details (name, email, password, role)
   - Company selection with checkboxes
   - Tab permission management with view/modify toggles
   - Automatic permission logic (modify implies view)

### Updated Files

1. **`types/index.ts`**
   - Added `TabPermission` interface
   - Added `TabDefinition` interface
   - Updated `User` interface to include permissions array
   - Changed role type from 'Gestionnaire' to 'Manager'

2. **`services/api.ts`**
   - Updated `usersApi` with new endpoints
   - Added `getTabs()` endpoint
   - Updated user create/update to support permissions

3. **`store/authStore.ts`**
   - Switched from mock auth to real API authentication
   - Added `hasPermission(tabName, requireModify)` method
   - Added `isAdmin()` method
   - Proper JWT token handling

4. **`components/layout/Sidebar.tsx`**
   - **Removed Dashboard** from navigation
   - Added User Management (Admin only)
   - Implemented permission-based navigation filtering
   - Users only see tabs they have permission to access

5. **`App.tsx`**
   - **Removed Dashboard route**
   - Redirect from `/` to `/analytics`
   - Added `/users` route for User Management
   - Implemented `PermissionRoute` component for route protection
   - All routes now check permissions before rendering

## Permission System

### How It Works

1. **Admin Role**
   - Has access to everything by default
   - Can access User Management
   - Bypasses all permission checks

2. **Manager Role**
   - Must have explicit permissions for each tab
   - Can have view-only or view+modify access per tab
   - Cannot access User Management

3. **Permission Levels**
   - **View**: Can see the tab and its read-only data
   - **Modify**: Can view AND edit/create/delete data
   - **Note**: Modify permission automatically includes view permission

### Tab Permissions Available

- **analytics** - View and analyze financial data
- **movements** - Manage financial movements
- **manual-entries** - Manage manual entries
- **exceptions** - Handle exceptions
- **settings** - Treasury settings and configuration

## Security Features

1. **Password Encryption**
   - Bcrypt hashing with salt
   - Passwords never stored in plain text

2. **JWT Tokens**
   - Secure token-based authentication
   - 24-hour expiration
   - Stored securely in localStorage

3. **Authorization**
   - Route-level protection
   - API endpoint protection with dependencies
   - Frontend permission checks

4. **Company Isolation**
   - Users can only access assigned companies
   - Company filtering in data views

## Usage Guide

### For Administrators

#### Login
```
Email: admin@treasury.local
Password: admin123
```

#### Managing Users

1. **Create a New User**
   - Click "Nouvel utilisateur"
   - Enter name, email, password
   - Select role (Admin/Manager)
   - Choose companies the user can access
   - For Managers, set permissions for each tab (View/Modify)
   - Click "Enregistrer"

2. **Edit User**
   - Click edit icon next to user
   - Update any information
   - Modify companies and permissions
   - Leave password blank to keep existing password
   - Click "Enregistrer"

3. **Delete User**
   - Click delete icon next to user
   - Confirm deletion
   - **Note**: Cannot delete your own account

### For Managers

- Login with assigned credentials
- Only see tabs you have permission for
- View-only tabs: Can see data but no edit buttons
- Modify tabs: Full access to create/edit/delete

## Deployment Instructions

### 1. Rebuild the Database

The database will automatically apply migrations on startup:

```bash
# Stop current services
docker-compose down

# Rebuild and start (this will run migration scripts)
docker-compose up -d --build
```

### 2. Migration Scripts Applied

The following migration scripts will run automatically:
- `19-user-auth-permissions.sql` - Creates permission tables
- `20-seed-admin-user.sql` - Creates default admin user

### 3. Verify Admin User

Try logging in with:
- Email: `admin@treasury.local`
- Password: `admin123`

### 4. Change Default Password

⚠️ **IMMEDIATELY** change the default admin password:
1. Login as admin
2. Go to User Management
3. Edit the admin user
4. Set a strong new password

## API Endpoints

### Authentication
- `POST /auth/login` - Login (returns JWT token)
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user info

### User Management (Admin only)
- `GET /users` - List all users
- `GET /users/tabs` - Get available tabs
- `POST /users` - Create user
- `PUT /users/{id}` - Update user (with companies and permissions)
- `DELETE /users/{id}` - Delete user

All authenticated requests must include:
```
Authorization: Bearer <jwt_token>
```

## Troubleshooting

### Cannot Login
- Verify database migrations ran successfully
- Check if admin user exists in database
- Check backend logs: `docker-compose logs -f backend`

### Permissions Not Working
- Refresh browser to get updated user data
- Verify user has correct permissions in database
- Check browser console for errors

### Database Issues
```bash
# View database
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

## Security Recommendations

1. **Change default admin password immediately**
2. **Use strong passwords** for all users
3. **Rotate JWT secret** in production (update SECRET_KEY in auth_utils.py)
4. **Use HTTPS** in production
5. **Regular backup** of user and permission data
6. **Audit user access** regularly

## Future Enhancements

Potential improvements:
- Password reset functionality
- Email verification
- Two-factor authentication (2FA)
- Activity logging and audit trail
- Session management
- API rate limiting
- Password strength requirements
- Account lockout after failed attempts
