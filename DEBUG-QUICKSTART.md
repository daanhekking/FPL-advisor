# 🐛 Debug Quick Start

## What's New?

Your FPL Advisor now has **powerful debugging tools** to help you identify and fix issues quickly!

## 🎯 Quick Access

### Debug Panel (Primary Tool)
- **Location**: Bottom-right corner - floating bug icon (🐛)
- **Click it** to see all API calls, errors, and logs in real-time
- **Badge shows error count** (red number = errors detected)

### When Things Go Wrong

**Stuck Loading?**
1. Click the bug icon (🐛)
2. Look for red ❌ error icons
3. Click "Details" on the first error
4. Read the error message for specific issue

**Error Message Shows?**
1. Read the message (it now tells you EXACTLY what failed)
2. Click bug icon for more details
3. Follow the suggestion in the error

## 📊 Debug Panel Features

### Filters (Top Tabs)
- **All**: Everything
- **Errors**: Only problems (start here!)
- **API**: All network requests
- **Info**: General information

### Actions (Top Right)
- **Export**: Download logs as JSON
- **Clear**: Remove all logs

### Search Box
- Type to search through logs
- Find specific requests or errors

### Each Log Entry Shows
- 🕐 **Time**: When it happened
- 📝 **Message**: What happened
- 📦 **Details** button: Full information
- ⚠️ **Error details**: If it failed

## 🔍 Common Errors & Fixes

| Error Message | What It Means | Quick Fix |
|---------------|---------------|-----------|
| "Bootstrap data failed" | Can't load players/teams | Wait 2 min, refresh |
| "Team data failed" | Invalid team ID | Check team dropdown |
| "Request timed out" | Took too long | Check internet, refresh |
| "Failed to fetch" | Network issue | Check connection |
| "HTTP 404" | Not found | Verify team ID |
| "HTTP 500" | FPL server error | Wait and retry |

## 💡 Pro Debugging Tips

1. **First time using Debug Panel?**
   - Open it now and keep it open
   - Watch logs appear as you use the app
   - Get familiar with the interface

2. **Error just happened?**
   - Don't refresh yet!
   - Open Debug Panel first
   - Export logs if needed
   - Then try refresh

3. **Can't find the issue?**
   - Filter by "Errors" only
   - Look at the FIRST error (oldest)
   - Later errors might be caused by the first one

4. **Want to share an issue?**
   - Click "Export" in Debug Panel
   - Attach the JSON file when reporting
   - Include browser console (F12) screenshot

## 🚀 Testing the Debug Tools

Try this to see the tools in action:

1. Open the app
2. Open Debug Panel (bug icon)
3. Click "Refresh" in the top-right
4. Watch the logs populate in real-time
5. Click "Details" on any API call to see full info

## ⚡ Quick Keyboard Shortcuts

- **F12**: Open browser DevTools
- **Ctrl+Shift+R** (Cmd+Shift+R on Mac): Hard refresh
- **Ctrl+Shift+I** (Cmd+Option+I on Mac): Open console

## 📱 What Gets Logged?

The Debug Panel automatically logs:
- ✅ All API requests (URL, timing, status)
- ❌ All errors (with full details)
- ℹ️ App state changes
- 🔄 Retry attempts
- ⏱️ Request durations

## 🎨 Color Coding

- **Red** ❌ = Error (something failed)
- **Orange** ⚠️ = Warning (non-critical issue)
- **Green** ✅ = Success (worked correctly)
- **Blue** 🔌 = API call (network request)
- **Gray** ℹ️ = Info (general message)

## 📖 Need More Help?

See the full debugging guide: [DEBUGGING.md](./DEBUGGING.md)

## ✨ Remember

**The Debug Panel is your best friend for troubleshooting!**

It shows you EXACTLY what's happening in your app, in real-time, with full details.

No more guessing! 🎯

