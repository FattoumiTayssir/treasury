# Analytics Dashboard - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Frontend

```bash
cd front2
npm install  # If you haven't already
npm run dev
```

The app will start at `http://localhost:5173`

### 2. Access Analytics

1. **Login** to the application
2. Click **"Analyse"** in the sidebar (second menu item with chart icon 📊)
3. View your treasury analytics dashboard

## 📊 Dashboard Overview

### Top Section - Key Metrics (4 Cards)

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Solde Actuel   │  Prévision 30j  │  Entrées 30j    │  Sorties 30j    │
│  €1,250,000     │  €1,320,000     │  €850,000       │  €780,000       │
│  ↑ +5.2%        │  +€70,000       │  Moy: €28,333/j │  Moy: €26,000/j │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Color Indicators:**
- 🔵 Blue: Current treasury position
- 🟢 Green: Projections and inflows
- 🔴 Red: Outflows
- ⚪ Emerald: Forecasts

### Filters Section

```
┌──────────────────────────────────────────────────────────────┐
│ Période d'analyse:  [📅 Jan 1, 2024] → [📅 Apr 30, 2024]    │
│ Catégories:         [▼ Toutes les catégories]                │
│                         □ RH  □ Achat  □ Vente  □ Compta    │
└──────────────────────────────────────────────────────────────┘
```

### Tab 1: Prévisions de Solde

**Interactive Area Chart**
- Blue line = Actual balance (historical data)
- Emerald line = Predicted balance (forecast)
- Hover over any point to see exact values
- Smooth curves for easy trend analysis

**Use Case:** 
*"When will my treasury reach €1.5M?" → Look where emerald line crosses €1.5M*

### Tab 2: Flux de Trésorerie

**Two Charts:**

1. **Monthly Inflows vs Outflows (Bar Chart)**
   - Green bars = Money coming in
   - Red bars = Money going out
   - Side-by-side comparison

2. **Net Cash Flow (Area Chart)**
   - Shows profit/loss per period
   - Positive = above zero line (good)
   - Negative = below zero line (watch out)

**Use Case:** 
*"Which months had the best cash flow?" → Look for highest green areas*

### Tab 3: Analyse par Catégorie

**Two Panels:**

1. **Donut Chart** - Visual distribution
   ```
        Vente 45%
       /           \
   Achat 30%     RH 15%
       \           /
     Compta 7%  Autre 3%
   ```

2. **Detailed List** - Exact numbers
   ```
   Vente        €1,125,000  ████████████████████ 45%  (92 mouvements)
   Achat        €750,000    █████████████        30%  (67 mouvements)
   RH           €375,000    ███████              15%  (45 mouvements)
   Compta       €175,000    ███                   7%  (28 mouvements)
   Autre        €75,000     █                     3%  (12 mouvements)
   ```

**Use Case:** 
*"Where is most money going?" → Check largest slice/highest percentage*

### Tab 4: Tendances

**Advanced Analysis:**

1. **Daily Breakdown (Stacked Area)**
   - See inflow/outflow/net change per day
   - Identify patterns (e.g., Mondays have high outflows)

2. **Average Balance Trends (Bar Chart)**
   - Monthly average treasury balance
   - Spot seasonal patterns

**Use Case:** 
*"Is my average balance growing?" → Check if bars trend upward*

## 🎯 Common Tasks

### Filter by Date Range
1. Click the date range picker
2. Select start date (click calendar)
3. Select end date (click calendar)
4. Charts update automatically

### Filter by Category
1. Click "Catégories" dropdown
2. Check/uncheck categories (RH, Achat, Vente, etc.)
3. Click outside to close
4. Charts update to show only selected categories

### Switch Views
- Click any tab name to switch between different analyses
- All tabs use the same date/category filters

### Export Data (Future Feature)
- Click download icon (coming soon)
- Select PNG, SVG, or CSV format

## 💡 Tips & Tricks

### Reading the Charts

