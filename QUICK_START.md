# Quick Start Guide - User Management System

## 🚀 Deploy in 3 Steps

### Step 1: Rebuild Services
```bash
cd /home/mss_ds/treasury
docker-compose down
docker-compose up -d --build
```

### Step 2: Login as Admin
- Open: http://localhost:3000
- Email: `admin@treasury.local`
- Password: `admin123`

### Step 3: Change Admin Password
1. Click "Gestion des utilisateurs" in sidebar
2. Edit admin user
3. Set new password
4. Save

## 📝 Create Your First Manager User

1. **Click "Nouvel utilisateur"**

2. **Fill Basic Info**:
   - Name: `Jean Manager`
   - Email: `jean@company.com`
   - Password: `secure123`
   - Role: `Manager`

3. **Select Companies**:
   - ☑️ Check companies user can access

4. **Set Permissions**:
   - **Analytics**: ☑️ View, ☑️ Modify
   - **Movements**: ☑️ View only
   - **Manual Entries**: ☑️ View, ☑️ Modify
   - **Exceptions**: ☑️ View only
   - **Settings**: ☐ No access

5. **Save**

6. **Test**: Logout and login as jean@company.com

## 🎯 What Each Permission Does

| Tab | View Permission | Modify Permission |
|-----|----------------|-------------------|
| **Analytics** | See charts and reports | N/A (read-only tab) |
| **Movements** | See movement list | Create/edit/delete movements |
| **Manual Entries** | See entries | Create/edit/delete entries |
| **Exceptions** | See exceptions | Update exception states |
| **Settings** | See settings | Update treasury balance |

## ✅ Quick Verification

### As Admin:
- ✅ See all 5 tabs + "Gestion des utilisateurs"
- ✅ Can access everything
- ✅ Can manage users

### As Manager:
- ✅ Only see tabs with view permission
- ✅ No "Gestion des utilisateurs" option
- ✅ Read-only on view-only tabs
- ✅ Full access on modify tabs

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@treasury.local | admin123 |

**⚠️ CHANGE ADMIN PASSWORD IMMEDIATELY!**

## 📊 Permission Matrix Example

For a typical finance manager:

```
User: Finance Manager
Role: Manager
Companies: Universal, Avanza

Permissions:
├── Analytics       → View: ✓   Modify: ✗
├── Movements       → View: ✓   Modify: ✓
├── Manual Entries  → View: ✓   Modify: ✓
├── Exceptions      → View: ✓   Modify: ✗
└── Settings        → View: ✗   Modify: ✗
```

Result:
- Can see: Analytics, Movements, Manual Entries, Exceptions
- Can edit: Movements, Manual Entries
- Cannot see: Settings, User Management

## 🐛 Troubleshooting

### Can't login?
```bash
# Check services are running
docker-compose ps

# Check backend logs
docker-compose logs -f backend

# Verify admin user exists
docker-compose exec postgres psql -U postgres -d appdb -c "SELECT email FROM \"User\";"
```

### Permissions not working?
1. Logout and login again (refreshes permissions)
2. Clear browser cache
3. Check user permissions in User Management

### Services won't start?
```bash
# Clean rebuild
docker-compose down
docker-compose up -d --build

# Watch logs for errors
docker-compose logs -f
```

## 📚 Full Documentation

- **IMPLEMENTATION_SUMMARY.md** - What was built
- **USER_MANAGEMENT_SYSTEM.md** - Complete system docs
- **DEPLOYMENT_GUIDE.md** - Detailed deployment guide

## 🎉 You're Ready!

The system is fully functional. Start by:
1. Deploying with commands above
2. Logging in as admin
3. Changing admin password
4. Creating your first manager user
5. Testing permissions

---

**Time to Deploy**: ~5 minutes  
**Time to Configure**: ~10 minutes  
**Total Setup Time**: ~15 minutes
