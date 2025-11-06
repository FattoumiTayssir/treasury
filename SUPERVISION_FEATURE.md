# Supervision Feature - Admin Audit Logging

## Overview
The Supervision feature is an admin-only audit logging system that tracks all changes made to movements, manual entries, and data refresh operations. This provides full visibility into who did what and when.

## Features Implemented

### 1. Database Schema
**Tables Created:**
- `supervision_log` - Main audit log table with the following fields:
  - `log_id` - Primary key
  - `entity_type` - Type of entity (movement, manual_entry, data_refresh)
  - `entity_id` - ID of the affected entity
  - `action` - Action performed (include, exclude, insert, update, delete, refresh)
  - `user_id` - User who performed the action
  - `user_name` - User's display name
  - `timestamp` - When the action occurred
  - `details` - JSON field with additional details
  - `description` - Human-readable description
  - `company_id` - Associated company (if applicable)

**Tab Permission:**
- Added 'supervision' tab to `tab_permissions` table
- Label: "Supervision"
- Description: "Admin-only audit log for tracking changes to movements, manual entries, and data refresh"

**SQL Migration Files:**
- `init/postgres/25-supervision-audit-log.sql` - Creates supervision_log table
- `init/postgres/26-add-supervision-tab.sql` - Adds supervision tab permission

### 2. Backend Implementation

**New Model:** `SupervisionLog` (`backend/app/models.py`)
- ORM model for the supervision_log table
- Relationships to User and Company tables
- Indexed for optimal query performance

**New Schema:** `SupervisionLogResponse` (`backend/app/schemas.py`)
- Pydantic schema for API responses

**New Router:** `supervision.py` (`backend/app/routers/supervision.py`)
- `GET /supervision/logs` - Retrieve logs with filters
  - Filters: entityType, action, userId, companyId, dateFrom, dateTo
  - Pagination: limit, offset
  - Admin-only access
- `GET /supervision/stats` - Get statistics
  - Total logs count
  - Logs by entity type
  - Logs by action
  - Top active users
- Helper function `create_supervision_log()` - For creating audit entries

**Logging Integration:**
Updated the following routers to log actions:

1. **Movements** (`backend/app/routers/movements.py`):
   - Logs when movements are included/excluded from analytics
   - Action: 'include' or 'exclude'
   - Captures: movement type, amount, exclude status

2. **Manual Entries** (`backend/app/routers/manual_entries.py`):
   - Logs on creation (action: 'insert')
   - Logs on update (action: 'update')
   - Captures: entry type, frequency, amount, sign, number of occurrences

3. **Data Refresh** (`backend/app/routers/data_refresh.py`):
   - Logs when data refresh is started (action: 'refresh')
   - Captures: execution ID, list of ETL jobs to run

### 3. Frontend Implementation

**New Types** (`front2/src/types/index.ts`):
```typescript
export interface SupervisionLog {
  logId: number
  entityType: 'movement' | 'manual_entry' | 'data_refresh'
  entityId?: number
  action: string
  userId: number
  userName: string
  timestamp: string
  details?: Record<string, any>
  description?: string
  companyId?: number
}

export interface SupervisionStats {
  totalLogs: number
  logsByEntity: Array<{ entityType: string; count: number }>
  logsByAction: Array<{ action: string; count: number }>
  topUsers: Array<{ userName: string; count: number }>
}
```

**New API Service** (`front2/src/services/api.ts`):
```typescript
export const supervisionApi = {
  getLogs: (params) => api.get<SupervisionLog[]>('/supervision/logs', { params }),
  getStats: () => api.get<SupervisionStats>('/supervision/stats'),
}
```

**New Page Component** (`front2/src/pages/Supervision.tsx`):
- **Statistics Dashboard:**
  - Total logs count
  - Breakdown by entity type
  - Breakdown by action
  - Top active users
  
- **Filters:**
  - Entity type (Movement, Manual Entry, Data Refresh)
  - Action (Inclusion, Exclusion, Creation, Modification, Suppression, Actualisation)
  - Date range (from/to)
  
- **Audit Log Table:**
  - Date/Time (formatted with seconds)
  - User name
  - Entity type (with badge)
  - Action (color-coded badge)
  - Description

**Color Coding:**
- Green: include, insert, refresh (positive actions)
- Red: exclude, delete (negative actions)
- Blue: update (modification actions)

**Navigation:**
- Added "Supervision" link to admin navigation menu in sidebar
- Icon: Activity icon from lucide-react
- Route: `/supervision`
- Admin-only access enforced

**Route Configuration** (`front2/src/App.tsx`):
- Added protected route for `/supervision`
- Wrapped with `PermissionRoute` component with `adminOnly` flag

## What Gets Logged

### Movements
**Actions Logged:**
- **Exclusion from Analytics**: When movements are excluded from analytics calculations
- **Inclusion in Analytics**: When movements are re-included in analytics

**Details Captured:**
- Movement type
- Movement amount
- Exclusion status

### Manual Entries
**Actions Logged:**
- **Creation (insert)**: When a new manual entry is created
- **Modification (update)**: When an existing manual entry is updated

**Details Captured:**
- Entry type
- Frequency (Une seule fois, Mensuel, Annuel, Dates personnalisées)
- Amount
- Sign (Entrée/Sortie)
- Number of occurrences generated

### Data Refresh
**Actions Logged:**
- **Refresh**: When data refresh from Odoo is initiated

**Details Captured:**
- Execution ID
- List of ETL jobs being run
  - Achats Importés
  - Ventes Locales
  - Achats Locaux

## Access Control
- **Admin-only feature**: Only users with Admin role can access the Supervision tab
- **Backend enforcement**: All supervision endpoints require admin authentication via `get_current_admin_user` dependency
- **Frontend enforcement**: Route protected with `adminOnly` permission check

## User Interface Features

### Dashboard Statistics
- **Visual Cards**: Four cards showing key metrics at a glance
- **Real-time Data**: Automatically loads latest statistics
- **Top Users**: Shows most active users by number of actions

### Filtering Capabilities
- Filter by entity type to focus on specific areas
- Filter by action type to see specific kinds of changes
- Date range filtering for auditing specific time periods
- All filters work together for precise queries

### Audit Log Display
- **Chronological Order**: Most recent actions first
- **Detailed Information**: Full context for each action
- **User Attribution**: Clear visibility of who made each change
- **Timestamp Precision**: Shows exact date and time including seconds
- **Color-Coded Actions**: Visual distinction between different action types

## Database Indexes
Optimized for performance with indexes on:
- `(entity_type, entity_id)` - Fast lookups by entity
- `user_id` - Fast user-specific queries
- `timestamp DESC` - Optimized for chronological queries
- `action` - Fast filtering by action type
- `company_id` - Fast company-specific queries

## Future Enhancements (Optional)
- Export logs to CSV/Excel
- Email notifications for critical actions
- Retention policy configuration
- Advanced search with full-text search
- Detailed diff view for updates (showing before/after values)
- Integration with external SIEM systems

## Testing
To test the feature:
1. Log in as Admin user
2. Navigate to "Supervision" in the sidebar
3. Perform actions in the app:
   - Exclude/include movements from analytics
   - Create or update manual entries
   - Run data refresh
4. Check the Supervision tab to see the logged actions

## Maintenance
- Logs are stored indefinitely by default
- Consider implementing a retention policy based on your compliance requirements
- The JSON `details` field allows for flexible extension without schema changes
- All foreign keys use CASCADE/SET NULL for proper cleanup
