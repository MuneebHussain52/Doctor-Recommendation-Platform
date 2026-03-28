import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

// Agora Configuration
// Get your App ID from: https://console.agora.io/
export const AGORA_CONFIG = {
  APP_ID: "5a3f937528824f28a270897c864e10d7", // Your Agora App ID
  // For testing, you can use null token (less secure)
  // For production, implement token server
};

let agoraClient: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let localVideoTrack: ICameraVideoTrack | null = null;

// Initialize Agora Client
export const initializeAgora = async (): Promise<IAgoraRTCClient> => {
  try {
    if (!agoraClient) {
      agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      console.log("Agora client initialized successfully");
    }
    return agoraClient;
  } catch (error) {
    console.error("Agora initialization failed:", error);
    throw error;
  }
};

// Join a channel
export const joinChannel = async (
  channelName: string,
  userId: string
): Promise<{
  client: IAgoraRTCClient;
  audioTrack: IMicrophoneAudioTrack;
  videoTrack: ICameraVideoTrack;
}> => {
  try {
    console.log("Preparing to join channel...");

    // Cleanup any existing connection without nullifying client yet
    if (
      agoraClient &&
      (agoraClient.connectionState === "CONNECTED" ||
        agoraClient.connectionState === "CONNECTING")
    ) {
      console.log("Existing connection found, cleaning up...");

      // Stop existing tracks
      if (localVideoTrack) {
        try {
          localVideoTrack.stop();
          localVideoTrack.close();
          localVideoTrack = null;
        } catch (e) {
          console.log("Error closing existing video track:", e);
        }
      }
      if (localAudioTrack) {
        try {
          localAudioTrack.stop();
          localAudioTrack.close();
          localAudioTrack = null;
        } catch (e) {
          console.log("Error closing existing audio track:", e);
        }
      }

      // Leave existing channel
      try {
        await agoraClient.leave();
        console.log("Left existing channel");
      } catch (e) {
        console.log("Error leaving channel:", e);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Always create fresh client
    console.log("Creating new Agora client...");
    agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    // Create local tracks with error handling
    console.log("Creating local tracks...");
    try {
      [localAudioTrack, localVideoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true },
          { encoderConfig: "480p_1", facingMode: "user" }
        );
      console.log("Local tracks created successfully");
    } catch (trackError: any) {
      console.error("Failed to create tracks:", trackError);
      throw new Error(
        "Camera or microphone access denied. Please allow permissions and try again."
      );
    }

    // Join the channel
    console.log("Joining channel:", channelName, "as user:", userId);
    await agoraClient.join(AGORA_CONFIG.APP_ID, channelName, null, userId);
    console.log("Successfully joined channel");

    // Publish local tracks
    await agoraClient.publish([localAudioTrack, localVideoTrack]);
    console.log("Published local tracks");

    return {
      client: agoraClient,
      audioTrack: localAudioTrack,
      videoTrack: localVideoTrack,
    };
  } catch (error: any) {
    console.error("Failed to join channel:", error);
    // Cleanup on error - but don't call leaveChannel to avoid race condition
    if (localVideoTrack) {
      try {
        localVideoTrack.stop();
        localVideoTrack.close();
      } catch (e) {
        // ignore
      }
      localVideoTrack = null;
    }
    if (localAudioTrack) {
      try {
        localAudioTrack.stop();
        localAudioTrack.close();
      } catch (e) {
        // ignore
      }
      localAudioTrack = null;
    }
    if (agoraClient) {
      try {
        await agoraClient.leave();
      } catch (e) {
        // ignore
      }
      agoraClient = null;
    }
    throw new Error(
      error?.message || "Failed to join video call. Please try again."
    );
  }
};

// Leave channel and cleanup
export const leaveChannel = async (): Promise<void> => {
  try {
    console.log("Starting cleanup...");

    // Stop and close local video track
    if (localVideoTrack) {
      try {
        localVideoTrack.stop();
        localVideoTrack.close();
        console.log("Video track stopped and closed");
      } catch (e) {
        console.log("Error closing video track:", e);
      }
      localVideoTrack = null;
    }

    // Stop and close local audio track
    if (localAudioTrack) {
      try {
        localAudioTrack.stop();
        localAudioTrack.close();
        console.log("Audio track stopped and closed");
      } catch (e) {
        console.log("Error closing audio track:", e);
      }
      localAudioTrack = null;
    }

    // Unpublish and leave channel
    if (agoraClient) {
      try {
        // Unpublish all tracks
        await agoraClient.unpublish();
        console.log("Unpublished tracks");
      } catch (e) {
        console.log("Already unpublished or not published");
      }

      try {
        // Leave the channel
        await agoraClient.leave();
        console.log("Left channel successfully");
      } catch (e) {
        console.log("Error leaving channel:", e);
      }

      // IMPORTANT: Reset client to null so next join creates fresh client
      agoraClient = null;
    }

    console.log("Cleanup completed");
  } catch (error) {
    console.error("Error during cleanup:", error);
    // Force reset even on error
    localVideoTrack = null;
    localAudioTrack = null;
    agoraClient = null;
  }
};

// Toggle microphone
export const toggleMicrophone = (enabled: boolean): void => {
  if (localAudioTrack) {
    localAudioTrack.setEnabled(enabled);
  }
};

// Toggle camera
export const toggleCamera = (enabled: boolean): void => {
  if (localVideoTrack) {
    localVideoTrack.setEnabled(enabled);
  }
};

export { AgoraRTC };
