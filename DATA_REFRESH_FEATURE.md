# Data Refresh Feature - Implementation Guide

## 🎯 Overview

A user-friendly admin feature to refresh treasury data from Odoo with:
- ✅ **Real-time progress tracking** via WebSockets
- ✅ **Concurrent execution blocking** (only 1 refresh at a time)
- ✅ **Execution history** for admins
- ✅ **User notifications** during refresh
- ✅ **Non-technical language** (no "ETL" terminology)

## 🔒 Security

- **Admin-only access**: Only users with "Admin" role can start a data refresh
- **Concurrent prevention**: System blocks multiple refreshes from running simultaneously
- **User-friendly error messages**: Clear explanations when another admin is already refreshing data

## 🏗️ Architecture

### Backend Components

#### 1. Database Table (`data_refresh_execution`)
Tracks all refresh operations:
- Status (running, completed, failed, cancelled)
- Progress percentage (0-100%)
- Started by (admin user)
- Duration, records processed
- Detailed error messages

#### 2. API Endpoints (`/api/data-refresh`)
- `POST /start` - Start new refresh (admin only)
- `GET /status` - Check current status (all users)
- `GET /history` - View past refreshes (admin only)
- `WebSocket /ws` - Real-time progress updates

#### 3. WebSocket Integration
- Broadcasts progress updates to all connected clients
- Updates progress percentage and current step
- Notifies when refresh completes/fails

### Frontend Components

#### 1. Data Refresh Page (`/data-refresh`)
- Real-time progress bar
- Current step display ("Importing purchases...", etc.)
- Start button (disabled during refresh)
- Execution history table

#### 2. Navigation
- Admin-only link: "Actualiser les données" in sidebar
- Icon: Refresh symbol (RefreshCw)

## 📋 What Happens During Refresh

### For Administrators:
1. Click "Start Data Refresh" button
2. See real-time progress bar
3. View which data source is currently processing
4. Get notification when complete
5. View history of past refreshes

### For Regular Users:
- See informational banner: "⚠️ Data refresh in progress. Please wait while we retrieve the latest data."
- Can continue viewing existing data
- Cannot start a refresh (admin-only)

## 🚫 Concurrent Execution Prevention

### Scenario: Two Admins Try to Refresh Simultaneously

**What happens:**
1. Admin A clicks "Start Data Refresh" → ✅ Refresh starts
2. Admin B clicks "Start Data Refresh" → ❌ Error message:
   ```
   Data refresh is already in progress. 
   Started by Admin A at 14:30. 
   Please wait for it to complete.
   ```

**Technical Implementation:**
- Database-level check using `SELECT FOR UPDATE`
- Atomic check-and-set operation
- Button is disabled while refresh is running

## 🔄 Refresh Process Flow

```
1. Admin clicks "Start Data Refresh"
   ↓
2. System checks: Is another refresh running?
   ↓ No
3. Create execution record (status: "running")
   ↓
4. Run ETL jobs sequentially:
   - Purchase Imports (0-33%)
   - Local Sales (33-66%)
   - Local Purchases (66-100%)
   ↓
5. Update progress via WebSocket in real-time
   ↓
6. Mark as "completed" or "failed"
   ↓
7. Send completion notification to all users
```

## 📊 User Interface

### During Refresh:
```
┌─────────────────────────────────────────┐
│ ⚠️ Data Refresh in Progress             │
│ Please wait while we retrieve the       │
│ latest data...                          │
└─────────────────────────────────────────┘

Current Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: [In Progress]
Started by: Jean Dupont at 14:30

Importing local sales from Odoo...
[████████████░░░░░░░░░░░░] 67%

Data Sources:
✓ Purchase Imports - 1,234 records • 45s
→ Local Sales - Processing...
  Local Purchases - Pending
```

### After Completion:
```
✓ Refresh Completed Successfully
  2,456 records processed in 2m 15s

Refresh History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Oct 27, 2025 14:32  [Completed]
Started by Jean Dupont
2,456 records • 2m 15s

Oct 27, 2025 10:15  [Completed]
Started by Marie Martin
2,401 records • 2m 8s
```

## 🛠️ Technical Details

### ETL Jobs Executed:
1. **Purchase Imports** (`etl_jobs/achat_importation_upsert.py`)
   - Fetches invoices starting with "CE" from Odoo
   - Deletes old data, inserts fresh data

