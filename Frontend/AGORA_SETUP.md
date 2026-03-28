# Agora Video Calling Setup Guide

## Why Agora?

Agora works excellently in Pakistan and globally with:

- ✅ **Better connectivity** in Pakistan region
- ✅ **Lower latency** and more stable connections
- ✅ **Free tier** with 10,000 minutes/month
- ✅ **Easy setup** - just need App ID

## Quick Setup (5 minutes)

### Step 1: Create Agora Account

1. Go to: https://console.agora.io/
2. Sign up for free account
3. Verify your email

### Step 2: Create a Project

1. Click "Project Management" → "Create"
2. Project Name: `Healthcare Video Calls`
3. Use Case: `Video Calling`
4. Authentication: Select "APP ID" (for testing)
5. Click "Submit"

### Step 3: Get Your APP ID

1. Find your project in the list
2. Copy the **App ID** (looks like: `abc123def456...`)

### Step 4: Configure the Application

Open: `Frontend copy/src/config/agora.config.ts`

Replace this line:

```typescript
APP_ID: "YOUR_AGORA_APP_ID",
```

With your actual App ID:

```typescript
APP_ID: "abc123def456ghi789jkl",  // ✅ Your actual App ID from Agora Console
```

### Step 5: Start Using

```bash
npm run dev
```

That's it! Video calling will now work.

## How It Works

### Doctor Flow:

1. Doctor clicks "Start" on online appointment
2. Video interface opens immediately
3. Doctor's video shows in small box (bottom-right)
4. Patient's video will appear when they join
5. Can upload prescriptions/documents during call

### Patient Flow:

1. When doctor starts call, patient sees popup automatically (no separate SDK needed)
2. Patient clicks "Accept"
3. Patient joins the video call
4. Both can see each other and talk

## Features

- ✅ **HD Video & Audio** - Crystal clear quality
- ✅ **Picture-in-Picture** - Local video in corner, remote video full screen
- ✅ **Controls** - Mute/unmute mic, turn camera on/off
- ✅ **Works in Pakistan** - Optimized for regional connectivity
- ✅ **Same Interface** - Exact same UI as before, just better performance

## Testing

### Test locally:

1. Open two browser windows
2. Window 1: Log in as doctor
3. Window 2: Log in as patient
4. Doctor starts call
5. Patient accepts
6. Both should see each other!

## Troubleshooting

### "Permission Denied" Error

- Browser needs camera/microphone access
- Click "Allow" when prompted
- Or check browser settings

### Video Not Showing

- Check camera is not used by another app
- Try refreshing the page
- Check browser console for specific errors

### Connection Issues

- Verify App ID is correct
- Check internet connection
- Try different browser (Chrome recommended)

### No Remote Video

- Wait a few seconds after joining
- Patient must click "Accept" to join
- Check both users have camera permissions

## Production Deployment

For production, you should use **Token Authentication** (more secure):

1. Enable Token Authentication in Agora Console
2. Set up a token server (backend)
3. Generate tokens for each call
4. See: https://docs.agora.io/en/video-calling/get-started/authentication-workflow

## Pricing

**Free Tier:**

- 10,000 minutes/month FREE
- Perfect for small clinics
- No credit card required

**Paid Plans:**

- $0.99 per 1,000 minutes (after free tier)
- Very affordable for healthcare use
- See: https://www.agora.io/en/pricing/

## Support

- Agora Docs: https://docs.agora.io/
- Community: https://www.agora.io/en/community/
- Support: https://agora-ticket.agora.io/

## Comparison with CometChat

| Feature           | Agora            | CometChat              |
| ----------------- | ---------------- | ---------------------- |
| Works in Pakistan | ✅ Excellent     | ❌ Connectivity issues |
| Setup Time        | 5 minutes        | 15 minutes             |
| Free Tier         | 10,000 min/month | Limited                |
| Quality           | HD               | HD                     |
| Latency           | Very Low         | Medium                 |
| Price             | $0.99/1000 min   | Higher                 |

## Need Help?

If you get stuck:

1. Check the App ID is correctly copied (no spaces)
2. Restart dev server after config change
3. Check browser console for specific errors
4. Try incognito mode to rule out extensions

The system is now ready to use with just your Agora App ID!
