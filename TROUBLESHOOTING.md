# FPL Advisor - Troubleshooting Guide

This guide will help you troubleshoot and fix issues when the application encounters errors or unexpected behavior.

## 🐛 Debug Tools Overview

The application includes comprehensive debugging tools to help you identify and fix issues quickly.

### Debug Panel (Floating Bug Button)

**Location:** Bottom-right corner of the screen (🐛 icon)

**What it shows:**
- All API calls made by the application
- Success/failure status of each request
- Error messages and stack traces
- Timing information for requests
- Request/response details

**How to use:**
1. Click the bug icon in the bottom-right corner
2. The panel shows a timeline of all events
3. Use filters to view specific types of logs:
   - **All**: Shows everything
   - **Errors**: Only failed operations
   - **API**: Only API calls
   - **Info**: General information
4. Search logs using the search box
5. Click "Details" under any log entry to see full information
6. Export logs as JSON for sharing or analysis

**Badge indicator:**
- Red badge with number = shows count of errors
- No badge = no errors detected

### Enhanced Error Messages

The application provides specific error messages instead of generic failures:
- "Bootstrap data failed" - Problem loading player/team data
- "Team data failed" - Problem loading your team information
- "Fixtures data failed" - Problem loading fixture information
- "Team picks failed" - Problem loading your current squad
- "Team history failed" - Problem loading gameweek history
- "Request timed out" - Request took too long (>20 seconds)

### Automatic Logging

All API calls are automatically logged with:
- Request URL and method
- Start time and duration
- Success/failure status
- Error details if failed
- Retry attempts

## 🔍 Common Issues and Solutions

### Issue 1: Application Stuck on Loading Screen

**Symptoms:**
- "Consulting the AI Coach..." message stays visible
- Page never loads

**Debug steps:**
1. Open the Debug Panel (bug icon)
2. Look for the last API call made
3. Check if any call shows "Request timed out" or error status

**Solutions:**
- **If "Bootstrap data failed"**: FPL API might be down. Wait 5-10 minutes and refresh.
- **If "Team data failed"**: Check if your Team ID is correct in the dropdown.
- **If timeout errors**: Your internet connection might be slow. Refresh and wait longer.
- **If no logs appear**: Open browser console (F12) - there might be a JavaScript error.

### Issue 2: Error State After Loading

**Symptoms:**
- Page loads but shows error message
- Some data is missing

**Debug steps:**
1. Read the error message at the top of the page
2. Open Debug Panel and filter by "Errors"
3. Look at the most recent error entries

**Solutions:**
- **"Failed to fetch team picks"**: The gameweek might not have started yet, or your team has no picks.
- **"Failed to fetch fixtures"**: FPL fixture data might be temporarily unavailable. Refresh in a few minutes.
- **"Partial Data Loaded"**: Some non-critical data failed to load, but the app should still work.

### Issue 3: Blank Screen

**Symptoms:**
- Nothing appears on the screen
- No loading indicator

**Debug steps:**
1. Open browser console (F12)
2. Look for red error messages
3. Check the Console and Network tabs

**Solutions:**
- Clear browser cache: Settings > Clear browsing data
- Check if JavaScript is enabled in your browser
- Try a different browser (Chrome, Firefox, Safari)
- Check if the application is running: `npm run dev` should show "Ready" in terminal

### Issue 4: "Failed to load team data" Error

**Symptoms:**
- Specific error mentioning team data

**Debug steps:**
1. Check the Team ID in the URL or dropdown
2. Open Debug Panel and look for the failed API call
3. Note the HTTP status code (404, 500, etc.)

**Solutions:**
- **HTTP 404**: Team ID doesn't exist. Double-check the ID.
- **HTTP 500**: FPL server error. Wait and try again.
- **HTTP 429**: Rate limited. Wait 60 seconds before refreshing.
- **Network error**: Check your internet connection.

## 🛠️ Debugging Workflow

Follow this systematic approach when encountering issues:

### Step 1: Check the Error Message
Look for any red error messages or warnings on the page.

