# 🔐 Mock Authentication Credentials

The application is currently using **mock authentication** for testing without a backend.

## Available Test Accounts

### 👨‍💼 Admin Account
- **Email:** `admin@universal.com`
- **Password:** `admin123`
- **Role:** Admin
- **Companies:** Universal, Avanza, Platinium
- **Permissions:** Full access + user management

### 👤 Gestionnaire (Single Company)
- **Email:** `user@universal.com`
- **Password:** `user123`
- **Role:** Gestionnaire
- **Companies:** Universal only
- **Permissions:** Standard access to Universal data

### 👥 Gestionnaire (Multi-Companies)
- **Email:** `multi@universal.com`
- **Password:** `multi123`
- **Role:** Gestionnaire
- **Companies:** Universal, Avanza
- **Permissions:** Access to multiple companies

## How to Use

1. Open the application at http://localhost:3000
2. Click on any test account button to auto-fill credentials
3. Or manually enter email and password
4. Click "Se connecter"

## Switching to Real Backend

When you're ready to connect to a real backend API:

1. Update `/src/store/authStore.ts`:
   ```typescript
   // Change this line:
   import { mockLogin, mockLogout } from '@/services/mockAuth'
   
   // To this:
   import { authApi } from '@/services/api'
   ```

2. Update the login/logout methods to use `authApi` instead of mock functions

3. Configure your backend URL in `.env`:
   ```
   VITE_API_URL=http://your-backend-url:port
   ```

## Mock Data Location

- **Mock Auth Service:** `/src/services/mockAuth.ts`
- **Auth Store:** `/src/store/authStore.ts`
- **Login Page:** `/src/pages/Login.tsx`
