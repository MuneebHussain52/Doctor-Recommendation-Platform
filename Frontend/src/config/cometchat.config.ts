import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatCalls } from "@cometchat/calls-sdk-javascript";

// CometChat Configuration
// Replace these with your actual CometChat credentials from dashboard
export const COMETCHAT_CONSTANTS = {
  APP_ID: "1671961d0279cc2c1", // Replace with your CometChat App ID
  REGION: "us", // Replace with your region (us/eu/in)
  AUTH_KEY: "cd5259d415925f97bf1d35cb70d23075a294d569", // Replace with your Auth Key
};

let isCometChatInitialized = false;
let isCometChatCallsInitialized = false;

// Initialize CometChat
export const initializeCometChat = async (): Promise<boolean> => {
  try {
    // Check if already initialized
    if (isCometChatInitialized) {
      console.log("CometChat already initialized");
      return true;
    }

    const appSetting = new CometChat.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(COMETCHAT_CONSTANTS.REGION)
      .autoEstablishSocketConnection(true)
      .build();

    await CometChat.init(COMETCHAT_CONSTANTS.APP_ID, appSetting);
    console.log("CometChat initialized successfully");
    isCometChatInitialized = true;

    // Also initialize CometChat Calls
    if (!isCometChatCallsInitialized) {
      const callAppSettings = new CometChatCalls.CallAppSettingsBuilder()
        .setAppId(COMETCHAT_CONSTANTS.APP_ID)
        .setRegion(COMETCHAT_CONSTANTS.REGION)
        .build();

      await CometChatCalls.init(callAppSettings);
      console.log("CometChat Calls initialized successfully");
      isCometChatCallsInitialized = true;
    }

    return true;
  } catch (error: any) {
    console.error("CometChat initialization failed:", error);
    if (error?.message) {
      console.error("Error message:", error.message);
    }
    return false;
  }
};

// Login user to CometChat
export const loginToCometChat = async (
  userId: string,
  userName: string
): Promise<CometChat.User | null> => {
  try {
    // Check if already logged in
    const user = await CometChat.getLoggedinUser();
    if (user) {
      console.log("User already logged in:", user.getUid());
      return user;
    }

    // Login with Auth Key
    const loggedInUser = await CometChat.login(
      userId,
      COMETCHAT_CONSTANTS.AUTH_KEY
    );
    console.log("Login successful:", loggedInUser);
    return loggedInUser;
  } catch (error: any) {
    console.error("CometChat login error:", error);

    // If user doesn't exist, create and login
    if (error?.code === "ERR_UID_NOT_FOUND") {
      try {
        const user = new CometChat.User(userId);
        user.setName(userName);
        await CometChat.createUser(user, COMETCHAT_CONSTANTS.AUTH_KEY);
        const loggedInUser = await CometChat.login(
          userId,
          COMETCHAT_CONSTANTS.AUTH_KEY
        );
        return loggedInUser;
      } catch (createError) {
        console.error("Failed to create user:", createError);
        return null;
      }
    }
    return null;
  }
};

// Logout from CometChat
export const logoutFromCometChat = async (): Promise<void> => {
  try {
    await CometChat.logout();
    console.log("CometChat logout successful");
  } catch (error) {
    console.error("CometChat logout error:", error);
  }
};

// Generate unique call session ID
export const generateCallSessionId = (appointmentId: string): string => {
  return `appointment_${appointmentId}_${Date.now()}`;
};
