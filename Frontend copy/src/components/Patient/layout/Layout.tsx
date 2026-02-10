import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileSidebar from "./MobileSidebar";
import {
  LanguageProvider,
  useLanguage,
} from "../../../contexts/LanguageContext";
import { patientAPI } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { Phone, PhoneOff } from "lucide-react";

const LayoutContent = () => {
  const { patient } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Shared profile name and avatar state
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");

  // Shared appointments state for all patient pages
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State to trigger notification refresh
  const [notificationRefreshTrigger, setNotificationRefreshTrigger] =
    useState(0);

  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [showDocumentRequest, setShowDocumentRequest] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showCallEndedMessage, setShowCallEndedMessage] = useState(false);
  const [callEndedByPatient, setCallEndedByPatient] = useState(false);
  const [showAnswerConfirm, setShowAnswerConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);
  const [showDocumentsShared, setShowDocumentsShared] = useState(false);
  const [showPermissionDeclined, setShowPermissionDeclined] = useState(false);
  const [showCompletionRequest, setShowCompletionRequest] = useState(false);
  const [showConsultationFinished, setShowConsultationFinished] =
    useState(false);
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const [showPrescriptionNotification, setShowPrescriptionNotification] =
    useState(false);

  // Use ref to track handled calls to prevent re-showing during polling
  const handledCallIdsRef = useRef<Set<string>>(new Set());

  const refreshNotifications = () => {
    setNotificationRefreshTrigger((prev) => prev + 1);
  };

  const refreshAppointments = async () => {
    if (!patient?.id) return;

    try {
      const data = await patientAPI.getAppointments(patient.id);

      // Debug: Log raw data from API - ALL OF IT
      console.log("[PatientLayout] Sample raw appointment:", data[0]);

      // Debug: Log raw data from API
      const rescheduledRaw = data.filter(
        (a: any) => a.rescheduled_by && a.rescheduled_by !== ""
      );
      console.log(
        "[PatientLayout] Appointments with rescheduled_by in API:",
        rescheduledRaw.length
      );
      if (rescheduledRaw.length > 0) {
        console.log(
          "[PatientLayout] Raw API data with rescheduled_by:",
          rescheduledRaw.map((a: any) => ({
            id: a.id,
            rescheduled_by: a.rescheduled_by,
            reschedule_reason: a.reschedule_reason,
          }))
        );
      }

      const transformedAppointments = data.map((apt: any) => ({
        id: apt.id,
        doctor: {
          id: apt.doctor_info?.id || "unknown",
          name: apt.doctor_info?.name || "Unknown Doctor",
          specialty: apt.doctor_info?.specialty || "Unknown",
          avatar: apt.doctor_info?.avatar || undefined,
          rating: 4.5,
        },
        date: apt.appointment_date,
        time: apt.appointment_time,
        status: apt.status,
        type: apt.appointment_type,
        mode: apt.appointment_mode,
        location:
          apt.appointment_mode === "in-person" && apt.location_info?.name
            ? apt.location_info.name
            : apt.appointment_mode === "online"
            ? "Online Consultation"
            : "",
        isFollowUp: apt.appointment_type === "Follow-up",
        symptoms: apt.reason || "",
        canCancel: apt.status === "upcoming",
        feedbackGiven: apt.feedback_given || false,
        cancellation_reason: apt.cancellation_reason || "",
        cancelled_by: apt.cancelled_by || "",
        appointment_started: apt.appointment_started || false,
        reschedule_reason: apt.reschedule_reason || "",
        rescheduled_by: apt.rescheduled_by || "",
      }));

      // Debug log to verify transformation
      const rescheduledApts = transformedAppointments.filter(
        (a: any) => a.rescheduled_by
      );
      if (rescheduledApts.length > 0) {
        console.log(
          "[PatientLayout] Found rescheduled appointments:",
          rescheduledApts.map((a: any) => ({
            id: a.id,
            rescheduled_by: a.rescheduled_by,
            reschedule_reason: a.reschedule_reason,
          }))
        );
      }

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error("[PatientLayout] Failed to refresh appointments:", error);
    }
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Fetch appointments and profile when patient layout loads
  useEffect(() => {
    const fetchData = async () => {
      if (!patient?.id) {
        console.log("[PatientLayout] No patient ID available");
        setLoading(false);
        return;
      }

      try {
        console.log("[PatientLayout] Fetching data for patient", patient.id);

        // Set profile data from authenticated patient
        const fullName = `${patient.first_name} ${
          patient.middle_name ? patient.middle_name + " " : ""
        }${patient.last_name}`.trim();
        setProfileName(fullName);
        setProfileAvatar(patient.avatar || "");

        // Fetch appointments
        console.log("[PatientLayout] About to call patientAPI.getAppointments");
        const data = await patientAPI.getAppointments(patient.id);
        console.log("[PatientLayout] API call completed, data:", data);
        console.log(
          "[PatientLayout] Received appointments:",
          data.length,
          "appointments"
        );

        // Debug: Check if API returns rescheduled_by
        const withRescheduled = data.filter(
          (a: any) => a.rescheduled_by && a.rescheduled_by !== ""
        );
        console.log(
          "[PatientLayout] Appointments with rescheduled_by from API:",
          withRescheduled.length
        );
        if (withRescheduled.length > 0) {
          console.log(
            "[PatientLayout] Sample:",
            withRescheduled[0].id,
            "rescheduled_by:",
            withRescheduled[0].rescheduled_by
          );
        }

        // Transform backend data to match frontend format
        const transformedAppointments = data.map((apt: any) => ({
          id: apt.id,
          doctor: {
            id: apt.doctor_info?.id || "unknown",
            name: apt.doctor_info?.name || "Unknown Doctor",
            specialty: apt.doctor_info?.specialty || "Unknown",
            avatar: apt.doctor_info?.avatar || undefined,
            rating: 4.5,
          },
          date: apt.appointment_date,
          time: apt.appointment_time,
          status: apt.status,
          type: apt.appointment_type,
          mode: apt.appointment_mode,
          location:
            apt.appointment_mode === "in-person" && apt.location_info?.name
              ? apt.location_info.name
              : apt.appointment_mode === "online"
              ? "Online Consultation"
              : "",
          isFollowUp: apt.appointment_type === "Follow-up",
          symptoms: apt.reason || "",
          canCancel: apt.status === "upcoming",
          feedbackGiven: apt.feedback_given || false,
          cancellation_reason: apt.cancellation_reason || "",
          cancelled_by: apt.cancelled_by || "",
          appointment_started: apt.appointment_started || false,
          reschedule_reason: apt.reschedule_reason || "",
          rescheduled_by: apt.rescheduled_by || "",
        }));

        console.log(
          "[PatientLayout] Setting",
          transformedAppointments.length,
          "appointments"
        );
        setAppointments(transformedAppointments);
        setLoading(false);

        // Reset all modal states on initial load to prevent stuck overlays
        setShowAnswerConfirm(false);
        setShowDeclineConfirm(false);
        setShowEndCallConfirm(false);
        setShowDocumentRequest(false);
        setShowPermissionRequest(false);
        setShowCallEndedMessage(false);
        setShowDocumentsShared(false);
        setShowPermissionDeclined(false);
        setShowCompletionRequest(false);
        setShowConsultationFinished(false);
        setShowPrescriptionNotification(false);
      } catch (error) {
        console.error("[PatientLayout] Failed to fetch appointments:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [patient?.id]);

  // Fetch patient documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!patient?.id) return;
      try {
        const response = await fetch(
          `http://localhost:8000/api/patients/${patient.id}/documents/`
        );
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      }
    };
    fetchDocuments();
  }, [patient?.id]);

  // Poll for incoming calls and document requests
  useEffect(() => {
    if (!patient?.id) return;

    const checkForIncomingCalls = async () => {
      try {
        console.log("🔄 [PatientLayout] Polling for incoming calls...");
        const data = await patientAPI.getAppointments(patient.id);

        console.log(
          "📋 [PatientLayout] Total appointments fetched:",
          data.length
        );
        console.log(
          "📋 [PatientLayout] Handled call IDs:",
          Array.from(handledCallIdsRef.current)
        );
        console.log(
          "📋 [PatientLayout] Current incomingCall:",
          incomingCall?.id || "none"
        );
        console.log("📋 [PatientLayout] showVideoCall:", showVideoCall);

        const startedAppointment = data.find((apt: any) => {
          const checks = {
            id: apt.id,
            appointment_started: apt.appointment_started,
            call_status: apt.call_status,
            patient_joined: apt.patient_joined,
            status: apt.status,
            appointment_mode: apt.appointment_mode,
            isStarted: apt.appointment_started === true,
            notDeclined: apt.call_status !== "declined",
            notAnswered: apt.call_status !== "answered",
            patientNotJoined: !apt.patient_joined,
            isUpcoming: apt.status === "upcoming",
            isOnline: apt.appointment_mode === "online",
            notInVideoCall: !showVideoCall,
            notHandled: !handledCallIdsRef.current.has(apt.id),
            willMatch:
              apt.appointment_started === true &&
              apt.call_status !== "declined" &&
              apt.call_status !== "answered" &&
              !apt.patient_joined &&
              apt.status === "upcoming" &&
              apt.appointment_mode === "online" &&
              !showVideoCall &&
              !handledCallIdsRef.current.has(apt.id),
          };

          if (apt.appointment_started === true || apt.status === "upcoming") {
            console.log("🔍 [PatientLayout] Checking appointment:", checks);
          }

          return checks.willMatch;
        });

        console.log(
          "🔍 [PatientLayout] Found started appointment:",
          startedAppointment ? startedAppointment.id : "none"
        );

        // Clear incoming call if appointment is no longer in started/unanswered state
        if (incomingCall && !startedAppointment) {
          console.log("🧹 [PatientLayout] Clearing stale incoming call");
          setIncomingCall(null);
        }

        // Show incoming call popup if doctor started a call and we haven't handled it yet
        if (
          startedAppointment &&
          !incomingCall &&
          !showVideoCall &&
          !handledCallIdsRef.current.has(startedAppointment.id)
        ) {
          console.log("📞 [PatientLayout] SHOWING INCOMING CALL POPUP");
          setIncomingCall({
            id: startedAppointment.id,
            doctorName: startedAppointment.doctor_info?.name || "Doctor",
            doctorSpecialty:
              startedAppointment.doctor_info?.specialty || "Unknown",
            doctorAvatar: startedAppointment.doctor_info?.avatar || null,
            appointmentType: startedAppointment.appointment_type,
            appointmentMode: startedAppointment.appointment_mode,
            fullAppointment: startedAppointment,
          });
        } else if (
          startedAppointment &&
          handledCallIdsRef.current.has(startedAppointment.id)
        ) {
          console.log(
            "⏭️ [PatientLayout] Call already handled, skipping popup"
          );
        } else if (startedAppointment && incomingCall) {
          console.log("⏭️ [PatientLayout] Already showing incoming call");
        }

        // Only handle document requests and completion requests during active call
        if (
          showVideoCall &&
          activeCall &&
          startedAppointment &&
          activeCall.id === startedAppointment.id
        ) {
          console.log("[PatientLayout] Checking document request:", {
            document_request_status: startedAppointment.document_request_status,
            showPermissionRequest,
            showDocumentRequest,
            activeCallId: activeCall.id,
            startedAppointmentId: startedAppointment.id,
          });

          if (
            startedAppointment.document_request_status === "requested" &&
            !showPermissionRequest &&
            !showDocumentRequest
          ) {
            console.log(
              "[PatientLayout] Setting showPermissionRequest to true"
            );
            setShowPermissionRequest(true);
          }

          // Check for completion request during active call
          if (
            startedAppointment.completion_request_status === "requested" &&
            !showCompletionRequest &&
            !showConsultationFinished
          ) {
            setShowCompletionRequest(true);
          }

          // Check for prescription upload - only show notification once when it becomes true
          if (
            startedAppointment.prescription_uploaded &&
            !prescriptionUploaded
          ) {
            setPrescriptionUploaded(true);
            setShowPrescriptionNotification(true);
          }
        }

        // Check if doctor ended the call - close patient's call automatically
        if (showVideoCall && activeCall) {
          const activeAppointment = data.find(
            (apt: any) => apt.id === activeCall.id
          );
          if (
            activeAppointment &&
            (activeAppointment.call_status === "ended" ||
              !activeAppointment.appointment_started)
          ) {
            console.log(
              "🔚 [PatientLayout] Doctor ended the call, closing patient call"
            );
            setShowVideoCall(false);
            setActiveCall(null);
            setShowCallEndedMessage(true);
            setSelectedDocuments([]);
          }
        }
      } catch (error) {
        console.error("Failed to check for incoming calls:", error);
      }
    };

    checkForIncomingCalls();
    const interval = setInterval(checkForIncomingCalls, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [
    patient,
    incomingCall,
    showVideoCall,
    activeCall,
    showDocumentRequest,
    showPermissionRequest,
    showCompletionRequest,
    showConsultationFinished,
    prescriptionUploaded,
    showPrescriptionNotification,
  ]);

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    const callId = incomingCall.id;

    // Immediately clear the popup and mark as handled
    setIncomingCall(null);
    setShowAnswerConfirm(false);
    handledCallIdsRef.current.add(callId);
    console.log("✅ [PatientLayout] Call accepted, marked as handled:", callId);

    // Mark patient as joined
    try {
      await fetch(`http://localhost:8000/api/appointments/${callId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_joined: true,
          call_status: "answered",
        }),
      });
    } catch (error) {
      console.error("Failed to mark patient as joined:", error);
    }

    // Reset prescription state for new call
    setPrescriptionUploaded(false);
    setShowPrescriptionNotification(false);
    setActiveCall(null);

    // Redirect to appointments page with join_call parameter
    window.location.href = "/patient/appointments?join_call=" + callId;
  };

  const handleDeclineCall = async () => {
    const callToDecline = incomingCall || activeCall;
    if (!callToDecline) return;

    // Immediately clear the popup and mark as handled
    const callId = callToDecline.id;
    setIncomingCall(null);
    setShowDeclineConfirm(false);
    handledCallIdsRef.current.add(callId);
    console.log("❌ [PatientLayout] Call declined, marked as handled:", callId);

    // If declining from incoming call notification, mark as declined
    // If ending from active video call, mark as ended
    const isDecline = callToDecline === incomingCall;

    // If ending an active call, mark that patient ended it BEFORE making the API call
    if (activeCall && callToDecline === activeCall) {
      setCallEndedByPatient(true);
    }

    try {
      await fetch(`http://localhost:8000/api/appointments/${callId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_status: isDecline ? "declined" : "ended",
          appointment_started: false,
        }),
      });
    } catch (error) {
      console.error("Failed to decline call:", error);
    }

    // If ending an active call, show message that patient ended it
    if (activeCall && !incomingCall) {
      setShowVideoCall(false);
      // Show message immediately (no delay) so polling can't interfere
      setShowCallEndedMessage(true);
    } else {
      // If declining incoming call, clear immediately
      setIncomingCall(null);
      setActiveCall(null);
      setShowVideoCall(false);
      setSelectedDocuments([]);
    }
  };

  return (
    <LanguageProvider>
      <IncomingCallWrapper
        incomingCall={incomingCall}
        setShowDeclineConfirm={setShowDeclineConfirm}
        setShowAnswerConfirm={setShowAnswerConfirm}
      />
      <AnswerCallConfirm
        showAnswerConfirm={showAnswerConfirm}
        incomingCall={incomingCall}
        setShowAnswerConfirm={setShowAnswerConfirm}
        handleAcceptCall={handleAcceptCall}
      />
      <DeclineCallConfirm
        showDeclineConfirm={showDeclineConfirm}
        incomingCall={incomingCall}
        setShowDeclineConfirm={setShowDeclineConfirm}
        handleDeclineCall={handleDeclineCall}
      />
      <DocumentSharingRequest
        showPermissionRequest={showPermissionRequest}
        activeCall={activeCall}
        setShowPermissionRequest={setShowPermissionRequest}
        setShowDocumentRequest={setShowDocumentRequest}
      />
      <DocumentSelectionModal
        showDocumentRequest={showDocumentRequest}
        activeCall={activeCall}
        documents={documents}
        selectedDocuments={selectedDocuments}
        setSelectedDocuments={setSelectedDocuments}
        setShowDocumentRequest={setShowDocumentRequest}
        setShowDocumentsShared={setShowDocumentsShared}
        setShowPermissionDeclined={setShowPermissionDeclined}
      />
      <div className="h-screen flex overflow-hidden bg-gray-50">
        {/* Desktop Sidebar */}
        <Sidebar />
        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            toggleMobileSidebar={toggleMobileSidebar}
            name={profileName}
            avatar={profileAvatar}
            notificationRefreshTrigger={notificationRefreshTrigger}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading appointments...</div>
              </div>
            ) : (
              <Outlet
                context={{
                  profileName,
                  setProfileName,
                  profileAvatar,
                  setProfileAvatar,
                  appointments,
                  setAppointments,
                  refreshNotifications,
                  refreshAppointments,
                }}
              />
            )}
          </main>
        </div>

        {/* Video Call Modal - DISABLED: Now using VideoCallInterface in Appointments page */}
        {false && showVideoCall && activeCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
            <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] m-4 flex flex-col">
              {/* Header */}
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-between rounded-t-lg border-b border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 flex-shrink-0">
                    {activeCall.doctorAvatar ? (
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={activeCall.doctorAvatar}
                        alt=""
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium text-lg">
                        {activeCall.doctorName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {activeCall.doctorName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {activeCall.doctorSpecialty}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEndCallConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  End Call
                </button>
              </div>

              {/* Video Area */}
              <div className="flex-1 bg-gray-800 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="h-32 w-32 mx-auto mb-4">
                    {activeCall.doctorAvatar ? (
                      <img
                        className="h-32 w-32 rounded-full object-cover"
                        src={activeCall.doctorAvatar}
                        alt=""
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium text-5xl">
                        {activeCall.doctorName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xl font-medium">
                    {activeCall.doctorName}
                  </p>
                  <p className="text-gray-400 mt-2">Video Consultation</p>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-center space-x-4 rounded-b-lg border-t border-gray-700">
                <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>
                <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Call Ended by Doctor Message */}
        <CallEndedMessage
          showCallEndedMessage={showCallEndedMessage}
          activeCall={activeCall}
          callEndedByPatient={callEndedByPatient}
          setShowCallEndedMessage={setShowCallEndedMessage}
          setActiveCall={setActiveCall}
          setIncomingCall={setIncomingCall}
          setSelectedDocuments={setSelectedDocuments}
          setCallEndedByPatient={setCallEndedByPatient}
        />

        {/* End Call Confirmation - Only show if there's an active call */}
        <EndCallConfirmModal
          showEndCallConfirm={showEndCallConfirm}
          activeCall={activeCall}
          prescriptionUploaded={prescriptionUploaded}
          setShowEndCallConfirm={setShowEndCallConfirm}
          handleDeclineCall={handleDeclineCall}
        />

        {/* Documents Shared Message */}
        {showDocumentsShared && (
          <DocumentsSharedMessage
            showDocumentsShared={showDocumentsShared}
            selectedDocuments={selectedDocuments}
            setShowDocumentsShared={setShowDocumentsShared}
          />
        )}

        {/* Permission Declined Message */}
        {showPermissionDeclined && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Permission Declined
              </h3>
              <p className="text-gray-600 mb-6">
                You have declined to share your documents with the doctor.
              </p>
              <button
                onClick={() => setShowPermissionDeclined(false)}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Completion Request Modal */}
        <CompletionRequestModal
          showCompletionRequest={showCompletionRequest}
          activeCall={activeCall}
          prescriptionUploaded={prescriptionUploaded}
          setShowCompletionRequest={setShowCompletionRequest}
          setShowVideoCall={setShowVideoCall}
          setShowConsultationFinished={setShowConsultationFinished}
        />

        {/* Old completion request - to be removed */}
        {false && showCompletionRequest && activeCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Complete Consultation
              </h3>
              <p className="text-gray-600 mb-6">
                {!prescriptionUploaded ? (
                  <>
                    <span className="block mb-2">
                      ⚠️ The doctor hasn't uploaded a prescription yet.
                    </span>
                    {activeCall.doctorName} has requested to complete the
                    consultation. Do you agree to complete the consultation?
                  </>
                ) : (
                  `${activeCall.doctorName} has requested to complete the consultation. Do you agree to complete the consultation?`
                )}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={async () => {
                    try {
                      await fetch(
                        `http://localhost:8000/api/appointments/${activeCall.id}/`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            completion_request_status: "rejected",
                          }),
                        }
                      );
                      setShowCompletionRequest(false);
                    } catch (error) {
                      console.error(
                        "Failed to reject completion request:",
                        error
                      );
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  No
                </button>
                <button
                  onClick={async () => {
                    try {
                      await fetch(
                        `http://localhost:8000/api/appointments/${activeCall.id}/`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            completion_request_status: "accepted",
                            status: "completed",
                            appointment_started: false,
                            call_status: null,
                            patient_joined: false,
                          }),
                        }
                      );
                      setShowCompletionRequest(false);
                      setShowVideoCall(false);
                      setShowConsultationFinished(true);
                    } catch (error) {
                      console.error(
                        "Failed to accept completion request:",
                        error
                      );
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Consultation Finished Message */}
        <ConsultationFinishedMessage
          showConsultationFinished={showConsultationFinished}
          setShowConsultationFinished={setShowConsultationFinished}
          setActiveCall={setActiveCall}
          setSelectedDocuments={setSelectedDocuments}
        />

        {/* Prescription Uploaded Notification */}
        <PrescriptionUploadedNotification
          showPrescriptionNotification={showPrescriptionNotification}
          setShowPrescriptionNotification={setShowPrescriptionNotification}
        />
      </div>
    </LanguageProvider>
  );
};

const CallEndedMessage = ({
  showCallEndedMessage,
  activeCall,
  callEndedByPatient,
  setShowCallEndedMessage,
  setActiveCall,
  setIncomingCall,
  setSelectedDocuments,
  setCallEndedByPatient,
}: any) => {
  const { t } = useLanguage();

  if (!showCallEndedMessage || !activeCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {callEndedByPatient
            ? t("call.callEndedByYouTitle")
            : t("call.callEndedTitle")}
        </h3>
        <p className="text-gray-600 mb-6">
          {callEndedByPatient ? (
            t("call.callEndedByYouMessage")
          ) : (
            <>
              {activeCall.doctorName} {t("call.callEndedMessage")}
            </>
          )}
        </p>
        <button
          onClick={() => {
            setShowCallEndedMessage(false);
            setActiveCall(null);
            setIncomingCall(null);
            setSelectedDocuments([]);
            setCallEndedByPatient(false);
          }}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
        >
          {t("call.ok")}
        </button>
      </div>
    </div>
  );
};

const EndCallConfirmModal = ({
  showEndCallConfirm,
  activeCall,
  prescriptionUploaded,
  setShowEndCallConfirm,
  handleDeclineCall,
}: any) => {
  const { t } = useLanguage();

  if (!showEndCallConfirm || !activeCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("call.endCallTitle")}
        </h3>
        <p className="text-gray-600 mb-6">
          {!prescriptionUploaded && (
            <span className="block mb-2">
              {t("call.noPrescriptionWarningEnd")}
            </span>
          )}
          {t("call.endCallConfirmation")} {activeCall.doctorName}?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowEndCallConfirm(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            {t("call.cancel")}
          </button>
          <button
            onClick={() => {
              setShowEndCallConfirm(false);
              handleDeclineCall();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("call.endCall")}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConsultationFinishedMessage = ({
  showConsultationFinished,
  setShowConsultationFinished,
  setActiveCall,
  setSelectedDocuments,
}: any) => {
  const { t } = useLanguage();

  if (!showConsultationFinished) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("call.consultationFinishedTitle")}
        </h3>
        <p className="text-gray-600 mb-6">
          {t("call.consultationFinishedMessage")}
        </p>
        <button
          onClick={() => {
            setShowConsultationFinished(false);
            setActiveCall(null);
            setSelectedDocuments([]);
          }}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
        >
          {t("call.ok")}
        </button>
      </div>
    </div>
  );
};

const CompletionRequestModal = ({
  showCompletionRequest,
  activeCall,
  prescriptionUploaded,
  setShowCompletionRequest,
  setShowVideoCall,
  setShowConsultationFinished,
}: any) => {
  const { t } = useLanguage();

  if (!showCompletionRequest || !activeCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {t("call.completeConsultationTitle")}
        </h3>
        <p className="text-gray-600 mb-6">
          {!prescriptionUploaded && (
            <span className="block mb-2">
              {t("call.noPrescriptionWarning")}
            </span>
          )}
          {activeCall.doctorName} {t("call.completionRequestMessage")}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={async () => {
              try {
                await fetch(
                  `http://localhost:8000/api/appointments/${activeCall.id}/`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      completion_request_status: "rejected",
                    }),
                  }
                );
                setShowCompletionRequest(false);
              } catch (error) {
                console.error("Failed to reject completion request:", error);
              }
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            {t("call.no")}
          </button>
          <button
            onClick={async () => {
              try {
                await fetch(
                  `http://localhost:8000/api/appointments/${activeCall.id}/`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      completion_request_status: "accepted",
                      status: "completed",
                      appointment_started: false,
                      call_status: null,
                      patient_joined: false,
                    }),
                  }
                );
                setShowCompletionRequest(false);
                setShowVideoCall(false);
                setShowConsultationFinished(true);
              } catch (error) {
                console.error("Failed to accept completion request:", error);
              }
            }}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("call.yes")}
          </button>
        </div>
      </div>
    </div>
  );
};