2. **Local Sales** (`etl_jobs/ventes_locales_upsert.py`)
   - Fetches out_invoice and out_refund from Odoo
   - Updates movements table

3. **Local Purchases** (`etl_jobs/achats_locaux_echeance_upsert.py`)
   - Fetches local purchases with due dates
   - Updates movements table

### Progress Calculation:
```python
progress = (current_job_index / total_jobs) * 100
```

### WebSocket Messages:
```json
{
  "type": "progress",
  "executionId": 123,
  "progressPercentage": 67,
  "currentStep": "Importing local sales from Odoo...",
  "status": "running"
}
```

## 🚀 Deployment Steps

### 1. Apply Database Migration
```bash
# The migration file will be auto-applied when you restart Docker
docker-compose down
docker-compose up -d --build
```

### 2. Update Environment Variables
Add to `front2/.env`:
```env
VITE_WS_URL=ws://localhost:8000/api/data-refresh/ws
```

For production:
```env
VITE_WS_URL=wss://your-domain.com/api/data-refresh/ws
```

### 3. Install Dependencies
Backend already includes WebSocket support in requirements.txt

### 4. Restart Services
```bash
docker-compose down
docker-compose up -d --build
```

## 🧪 Testing

### Test Concurrent Execution Blocking:
1. Login as Admin A in one browser
2. Login as Admin B in another browser (incognito)
3. Admin A: Click "Start Data Refresh"
4. Admin B: Try to click "Start Data Refresh"
5. ✅ Admin B should see error message

### Test Real-Time Updates:
1. Start refresh in one browser tab
2. Open same page in another tab
3. ✅ Both tabs should show progress in real-time

### Test Non-Admin Access:
1. Login as non-admin user
2. Visit `/data-refresh`
3. ✅ Should be redirected to analytics page

## 📝 User Guide (for Admins)

### How to Refresh Data:

1. **Navigate to "Actualiser les données"** in the sidebar
2. **Click "Start Data Refresh"** button
3. **Wait for completion** (typically 2-3 minutes)
4. **View results** in the execution history

### When to Refresh:
- Daily or as needed
- After major changes in Odoo
- When data appears outdated

### What Gets Refreshed:
- All purchase transactions
- All sales transactions  
- All local purchases with due dates
- Exception records

### Important Notes:
- ⚠️ Only one refresh can run at a time
- ⚠️ If another admin is refreshing, you must wait
- ⚠️ Users can continue working during refresh
- ✓ Progress is shown in real-time
- ✓ History is saved for audit purposes

## 🐛 Troubleshooting

### Refresh Stuck at 0%
- Check backend logs: `docker-compose logs -f backend`
- Verify Odoo connection in `.env` file
- Check ETL job logs

### WebSocket Not Connecting
- Verify `VITE_WS_URL` is correct
- Check CORS settings
- Ensure backend is running

### "Already in progress" Error Won't Clear
- Check database: `SELECT * FROM data_refresh_execution WHERE status = 'running'`
- Manually update stale records: `UPDATE data_refresh_execution SET status = 'failed' WHERE execution_id = X`

## 📊 Database Schema

```sql
CREATE TABLE data_refresh_execution (
    execution_id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL, -- running, completed, failed, cancelled
    started_by INTEGER REFERENCES "User"(user_id),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    total_records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    progress_percentage INTEGER DEFAULT 0,
    current_step VARCHAR(100),
    details JSONB
);
```

## 🔐 Security Considerations

1. **Authorization**: Only admins can start refreshes
2. **Rate Limiting**: Prevented by concurrent execution blocking
3. **Resource Management**: One refresh at a time prevents server overload
4. **Audit Trail**: All refreshes logged with user and timestamp
5. **Error Handling**: Graceful failure with detailed error messages

## 🎨 User-Friendly Language

**We replaced technical terms with user-friendly ones:**
- ❌ "ETL" → ✅ "Data Refresh"
- ❌ "Job execution" → ✅ "Refresh operation"
- ❌ "Records upserted" → ✅ "Records processed"
- ❌ "Pipeline" → ✅ "Data sources"
- ❌ "Process failed" → ✅ "Refresh unsuccessful"

## 📞 Support

For issues or questions:
1. Check execution history for error messages
2. Review backend logs
3. Verify Odoo credentials in `.env`
4. Contact system administrator

---

**Feature completed and ready for use! 🎉**