### Step 2: Open Debug Panel
1. Click the bug icon (🐛) in bottom-right
2. Review the timeline of events
3. Look for red ❌ icons indicating errors

### Step 3: Identify the Failed Request
1. Filter by "Errors" or "API"
2. Find the first request that failed
3. Click "Details" to see full information

### Step 4: Understand the Error
Common error patterns:
- **TimeoutError**: Request took too long
  - Solution: Refresh, or check internet connection
- **HTTP 404**: Resource not found
  - Solution: Verify Team ID or data exists
- **HTTP 500**: Server error
  - Solution: Wait and retry, FPL API issue
- **Failed to fetch**: Network error
  - Solution: Check internet, firewall, or VPN

### Step 5: Apply the Fix
Based on the error type:
1. Try refreshing the page
2. Wait 1-2 minutes and try again
3. Clear cache and reload
4. Check Team ID setting
5. Verify FPL website is working

### Step 6: Export Logs (If Needed)
If the issue persists:
1. Open Debug Panel
2. Click "Export" button
3. Save the JSON file
4. Use it for further analysis or bug reports

## 📊 Understanding Log Types

### 🔌 API Logs
- Show all requests to FPL API or internal endpoints
- Include URL, method (GET/POST), and status

### ❌ Error Logs
- Any failed operation
- Include error message and stack trace
- Most important for debugging

### ✅ Success Logs
- Successful operations
- Confirm what's working correctly

### ℹ️ Info Logs
- General information about app state
- Useful for understanding flow

### ⚠️ Warning Logs
- Non-critical issues
- App continues working but something's not ideal

## 🔧 Advanced Debugging

### Browser Console (F12)

**How to open:**
- **Windows/Linux**: Press F12 or Ctrl+Shift+I
- **Mac**: Press Cmd+Option+I

**What to look for:**
1. **Console tab**: JavaScript errors and logs
2. **Network tab**: See all HTTP requests
   - Red items = failed requests
   - Click on a request to see details
3. **Application tab**: Check localStorage data

### Network Tab Analysis

1. Open DevTools (F12) > Network tab
2. Refresh the page
3. Look for failed requests (red)
4. Click on a failed request to see:
   - Status code
   - Response body (error message)
   - Request headers
   - Timing information

### Clear Application Data

If all else fails:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage" (left sidebar)
4. Check all boxes
5. Click "Clear site data"
6. Refresh the page

## 📝 Reporting Issues

When reporting a bug, include:

1. **Error Message**: Copy the exact error text
2. **Debug Logs**: Export from Debug Panel
3. **Browser Console**: Screenshot or copy errors
4. **Steps to Reproduce**: What you did before the error
5. **Environment**: Browser type/version, OS
6. **Team ID**: If team-specific issue

## 🎯 Quick Reference

| Symptom | First Check | Quick Fix |
|---------|-------------|-----------|
| Stuck loading | Debug Panel for timeouts | Refresh page |
| Error message | Read the specific error | Follow error-specific solution |
| Blank screen | Browser console | Clear cache |
| Wrong team data | Team ID in dropdown | Select correct team |
| Old data showing | Cache issue | Hard refresh (Ctrl+Shift+R) |

## 💡 Pro Tips

1. **Keep Debug Panel open** while navigating the app to see live requests
2. **Auto-scroll ON** (default) keeps the newest logs at the top
3. **Export logs** before refreshing if you see an interesting error
4. **Search logs** to find specific requests or errors quickly
5. **Check the badge** on the bug icon - if it has a number, there are errors

## 🚀 Performance Monitoring

The Debug Panel also helps with performance:
- Look at request durations (shown in milliseconds)
- Identify slow requests (>5000ms is slow)
- See retry attempts and delays
- Monitor how many API calls are made

## ❓ Still Having Issues?

If you've tried everything:
1. Export debug logs
2. Check browser console
3. Verify FPL website is accessible: https://fantasy.premierleague.com
4. Try with a different team ID to isolate if it's team-specific
5. Test on a different device/browser
6. Check if you're behind a corporate firewall/VPN

---

**Remember:** The Debug Panel is your best friend! It shows exactly what's happening under the hood. 🐛