const PrescriptionUploadedNotification = ({
  showPrescriptionNotification,
  setShowPrescriptionNotification,
}: any) => {
  const { t } = useLanguage();

  if (!showPrescriptionNotification) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("call.prescriptionUploadedTitle")}
        </h3>
        <p className="text-gray-600 mb-6">
          {t("call.prescriptionUploadedMessage")}
        </p>
        <button
          onClick={() => setShowPrescriptionNotification(false)}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
        >
          {t("call.ok")}
        </button>
      </div>
    </div>
  );
};

const IncomingCallWrapper = ({
  incomingCall,
  setShowDeclineConfirm,
  setShowAnswerConfirm,
}: any) => {
  const { t } = useLanguage();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-pulse-slow">
        <div className="text-center">
          {/* Doctor Avatar */}
          <div className="mb-6">
            {incomingCall.doctorAvatar ? (
              <img
                className="h-24 w-24 rounded-full object-cover mx-auto ring-4 ring-green-500"
                src={incomingCall.doctorAvatar}
                alt=""
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-green-500 flex items-center justify-center text-white font-medium text-4xl mx-auto ring-4 ring-green-300">
                {incomingCall.doctorName.charAt(0)}
              </div>
            )}
          </div>

          {/* Call Message */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {incomingCall.doctorName}
          </h3>
          <p className="text-gray-600 mb-1">{incomingCall.doctorSpecialty}</p>
          <p className="text-lg text-gray-800 font-medium mb-8">
            {t("call.callingForVideo")}
          </p>

          {/* Call Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Phone className="h-12 w-12 text-green-600 animate-bounce" />
              <div className="absolute inset-0 h-12 w-12 bg-green-400 rounded-full opacity-25 animate-ping"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowDeclineConfirm(true)}
              className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-all transform hover:scale-105"
            >
              <PhoneOff className="h-5 w-5" />
              {t("call.decline")}
            </button>
            <button
              onClick={() => setShowAnswerConfirm(true)}
              className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-all transform hover:scale-105"
            >
              <Phone className="h-5 w-5" />
              {t("call.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnswerCallConfirm = ({
  showAnswerConfirm,
  incomingCall,
  setShowAnswerConfirm,
  handleAcceptCall,
}: any) => {
  const { t } = useLanguage();

  if (!showAnswerConfirm || !incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("call.answerCallTitle")}
        </h3>
        <p className="text-gray-600 mb-6">
          {t("call.answerCallConfirm")} {incomingCall.doctorName}?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowAnswerConfirm(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            {t("call.cancel")}
          </button>
          <button
            onClick={() => {
              setShowAnswerConfirm(false);
              handleAcceptCall();
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("call.answer")}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeclineCallConfirm = ({
  showDeclineConfirm,
  incomingCall,
  setShowDeclineConfirm,
  handleDeclineCall,
}: any) => {
  const { t } = useLanguage();

  if (!showDeclineConfirm || !incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("call.declineCallTitle")}
        </h3>
        <p className="text-gray-600 mb-6">
          {t("call.declineCallConfirm")} {incomingCall.doctorName}?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDeclineConfirm(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            {t("call.cancel")}
          </button>
          <button
            onClick={() => {
              setShowDeclineConfirm(false);
              handleDeclineCall();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("call.decline")}
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentSharingRequest = ({
  showPermissionRequest,
  activeCall,
  setShowPermissionRequest,
  setShowDocumentRequest,
}: any) => {
  const { t } = useLanguage();

  console.log("[DocumentSharingRequest] Component render:", {
    showPermissionRequest,
    activeCall: activeCall?.id,
  });

  if (!showPermissionRequest || !activeCall) {
    console.log(
      "[DocumentSharingRequest] Not showing modal - conditions not met"
    );
    return null;
  }

  console.log("[DocumentSharingRequest] Rendering modal!");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {t("call.documentSharingRequest")}
        </h3>
        <p className="text-gray-600 mb-6">
          {activeCall.doctorName} {t("call.documentSharingMessage")}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={async () => {
              try {
                await fetch(
                  `http://localhost:8000/api/appointments/${activeCall.id}/`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      document_request_status: "permission_denied",
                    }),
                  }
                );
              } catch (error) {
                console.error("Failed to decline permission:", error);
              }
              setShowPermissionRequest(false);
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            {t("call.no")}
          </button>
          <button
            onClick={() => {
              setShowPermissionRequest(false);
              setShowDocumentRequest(true);
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("call.yes")}
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentSelectionModal = ({
  showDocumentRequest,
  activeCall,
  documents,
  selectedDocuments,
  setSelectedDocuments,
  setShowDocumentRequest,
  setShowDocumentsShared,
  setShowPermissionDeclined,
}: any) => {
  const { t } = useLanguage();

  if (!showDocumentRequest || !activeCall) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {t("call.documentRequestTitle")}
        </h3>
        <p className="text-gray-600 mb-4">
          {activeCall.doctorName} {t("call.documentRequestMessage")}
        </p>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
          {documents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {t("call.noDocuments")}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedDocuments((prev: string[]) =>
                      prev.includes(doc.id)
                        ? prev.filter((id: string) => id !== doc.id)
                        : [...prev, doc.id]
                    );
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-cyan-600 rounded"
                    />
                    <svg
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {doc.document_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {doc.category} • {(doc.file_size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={async () => {
              try {
                await fetch(
                  `http://localhost:8000/api/appointments/${activeCall.id}/`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      document_request_status: "permission_denied",
                    }),
                  }
                );
                setShowDocumentRequest(false);
                setShowPermissionDeclined(true);
              } catch (error) {
                console.error("Failed to decline document request:", error);
              }
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            {t("call.decline")}
          </button>
          <button
            onClick={async () => {
              try {
                await fetch(
                  `http://localhost:8000/api/appointments/${activeCall.id}/`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      document_request_status: "accepted",
                      shared_documents: JSON.stringify(selectedDocuments),
                    }),
                  }
                );
                setShowDocumentRequest(false);
                setShowDocumentsShared(true);
              } catch (error) {
                console.error("Failed to share documents:", error);
              }
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("call.shareSelected")} ({selectedDocuments.length})
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentsSharedMessage = ({
  showDocumentsShared,
  selectedDocuments,
  setShowDocumentsShared,
}: any) => {
  const { t } = useLanguage();

  if (!showDocumentsShared) return null;

  const documentWord =
    selectedDocuments.length === 1 ? t("call.document") : t("call.documents");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("call.documentsSharedTitle")}
        </h3>
        <p className="text-gray-600 mb-6">
          {t("call.documentsSharedMessage")} {selectedDocuments.length}{" "}
          {documentWord} {t("call.documentsSharedWith")}.
        </p>
        <button
          onClick={() => setShowDocumentsShared(false)}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
        >
          {t("call.ok")}
        </button>
      </div>
    </div>
  );
};

const Layout = () => {
  return <LayoutContent />;
};

export default Layout;
