# CometChat Video Calling Integration Setup

This guide will help you set up CometChat video calling for the healthcare application.

## Prerequisites

- Node.js and npm installed
- CometChat account (sign up at https://www.cometchat.com/)

## Step 1: Create a CometChat App

1. Go to [CometChat Dashboard](https://app.cometchat.com/)
2. Sign up or log in to your account
3. Click on "Create App" or "Add New App"
4. Fill in your app details:
   - App Name: e.g., "Healthcare Video Calling"
   - Region: Choose your preferred region (US, EU, or IN)
   - Select appropriate plan (Free tier available)
5. Click "Create"

## Step 2: Get Your CometChat Credentials

After creating your app, you'll need three important values:

1. **APP_ID**: Found in your app dashboard
2. **REGION**: The region you selected (us, eu, or in)
3. **AUTH_KEY**: Found in the "API Keys" section of your app dashboard

## Step 3: Configure the Application

1. Open the file: `src/config/cometchat.config.ts`

2. Replace the placeholder values with your actual CometChat credentials:

```typescript
export const COMETCHAT_CONSTANTS = {
  APP_ID: "YOUR_APP_ID", // Replace with your actual App ID
  REGION: "us", // Replace with your region (us/eu/in)
  AUTH_KEY: "YOUR_AUTH_KEY", // Replace with your actual Auth Key
};
```

Example:

```typescript
export const COMETCHAT_CONSTANTS = {
  APP_ID: "123456789abcdef",
  REGION: "us",
  AUTH_KEY: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
};
```

## Step 4: Install Dependencies

The CometChat packages have already been installed. If you need to reinstall them:

```bash
npm install @cometchat/chat-sdk-javascript @cometchat/calls-sdk-javascript
```

## Step 5: Test the Integration

1. Start your backend server:

```bash
cd backend
python manage.py runserver
```

2. Start your frontend development server:

```bash
cd "Frontend copy"
npm run dev
```

3. Test the video calling feature:
   - Log in as a doctor
   - Navigate to Appointments
   - Click "Start" on an upcoming online appointment
   - The video call interface should appear
4. Test patient-side:
   - Log in as a patient
   - When a doctor starts a call, a popup should appear
   - Click "Accept" to join the video call

## How It Works

### Doctor Side

1. Doctor clicks "Start" button on an online appointment
2. Confirmation modal appears
3. On confirmation, CometChat initiates a video call
4. Video interface opens with:
   - Video feed area
   - Controls (mic, camera, end call)
   - Action buttons (Upload Prescription, Upload Document, Complete Consultation)

### Patient Side

1. Patient receives incoming call notification popup
2. Shows doctor's name and appointment details
3. Patient can Accept or Decline
4. On acceptance, video interface opens
5. Patient sees video feed and controls

## Features

- **Real-time Video/Audio**: High-quality video and audio communication
- **Call Controls**: Mute/unmute microphone, enable/disable camera
- **UI Integration**: Video interface maintains existing header and footer
- **Doctor Actions**: Upload prescriptions and documents during call
- **Call Management**: Easy end call functionality

## Troubleshooting

### Camera/Microphone Not Working

- Ensure browser has permission to access camera and microphone
- Check browser settings (usually shown in address bar)
- Try using HTTPS in production (required for media access)

### Connection Issues

- Verify CometChat credentials are correct
- Check network connection
- Ensure backend server is running
- Check browser console for errors

### Call Not Connecting

- Verify both users are logged into CometChat
- Check that appointment ID is valid
- Ensure patient is online when doctor initiates call

## Security Notes

- Never commit your actual AUTH_KEY to version control
- Consider using environment variables for production:
  - Create `.env` file with: `VITE_COMETCHAT_APP_ID`, `VITE_COMETCHAT_REGION`, `VITE_COMETCHAT_AUTH_KEY`
  - Update config file to use: `import.meta.env.VITE_COMETCHAT_APP_ID`
- Use CometChat's authentication tokens for production deployments

## Production Deployment

For production:

1. Use environment variables instead of hardcoded credentials
2. Enable HTTPS (required for camera/microphone access)
3. Consider using CometChat's authentication tokens instead of Auth Key
4. Set up proper user authentication with your backend
5. Configure CometChat webhooks for call logging (optional)

## Support

- CometChat Documentation: https://www.cometchat.com/docs
- CometChat Support: https://help.cometchat.com/
- React SDK Guide: https://www.cometchat.com/docs/react-uikit/overview

## Additional Resources

- [CometChat Dashboard](https://app.cometchat.com/)
- [CometChat Video Calling Guide](https://www.cometchat.com/docs/chat-apis/video-calling)
- [CometChat React SDK](https://www.cometchat.com/docs/react-uikit/overview)
