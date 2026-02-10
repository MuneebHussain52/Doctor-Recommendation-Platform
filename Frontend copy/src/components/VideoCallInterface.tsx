import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Upload,
  FileText,
  Eye,
  X,
  Download,
} from "lucide-react";
import {
  joinChannel,
  leaveChannel,
  toggleMicrophone,
  toggleCamera,
} from "../config/agora.config";

interface VideoCallInterfaceProps {
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  isDoctor: boolean;
  onCallEnd: () => void;
  onUploadPrescription?: (appointmentId: string) => void;
  onUploadDocument?: (appointmentId: string) => void;
  onCompleteAppointment?: (appointmentId: string) => void;
  onShareDocument?: (appointmentId: string) => void;
  completionRequested?: boolean;
  onAcceptCompletion?: () => void;
  onRejectCompletion?: () => void;
  documentRequested?: boolean;
  onAcceptDocumentRequest?: () => void;
  onRejectDocumentRequest?: () => void;
  sharedDocuments?: any[];
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  appointmentId,
  patientId,
  patientName,
  doctorId,
  doctorName,
  isDoctor,
  onCallEnd,
  onUploadPrescription,
  onUploadDocument,
  onCompleteAppointment,
  onShareDocument,
  completionRequested = false,
  onAcceptCompletion,
  onRejectCompletion,
  documentRequested = false,
  onAcceptDocumentRequest,
  onRejectDocumentRequest,
  sharedDocuments = [],
}) => {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("Connecting...");
  const [error, setError] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const clientRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeCall = async () => {
      try {
        // Add small delay to ensure any previous cleanup is complete
        await new Promise(
          (resolve) => (initTimeout = setTimeout(resolve, 500))
        );

        if (!mounted) return;

        setCallStatus("Initializing...");

        const channelName = `appointment_${appointmentId}`;
        const userId = isDoctor ? `doctor_${doctorId}` : `patient_${patientId}`;

        console.log("Joining Agora channel:", channelName, "as", userId);

        const { client, videoTrack, audioTrack } = await joinChannel(
          channelName,
          userId
        );

        if (!mounted) {
          // If component unmounted during join, cleanup immediately
          await leaveChannel();
          return;
        }

        clientRef.current = client;

        // Enable camera by default; keep mic muted initially
        videoTrack.setEnabled(true);
        audioTrack.setEnabled(false);
        setIsVideoEnabled(true);
        setIsAudioEnabled(false);

        // Play local video (will show "Camera Off" overlay)
        if (localVideoRef.current && videoTrack) {
          videoTrack.play(localVideoRef.current);
        }

        // Listen for remote users
        client.on(
          "user-published",
          async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
            await client.subscribe(user, mediaType);
            console.log("Subscribed to remote user:", user.uid, mediaType);

            if (mediaType === "video" && remoteVideoRef.current) {
              user.videoTrack?.play(remoteVideoRef.current);
              setRemoteUsers((prev) => {
                if (!prev.find((u) => u.uid === user.uid)) {
                  return [...prev, user];
                }
                return prev;
              });
            }

            if (mediaType === "audio") {
              user.audioTrack?.play();
            }

            setCallStatus("Connected");
          }
        );

        client.on("user-unpublished", (user: IAgoraRTCRemoteUser) => {
          console.log("User unpublished:", user.uid);
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        client.on("user-left", (user: IAgoraRTCRemoteUser) => {
          console.log("User left:", user.uid);
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        setCallStatus(isDoctor ? "Waiting for patient..." : "Connected");
        console.log("Successfully joined call");
      } catch (error: any) {
        console.error("Call initialization error:", error);
        if (mounted) {
          setError(
            error?.message ||
              "Failed to initialize call. Please check your camera and microphone permissions."
          );
          setCallStatus("Error");
        }
      }
    };

    initializeCall();

    return () => {
      mounted = false;
      if (initTimeout) clearTimeout(initTimeout);
      console.log("VideoCallInterface unmounting, forcing cleanup...");
      // Force cleanup on unmount with small delay to ensure proper cleanup
      setTimeout(() => {
        leaveChannel()
          .then(() => {
            console.log("Unmount cleanup complete");
          })
          .catch((err: unknown) => {
            console.error("Error during unmount cleanup:", err);
          });
      }, 200);
    };
  }, [appointmentId, isDoctor, doctorId, patientId]);

  const handleToggleVideo = () => {
    toggleCamera(!isVideoEnabled);
    setIsVideoEnabled(!isVideoEnabled);
  };

  const handleToggleAudio = () => {
    toggleMicrophone(!isAudioEnabled);
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleEndCall = async () => {
    try {
      console.log("Ending call...");
      setCallStatus("Ending call...");

      // Leave channel and cleanup all resources
      await leaveChannel();

      // Small delay to ensure cleanup completes
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("Call ended successfully");
      onCallEnd();
    } catch (error) {
      console.error("Failed to end call:", error);
      // Force cleanup even on error
      await leaveChannel();
      onCallEnd();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Video Consultation
          </h2>
          <p className="text-sm text-gray-600">
            {isDoctor ? `With ${patientName}` : `With ${doctorName}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              callStatus === "In call"
                ? "bg-green-100 text-green-800"
                : callStatus === "Error"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {callStatus}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-900/90 text-white px-6 py-4 rounded-lg max-w-md text-center">
              <p className="text-lg font-semibold mb-2">Error</p>
              <p>{error}</p>
              <button
                onClick={onCallEnd}
                className="mt-4 px-4 py-2 bg-white text-red-900 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Remote Video (Main) */}
            <div ref={remoteVideoRef} className="w-full h-full" />

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <div ref={localVideoRef} className="w-full h-full" />
              {/* Local Video Off Indicator */}
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs">Camera Off</p>
                  </div>
                </div>
              )}
            </div>

            {/* No Remote User Message */}
            {remoteUsers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <div className="animate-pulse mb-4">
                    <div className="h-16 w-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                      <Video className="h-8 w-8" />
                    </div>
                  </div>
                  <p className="text-xl font-medium">
                    {isDoctor
                      ? "Waiting for patient to join..."
                      : "Waiting for doctor..."}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Call Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="flex items-center justify-center gap-4">
            {/* Microphone Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-4 rounded-full transition-all ${
                isAudioEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              title={isAudioEnabled ? "Mute" : "Unmute"}
            >
              {isAudioEnabled ? (
                <Mic className="h-6 w-6 text-white" />
              ) : (
                <MicOff className="h-6 w-6 text-white" />
              )}
            </button>

            {/* Video Toggle */}
            <button
              onClick={handleToggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? (
                <Video className="h-6 w-6 text-white" />
              ) : (
                <VideoOff className="h-6 w-6 text-white" />
              )}
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
              title="End call"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Doctor Actions */}
      {isDoctor && (
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Appointment ID: {appointmentId}
            </div>
            <div className="flex gap-3">
              {isDoctor && (
                <button
                  onClick={() => setShowDocumentsModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors relative"
                >
                  <Eye className="h-4 w-4" />
                  View Documents
                  {sharedDocuments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {sharedDocuments.length}
                    </span>
                  )}
                </button>
              )}
              {onUploadPrescription && (
                <button
                  onClick={() => onUploadPrescription(appointmentId)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Prescription
                </button>
              )}
              {onUploadDocument && (
                <button
                  onClick={() => onUploadDocument(appointmentId)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Request Documents
                </button>
              )}
              {onCompleteAppointment && (
                <button
                  onClick={() => onCompleteAppointment(appointmentId)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  Complete Consultation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer - Patient Actions */}
      {!isDoctor && (
        <div className="bg-white border-t border-gray-200">
          {/* Completion Request Banner */}
          {completionRequested && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      {doctorName || "The doctor"} wants to complete the
                      consultation
                    </p>
                    <p className="text-xs text-yellow-700">
                      Do you want to end this consultation?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onRejectCompletion}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    Not Yet
                  </button>
                  <button
                    onClick={onAcceptCompletion}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Request Banner */}
          {documentRequested && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      {doctorName || "The doctor"} is requesting documents
                    </p>
                    <p className="text-xs text-blue-700">
                      Would you like to share documents?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onRejectDocumentRequest}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    Later
                  </button>
                  <button
                    onClick={onAcceptDocumentRequest}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    Share Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regular Footer */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Appointment ID: {appointmentId}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Documents Modal */}
      {showDocumentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Shared Documents
              </h3>
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {sharedDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    No documents shared yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Documents shared by the patient during this call will appear
                    here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sharedDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">
                              {doc.document_name || "Unnamed Document"}
                            </h4>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Category:</span>{" "}
                              {doc.category || "Other"}
                            </p>
                            <p>
                              <span className="font-medium">Size:</span>{" "}
                              {doc.file_size
                                ? `${(doc.file_size / 1024).toFixed(2)} KB`
                                : "Unknown"}
                            </p>
                            <p>
                              <span className="font-medium">Uploaded:</span>{" "}
                              {doc.uploaded_at
                                ? new Date(doc.uploaded_at).toLocaleString()
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <a
                            href={
                              doc.file_url ||
                              doc.document_file ||
                              `http://localhost:8000${doc.file}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </a>
                          <button
                            onClick={async () => {
                              try {
                                const fileUrl =
                                  doc.file_url ||
                                  doc.document_file ||
                                  `http://localhost:8000${doc.file}`;
                                const response = await fetch(fileUrl);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = doc.document_name || "document";
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              } catch (error) {
                                console.error("Download failed:", error);
                              }
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallInterface;