**Positive Trends:**
- ✅ Balance line trending upward
- ✅ Inflows > Outflows consistently
- ✅ Net cash flow above zero
- ✅ Predicted balance higher than current

**Warning Signs:**
- ⚠️ Balance line trending downward
- ⚠️ Outflows > Inflows for multiple periods
- ⚠️ Large gaps between predicted and actual
- ⚠️ Negative net cash flow

### Performance

**Slow Loading?**
- Reduce date range (smaller = faster)
- Filter by specific categories
- Refresh browser if needed

### Data Accuracy

**Mock Data vs Real Data:**
- Currently using **mock data** for demonstration
- Once backend is connected, you'll see real treasury data
- Mock data updates on every page load for variety

## 🐛 Troubleshooting

### "No data to display"
- Check date range includes movements
- Verify category filters aren't excluding everything
- Ensure you have movements in the database

### Charts look broken
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Check browser console for errors (`F12`)

### Backend not connected
- Analytics page gracefully falls back to mock data
- Check console for "using mock data" message
- Implement backend endpoints (see ANALYTICS_BACKEND_EXAMPLE.md)

## 🎨 Customization Ideas

### For Your Business Needs:

1. **Add More Metrics**
   - Days of cash remaining
   - Burn rate
   - Revenue growth rate

2. **Custom Alerts**
   - Balance below threshold
   - Large unexpected movements
   - Forecast accuracy warnings

3. **Export Capabilities**
   - Generate PDF reports
   - Email scheduled summaries
   - Export to Excel

4. **Advanced Forecasting**
   - Machine learning predictions
   - Scenario planning ("what if" analysis)
   - Confidence intervals

## 📱 Mobile Responsiveness

The dashboard is fully responsive:
- **Desktop**: Full 4-column layout
- **Tablet**: 2-column layout
- **Mobile**: Single column, stacked cards

All charts scale to fit screen size.

## ⌨️ Keyboard Shortcuts (Future)

- `D` - Go to Dashboard
- `A` - Go to Analytics
- `M` - Go to Movements
- `E` - Go to Exceptions
- `F` - Focus on filters
- `Esc` - Close modals

## 🔒 Security

- All data respects user company permissions
- Only shows data for companies you have access to
- Sensitive amounts can be masked (coming soon)

## 📞 Support

**Issues or Questions?**
1. Check this guide first
2. Review ANALYTICS_IMPLEMENTATION.md for technical details
3. Contact development team
4. Submit bug report with:
   - Screenshot
   - Browser/version
   - Date range and filters used
   - Console errors (F12 → Console)

## 🎓 Learning Resources

**Want to understand the charts better?**
- [Tremor Documentation](https://tremor.so/docs)
- [Financial Forecasting Basics](https://www.investopedia.com/terms/f/forecasting.asp)
- [Cash Flow Analysis Guide](https://www.investopedia.com/terms/c/cashflow.asp)

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                  ANALYTICS QUICK REFERENCE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Access:       Sidebar → "Analyse"                       │
│  📅 Filters:      Date range + Categories                   │
│  📈 Tabs:         4 different views of your data            │
│                                                             │
│  METRIC CARDS (Top Row)                                     │
│  ├─ Blue:        Current treasury balance                   │
│  ├─ Emerald:     30-day forecast                            │
│  ├─ Green:       Total inflows                              │
│  └─ Red:         Total outflows                             │
│                                                             │
│  CHART TABS                                                 │
│  ├─ Tab 1:       Balance Forecast (historical + predicted)  │
│  ├─ Tab 2:       Cash Flow Analysis (in vs out)             │
│  ├─ Tab 3:       Category Breakdown (where money goes)      │
│  └─ Tab 4:       Detailed Trends (daily patterns)           │
│                                                             │
│  INTERACTIONS                                               │
│  ├─ Hover:       See exact values                           │
│  ├─ Click tabs:  Switch between views                       │
│  └─ Filters:     Auto-update all charts                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Happy Analyzing! 📊💰**
