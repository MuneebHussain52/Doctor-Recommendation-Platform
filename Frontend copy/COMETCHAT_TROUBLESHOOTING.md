# CometChat Troubleshooting Guide

## Error: "Failed to initialize call. Please try again."

This error occurs when CometChat is not properly configured. Follow these steps:

### Step 1: Verify CometChat Credentials

1. **Check if you've replaced placeholder values:**

   - Open: `src/config/cometchat.config.ts`
   - Look for these lines:

   ```typescript
   export const COMETCHAT_CONSTANTS = {
     APP_ID: "YOUR_APP_ID", // ❌ Must be replaced
     REGION: "us", // ❌ Must be your actual region
     AUTH_KEY: "YOUR_AUTH_KEY", // ❌ Must be replaced
   };
   ```

2. **Get your actual credentials:**

   - Go to: https://app.cometchat.com/
   - Sign up or log in
   - Create a new app or select existing app
   - Copy these values:
     - **APP_ID**: From app dashboard (e.g., "2567891234abcdef")
     - **REGION**: Your app region (us, eu, or in)
     - **AUTH_KEY**: From "API Keys" section

3. **Update the config file:**
   ```typescript
   export const COMETCHAT_CONSTANTS = {
     APP_ID: "2567891234abcdef", // ✅ Your actual App ID
     REGION: "us", // ✅ Your actual region
     AUTH_KEY: "abc123xyz789...", // ✅ Your actual Auth Key
   };
   ```

### Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for specific errors:

#### Common Errors and Solutions:

**Error: "APP_ID is invalid"**

- Solution: Double-check your APP_ID from CometChat dashboard
- Make sure there are no extra spaces or quotes

**Error: "Invalid AUTH_KEY"**

- Solution: Regenerate AUTH_KEY in CometChat dashboard
- Copy the new key carefully (no spaces)

**Error: "User not logged in to CometChat"**

- Solution: CometChat login is automatic, but check:
  - Doctor/Patient is logged into your app
  - CometChat initialization runs on page load
  - No errors in initialization logs

**Error: "Receiver user not found"**

- Solution: Users are auto-created on first login
- Ensure both doctor and patient have accessed their dashboards at least once

### Step 3: Test CometChat Initialization

Add this test to check if CometChat is working:

1. Open browser console on Doctor dashboard
2. Type:

```javascript
CometChat.getLoggedinUser()
  .then((user) => {
    console.log("Logged in user:", user);
  })
  .catch((err) => {
    console.log("Not logged in:", err);
  });
```

3. You should see your user details. If not, check initialization.

### Step 4: Verify Network Connectivity

1. Open DevTools → Network tab
2. Filter by "cometchat"
3. Try starting a call
4. Look for failed requests (red)

**If you see 401/403 errors:**

- AUTH_KEY is incorrect
- Regenerate in CometChat dashboard

**If you see no requests:**

- CometChat not initialized
- Check APP_ID and REGION

### Step 5: Check Video/Audio Permissions

1. Browser must have camera/microphone permissions
2. Look for permission prompt at top of browser
3. Grant permissions when asked
4. If denied, go to browser settings:
   - Chrome: Settings → Privacy → Site Settings → Camera/Microphone
   - Allow for localhost

### Step 6: Restart Development Server

After updating credentials:

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Quick Test Checklist

✅ CometChat account created  
✅ App created in CometChat dashboard  
✅ APP_ID copied correctly  
✅ REGION matches dashboard  
✅ AUTH_KEY copied correctly  
✅ No quotes or spaces in credentials  
✅ Development server restarted  
✅ Browser has camera/microphone permissions  
✅ Console shows "CometChat initialized successfully"  
✅ Console shows "CometChat Calls initialized successfully"

## Still Not Working?

### Check Complete Logs

When starting a call, you should see these logs in order:

```
1. CometChat initialized successfully
2. CometChat Calls initialized successfully
3. CometChat user: doctor_123 (or patient_456)
4. Initializing call with: { sessionID: "appointment_...", ... }
5. Call initiated successfully
```

If any step is missing, that's where the problem is.

### Common Issues:

**No initialization logs:**

- Check if `initializeCometChat()` is being called
- Look in Doctor/Patient Appointments components
- Should happen in useEffect on mount

**User ID shows but call fails:**

- Check receiver user exists
- Ensure patient has logged in at least once
- Try refreshing both doctor and patient pages

**Call initiates but video doesn't load:**

- Camera/microphone permissions denied
- Check browser console for media errors
- Try different browser (Chrome recommended)

## For Development/Testing

If you just want to test the UI without CometChat:

1. You can temporarily disable video calling by commenting out the Start button handler
2. Or use mock data to test the interface
3. But for real video calls, CometChat credentials are required

## Getting Help

If none of these steps work:

1. Copy full error from browser console
2. Check CometChat documentation: https://www.cometchat.com/docs
3. Verify your CometChat app is active (not suspended)
4. Check CometChat status page for outages
5. Contact CometChat support with:
   - Your APP_ID
   - Error messages from console
   - Steps you've tried

## Important Notes

- **Development**: Works on localhost without HTTPS
- **Production**: REQUIRES HTTPS for camera/microphone access
- **Free Tier**: Limited to certain number of users/calls
- **User IDs**: Automatically formatted as `doctor_{id}` or `patient_{id}`
- **Session IDs**: Automatically use `appointment_{appointmentId}`
