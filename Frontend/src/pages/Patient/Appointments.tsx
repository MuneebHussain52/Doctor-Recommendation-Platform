import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Appointment } from "../../types/appointments";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  X,
  MessageSquare,
  MessageCircle,
  Video,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import VideoCallInterface from "../../components/VideoCallInterface";

// Helper to format 12-hour time string to 24-hour format
export function formatTime24(time: string): string {
  // Handles 'h:mm AM/PM' or 'hh:mm AM/PM'
  if (!time) return "";
  const [raw, modifier] = time.split(" ");
  let [hours, minutes] = raw.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

interface OutletContextType {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
}

// OLD DUMMY DATA - NO LONGER USED

const PatientAppointments = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { patient } = useAuth();
  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : "Patient";
  const { appointments: appointmentList, setAppointments: setAppointmentList } =
    useOutletContext<OutletContextType>();
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [showCancelConfirmId, setShowCancelConfirmId] = useState<string | null>(
    null
  );
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancellingAppointment, setCancellingAppointment] = useState(false);
  const [showCancellationReasonModal, setShowCancellationReasonModal] =
    useState(false);
  const [viewingCancellationReason, setViewingCancellationReason] =
    useState<string>("");
  const [showRescheduleReasonModal, setShowRescheduleReasonModal] =
    useState(false);
  const [viewingRescheduleReason, setViewingRescheduleReason] =
    useState<string>("");
  const [expandedSymptoms, setExpandedSymptoms] = useState<Set<string>>(
    new Set()
  );
  const [showRescheduleId, setShowRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleTime, setRescheduleTime] = useState<string>("");

  const [showDoctorProfile, setShowDoctorProfile] =
    useState<Appointment | null>(null);
  const [showScheduleInProfile, setShowScheduleInProfile] = useState(false);
  const [showFeedbackInProfile, setShowFeedbackInProfile] = useState(false);
  const [doctorSchedule, setDoctorSchedule] = useState<any[]>([]);
  const [doctorFeedbacks, setDoctorFeedbacks] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Pagination state - separate for each tab
  const [upcomingDisplayCount, setUpcomingDisplayCount] = useState(30);
  const [completedDisplayCount, setCompletedDisplayCount] = useState(30);
  const [cancelledDisplayCount, setCancelledDisplayCount] = useState(30);
  const [allDisplayCount, setAllDisplayCount] = useState(30);

  // Prescription modal state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Video call state
  const [showIncomingCallPopup, setShowIncomingCallPopup] = useState(false);
  const [incomingCallAppointment, setIncomingCallAppointment] =
    useState<Appointment | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCallAppointment, setActiveCallAppointment] =
    useState<Appointment | null>(null);

  // Use refs to track state for polling without causing re-renders
  const activeCallAppointmentRef = useRef<Appointment | null>(null);
  const showVideoCallRef = useRef<boolean>(false);

  // Keep refs in sync with state
  useEffect(() => {
    activeCallAppointmentRef.current = activeCallAppointment;
  }, [activeCallAppointment]);

  useEffect(() => {
    showVideoCallRef.current = showVideoCall;
  }, [showVideoCall]);

  // Document and consultation state
  const [showShareDocumentModal, setShowShareDocumentModal] = useState(false);
  const [showConsultationApprovalModal, setShowConsultationApprovalModal] =
    useState(false);
  const [showCompletionRequestModal, setShowCompletionRequestModal] =
    useState(false);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Clear any lingering incoming call popups when component mounts
  useEffect(() => {
    // This ensures the Layout's incoming call popup is cleared
    // by checking if we're on the appointments page
    const clearIncomingCall = async () => {
      // Use a small delay to ensure Layout has mounted
      setTimeout(() => {
        console.log("Clearing any lingering incoming call popups");
      }, 100);
    };
    clearIncomingCall();
  }, []);

  // Handle join call from URL parameter (when accepting from popup)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCallId = urlParams.get("join_call");

    if (joinCallId && appointmentList.length > 0) {
      const appointment = appointmentList.find((apt) => apt.id === joinCallId);
      if (appointment) {
        console.log("Auto-joining call from URL parameter:", joinCallId);
        setActiveCallAppointment(appointment);
        setShowVideoCall(true);
        // Clear URL parameter
        window.history.replaceState({}, "", "/patient/appointments");
      }
    }
  }, [appointmentList]);

  // Poll for incoming calls from doctor
  useEffect(() => {
    if (!patient?.id) {
      console.log("No patient ID, skipping poll");
      return;
    }

    const checkForIncomingCalls = async () => {
      try {
        console.log("🔄 Patient polling for incoming calls...");
        const response = await fetch(
          `http://localhost:8000/api/appointments/?patient_id=${patient.id}`
        );
        if (response.ok) {
          const rawData = await response.json();

          // Handle both array and paginated responses
          const data = Array.isArray(rawData) ? rawData : rawData.results || [];

          console.log(
            "📋 Checking",
            data.length,
            "appointments for incoming calls"
          );

          // Check if any appointment has been started by doctor
          const startedAppointment = data.find((apt: Appointment) => {
            const isUpcoming = apt.status === "upcoming";
            const isStarted = apt.appointment_started === true;
            const isOnline = apt.mode === "online";
            const notInCall = !showVideoCallRef.current;

            console.log(`Appointment ${apt.id}:`, {
              status: apt.status,
              appointment_started: apt.appointment_started,
              mode: apt.mode,
              patient_joined: apt.patient_joined,
              call_status: apt.call_status,
              isUpcoming,
              isStarted,
              isOnline,
              notInCall,
              willMatch: isUpcoming && isStarted && isOnline && notInCall,
            });

            return isUpcoming && isStarted && isOnline && notInCall;
          });

          if (startedAppointment) {
            console.log("🎉 FOUND STARTED APPOINTMENT:", startedAppointment.id);
            if (!incomingCallAppointment) {
              console.log("📞 SHOWING INCOMING CALL POPUP");
              setIncomingCallAppointment(startedAppointment);
              setShowIncomingCallPopup(true);
            } else {
              console.log("⏭️ Already have incoming call, skipping");
            }
          } else {
            console.log("❌ No started appointments found");
          }

          // Check if doctor has requested completion for active call
          if (showVideoCallRef.current && activeCallAppointmentRef.current) {
            try {
              const aptResponse = await fetch(
                `http://localhost:8000/api/appointments/${activeCallAppointmentRef.current.id}/`
              );

              if (aptResponse.ok) {
                const latestApt = await aptResponse.json();

                // Map doctor_info to doctor if needed (API inconsistency)
                if (latestApt.doctor_info && !latestApt.doctor) {
                  latestApt.doctor = {
                    id: latestApt.doctor_info.id,
                    name: latestApt.doctor_info.name,
                    specialty: latestApt.doctor_info.specialty,
                    avatar: latestApt.doctor_info.avatar,
                    rating: 0,
                  };
                }

                // Update appointment if status changed (completion or document request)
                if (
                  latestApt.completion_request_status !==
                    activeCallAppointmentRef.current
                      .completion_request_status ||
                  latestApt.document_request_status !==
                    activeCallAppointmentRef.current.document_request_status
                ) {
                  if (
                    latestApt.completion_request_status !==
                    activeCallAppointmentRef.current.completion_request_status
                  ) {
                    console.log(
                      "✅ Completion status changed:",
                      latestApt.completion_request_status
                    );
                  }
                  if (
                    latestApt.document_request_status !==
                    activeCallAppointmentRef.current.document_request_status
                  ) {
                    console.log(
                      "✅ Document request status changed:",
                      latestApt.document_request_status
                    );
                  }
                  setActiveCallAppointment(latestApt);
                }
              }
            } catch (error) {
              console.error("Error fetching appointment:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error in polling cycle:", error);
      }
    };

    // Check immediately
    checkForIncomingCalls();

    // Then poll every 3 seconds
    const interval = setInterval(checkForIncomingCalls, 3000);

    return () => clearInterval(interval);
  }, [patient?.id, incomingCallAppointment]);

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingAppointment(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/appointments/${appointmentId}/cancel/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancellation_reason: cancelReason.trim() || undefined,
            cancelled_by: "patient",
          }),
        }
      );

      if (response.ok) {
        const updatedAppointment = await response.json();
        // Update local state
        setAppointmentList((prev: Appointment[]) =>
          prev.map((a: Appointment) =>
            a.id === appointmentId
              ? {
                  ...a,
                  status: "cancelled",
                  canCancel: false,
                  cancelled_by: "patient",
                  cancellation_reason: cancelReason.trim() || "",
                }
              : a
          )
        );
        setShowCancelConfirmId(null);
        setCancelReason("");
      } else {
        const error = await response.json();
        alert(
          `Failed to cancel appointment: ${error.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      alert("Failed to cancel appointment. Please try again.");
    } finally {
      setCancellingAppointment(false);
    }
  };

  const fetchDoctorSchedule = async (doctorId: string) => {
    setLoadingSchedule(true);
    try {
      console.log("Fetching schedule for doctor:", doctorId);
      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctorId}/appointment_slots/`
      );
      console.log("Schedule response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Schedule data received:", data);
        setDoctorSchedule(data);
      } else {
        console.error("Failed to fetch schedule, status:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const fetchDoctorFeedback = async (doctorId: string) => {
    setLoadingFeedback(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctorId}/feedback/`
      );
      if (response.ok) {
        const data = await response.json();
        setDoctorFeedbacks(data);
      }
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleViewPrescriptions = async (appointment: Appointment) => {
    setLoadingPrescriptions(true);
    setPrescriptionModalOpen(true);
    setPrescriptions([]);

    try {
      console.log(
        "[Patient] Fetching prescriptions for appointment:",
        appointment.id
      );

      // First get the full appointment details to ensure we have the patient ID
      const appointmentResponse = await fetch(
        `http://localhost:8000/api/appointments/${appointment.id}/`
      );
      const appointmentData = await appointmentResponse.json();
      const patientId = appointmentData.patient;

      console.log("[Patient] Patient ID:", patientId);

      // Fetch all documents for this patient
      const response = await fetch(
        `http://localhost:8000/api/patients/${patientId}/documents/`
      );
      if (response.ok) {
        const documents = await response.json();
        console.log("[Patient] All documents received:", documents);

        // Filter for prescriptions from this specific appointment
        const appointmentPrescriptions = documents.filter(
          (doc: any) =>
            doc.category === "Prescription" &&
            (doc.appointment === appointment.id ||
              String(doc.appointment) === String(appointment.id))
        );

        console.log(
          "[Patient] Filtered prescriptions for this appointment:",
          appointmentPrescriptions
        );
        setPrescriptions(appointmentPrescriptions);
      } else {
        console.error(
          "[Patient] Failed to fetch documents, status:",
          response.status
        );
      }
    } catch (error) {
      console.error("[Patient] Failed to fetch prescriptions:", error);
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const tabs = [
    { id: "upcoming", label: t("appointments.upcoming") },
    { id: "completed", label: t("appointments.completed") },
    { id: "cancelled", label: t("appointments.cancelled") },
    { id: "all", label: t("appointments.all") },
  ];

  let filteredAppointments: Appointment[] = appointmentList.filter(
    (appointment: Appointment) => {
      if (activeTab === "all") return true;
      return appointment.status === activeTab;
    }
  );

  // Sort appointments by date (most recent first) for all tabs
  if (activeTab === "all") {
    filteredAppointments = filteredAppointments.sort(
      (a: Appointment, b: Appointment) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      }
    );
  } else if (activeTab === "upcoming") {
    filteredAppointments = filteredAppointments.sort(
      (a: Appointment, b: Appointment) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      }
    );
  } else {
    // completed and cancelled
    filteredAppointments = filteredAppointments.sort(
      (a: Appointment, b: Appointment) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      }
    );
  }

  // Apply pagination based on active tab
  const currentDisplayCount =
    activeTab === "upcoming"
      ? upcomingDisplayCount
      : activeTab === "completed"
      ? completedDisplayCount
      : activeTab === "cancelled"
      ? cancelledDisplayCount
      : allDisplayCount;

  const totalCount = filteredAppointments.length;
  const displayedAppointments = filteredAppointments.slice(
    0,
    currentDisplayCount
  );
  const hasMore = totalCount > currentDisplayCount;

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800";
  };

  const getSpecialtyTranslation = (specialty: string): string => {
    const translationKey = `specialty.${specialty}`;
    const translation = t(translationKey);
    return translation !== translationKey ? translation : specialty;
  };

  const getLocationText = (location: string): string => {
    if (location === "Online Consultation") {
      return t("appointments.onlineConsultation");
    } else if (
      location === "In-Person Consultation" ||
      location === "In-Person"
    ) {
      return t("appointments.inPersonConsultation");
    }
    return location;
  };

  const getStatusText = (status: string): string => {
    const statusKey = `appointments.status.${status}`;
    const translation = t(statusKey);
    return translation !== statusKey
      ? translation
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const translateDay = (day: string): string => {
    const dayKey = `days.${day.toLowerCase()}`;
    const translation = t(dayKey);
    return translation !== dayKey ? translation : day;
  };

  const translateMonth = (month: string): string => {
    const monthKey = `months.${month.toLowerCase()}`;
    const translation = t(monthKey);
    return translation !== monthKey ? translation : month;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();

    const translatedDay = translateDay(dayOfWeek);
    const translatedMonth = translateMonth(month);

    if (language === "ur") {
      return `${translatedDay}، ${translatedMonth} ${day}، ${year}`;
    } else {
      return `${translatedDay}, ${translatedMonth} ${day}, ${year}`;
    }
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.floor(rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
        />
      ));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("appointments.title")}
        </h1>
        <p className="text-gray-600">{t("appointments.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.id === "all"
                    ? appointmentList.length
                    : appointmentList.filter((apt) => apt.status === tab.id)
                        .length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {displayedAppointments.map((appointment: Appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 rtl:space-x-reverse flex-1 min-w-0">
                      <div className="h-16 w-16 flex-shrink-0">
                        {appointment.doctor.avatar ? (
                          <img
                            className="h-16 w-16 rounded-full object-cover"
                            src={appointment.doctor.avatar}
                            alt=""
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-lg">
                            {appointment.doctor.name.charAt(3)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {appointment.doctor.name}
                          </h3>
                          <div className="flex items-center">
                            {renderStars(appointment.doctor.rating)}
                            <span className="ml-1 text-sm text-gray-600">
                              {appointment.doctor.rating}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {getSpecialtyTranslation(
                            appointment.doctor.specialty
                          )}
                        </p>

                        {/* Blocked Doctor Warning */}
                        {appointment.doctor.is_blocked && (
                          <div className="mb-3 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-yellow-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-yellow-800 font-medium">
                                  {t("appointments.doctorUnavailable")}
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                  {t("appointments.doctorBlockedMessage")}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                            {formatDate(appointment.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                            {formatTime24(appointment.time)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                            {getLocationText(appointment.location)}
                          </div>
                          {appointment.mode && (
                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                  appointment.mode === "online"
                                    ? "bg-blue-500 text-white"
                                    : "bg-green-500 text-white"
                                }`}
                              >
                                {appointment.mode === "online"
                                  ? `🌐 ${t("booking.online")}`
                                  : `🏥 ${t("booking.inPerson")}`}
                              </span>
                            </div>
                          )}
                        </div>
                        {appointment.symptoms &&
                          appointment.symptoms.trim() !== "" && (
                            <div className="mt-3 w-full overflow-hidden">
                              <span className="text-sm font-medium text-gray-600">
                                {t("appointments.symptoms")}:
                              </span>
                              <div
                                className="text-sm text-gray-600 mt-1 w-full overflow-wrap-anywhere"
                                style={
                                  expandedSymptoms.has(appointment.id)
                                    ? {
                                        wordBreak: "break-word",
                                        whiteSpace: "normal",
                                      }
                                    : {
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        wordBreak: "break-word",
                                        whiteSpace: "normal",
                                      }
                                }
                              >
                                {appointment.symptoms}
                              </div>
                              {appointment.symptoms.length > 100 && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(
                                      expandedSymptoms
                                    );
                                    if (expandedSymptoms.has(appointment.id)) {
                                      newExpanded.delete(appointment.id);
                                    } else {
                                      newExpanded.add(appointment.id);
                                    }
                                    setExpandedSymptoms(newExpanded);
                                  }}
                                  className="text-cyan-600 hover:text-cyan-800 text-xs font-medium mt-1"
                                >
                                  {expandedSymptoms.has(appointment.id)
                                    ? t("appointments.showLess")
                                    : t("appointments.readMore")}
                                </button>
                              )}
                            </div>
                          )}
                        <div className="flex items-center flex-wrap gap-2 mt-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                          {appointment.isFollowUp && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {t("appointments.followUp")}
                            </span>
                          )}
                          {appointment.reschedule_reason && (
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  appointment.rescheduled_by === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : appointment.rescheduled_by === "doctor"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {appointment.rescheduled_by === "admin"
                                  ? t("appointments.rescheduledByAdmin")
                                  : appointment.rescheduled_by === "doctor"
                                  ? t("appointments.rescheduledByDoctor")
                                  : t("appointments.rescheduled")}
                              </span>
                              <button
                                className="text-xs text-blue-600 hover:text-blue-900 underline"
                                onClick={() => {
                                  setViewingRescheduleReason(
                                    appointment.reschedule_reason ||
                                      t("appointments.noReasonProvided")
                                  );
                                  setShowRescheduleReasonModal(true);
                                }}
                              >
                                {t("appointments.viewReason")}
                              </button>
                            </div>
                          )}
                          {appointment.status === "cancelled" &&
                            appointment.cancelled_by === "patient" && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  {t("appointments.cancelledByYou")}
                                </span>
                                {appointment.cancellation_reason && (
                                  <button
                                    className="text-xs text-orange-600 hover:text-orange-900 underline"
                                    onClick={() => {
                                      setViewingCancellationReason(
                                        appointment.cancellation_reason ||
                                          t("appointments.noReasonProvided")
                                      );
                                      setShowCancellationReasonModal(true);
                                    }}
                                  >
                                    {t("appointments.viewReason")}
                                  </button>
                                )}
                              </div>
                            )}
                          {appointment.status === "cancelled" &&
                            appointment.cancelled_by === "doctor" && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {t("appointments.cancelledByDoctor")}
                                </span>
                                {appointment.cancellation_reason && (
                                  <button
                                    className="text-xs text-red-600 hover:text-red-900 underline"
                                    onClick={() => {
                                      setViewingCancellationReason(
                                        appointment.cancellation_reason ||
                                          t("appointments.noReasonProvided")
                                      );
                                      setShowCancellationReasonModal(true);
                                    }}
                                  >
                                    {t("appointments.viewReason")}
                                  </button>
                                )}
                              </div>
                            )}
                          {appointment.status === "cancelled" &&
                            appointment.cancelled_by === "admin" && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {t("appointments.cancelledByAdmin")}
                                </span>
                                {appointment.cancellation_reason && (
                                  <button
                                    className="text-xs text-purple-600 hover:text-purple-900 underline"
                                    onClick={() => {
                                      setViewingCancellationReason(
                                        appointment.cancellation_reason ||
                                          t("appointments.noReasonProvided")
                                      );
                                      setShowCancellationReasonModal(true);
                                    }}
                                  >
                                    {t("appointments.viewReason")}
                                  </button>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 flex-shrink-0">
                      <button
                        className="text-cyan-600 hover:text-cyan-800 text-sm font-medium flex items-center whitespace-nowrap"
                        onClick={() => setShowDoctorProfile(appointment)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                        {t("appointments.viewDoctor")}
                      </button>

                      {/* Join Call button for online appointments */}
                      {appointment.status === "upcoming" &&
                        appointment.mode === "online" && (
                          <button
                            className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center whitespace-nowrap"
                            onClick={() => {
                              console.log(
                                "Patient joining call for appointment:",
                                appointment.id
                              );
                              setActiveCallAppointment(appointment);
                              setShowVideoCall(true);
                              console.log("Video call state set to true");
                            }}
                          >
                            <Video className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                            Join Call
                          </button>
                        )}

                      <button
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center whitespace-nowrap"
                        onClick={() =>
                          navigate("/patient/messages", {
                            state: {
                              doctorId: appointment.doctor.id,
                              doctorName: appointment.doctor.name,
                            },
                          })
                        }
                      >
                        <MessageSquare className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                        {t("appointments.message")}
                      </button>
                      {appointment.status === "upcoming" &&
                        appointment.canCancel && (
                          <>
                            <button
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                              onClick={() =>
                                setShowCancelConfirmId(appointment.id)
                              }
                            >
                              <X className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                              {t("appointments.cancel")}
                            </button>
                            {showCancelConfirmId === appointment.id && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full mx-4 relative">
                                  <h2 className="text-lg font-semibold mb-2">
                                    {t("appointments.cancelAppointmentTitle")}
                                  </h2>
                                  <p className="mb-4 text-gray-600 text-sm">
                                    {t("appointments.cancelConfirm")}
                                  </p>

                                  {/* Warning Box */}
                                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <svg
                                        className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800">
                                          {t("appointments.noRefundPolicy")}
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1">
                                          {t("appointments.noRefundMessage")}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {t("appointments.reasonForCancellation")}
                                    </label>
                                    <textarea
                                      value={cancelReason}
                                      onChange={(e) =>
                                        setCancelReason(e.target.value)
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                      rows={3}
                                      placeholder={t(
                                        "appointments.cancellationPlaceholder"
                                      )}
                                    />
                                  </div>

                                  <div className="flex justify-end gap-3">
                                    <button
                                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                                      onClick={() => {
                                        setShowCancelConfirmId(null);
                                        setCancelReason("");
                                      }}
                                      disabled={cancellingAppointment}
                                    >
                                      {t("appointments.noKeepIt")}
                                    </button>
                                    <button
                                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium disabled:bg-red-300"
                                      onClick={() =>
                                        handleCancelAppointment(appointment.id)
                                      }
                                      disabled={cancellingAppointment}
                                    >
                                      {cancellingAppointment
                                        ? t("appointments.cancelling")
                                        : t("appointments.yesCancel")}
                                    </button>
                                  </div>
                                  <button
                                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                    onClick={() => {
                                      setShowCancelConfirmId(null);
                                      setCancelReason("");
                                    }}
                                    disabled={cancellingAppointment}
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      {appointment.status === "completed" && (
                        <button
                          className="text-cyan-600 hover:text-cyan-800 text-sm font-medium"
                          onClick={() => handleViewPrescriptions(appointment)}
                        >
                          View Prescription
                        </button>
                      )}
                      {appointment.status === "completed" &&
                        !appointment.feedbackGiven && (
                          <button
                            className="text-cyan-600 hover:text-cyan-800 text-sm font-medium flex items-center"
                            onClick={() =>
                              navigate("/patient/feedback", {
                                state: { appointmentId: appointment.id },
                              })
                            }
                          >
                            <Star className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                            Give Feedback
                          </button>
                        )}
                      {appointment.status === "cancelled" && (
                        <>
                          {!appointment.feedbackGiven && (
                            <button
                              className="text-cyan-600 hover:text-cyan-800 text-sm font-medium flex items-center"
                              onClick={() =>
                                navigate("/patient/feedback", {
                                  state: { appointmentId: appointment.id },
                                })
                              }
                            >
                              <Star className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                              Give Feedback
                            </button>
                          )}
                          {/* Reschedule button removed - no longer available for cancelled appointments */}
                          {showRescheduleId === appointment.id && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                              <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center relative">
                                <h2 className="text-lg font-semibold mb-4">
                                  Reschedule Appointment
                                </h2>
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Date
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded"
                                    value={rescheduleDate}
                                    onChange={(e) =>
                                      setRescheduleDate(e.target.value)
                                    }
                                  />
                                </div>
                                <div className="mb-6">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Time
                                  </label>
                                  <input
                                    type="time"
                                    className="w-full px-3 py-2 border rounded"
                                    value={rescheduleTime}
                                    onChange={(e) =>
                                      setRescheduleTime(e.target.value)
                                    }
                                  />
                                </div>
                                <div className="flex justify-center gap-4">
                                  <button
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                                    onClick={() => setShowRescheduleId(null)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm font-medium"
                                    onClick={() => {
                                      setAppointmentList(
                                        (prev: Appointment[]) => {
                                          const original = prev.find(
                                            (a: Appointment) =>
                                              a.id === appointment.id
                                          );
                                          if (!original) return prev;
                                          const newAppointment: Appointment = {
                                            ...original,
                                            id: Math.random()
                                              .toString(36)
                                              .substr(2, 9),
                                            status: "upcoming",
                                            date: rescheduleDate,
                                            time: rescheduleTime,
                                            canCancel: true,
                                          };
                                          return [...prev, newAppointment];
                                        }
                                      );
                                      setShowRescheduleId(null);
                                      setRescheduleDate("");
                                      setRescheduleTime("");
                                    }}
                                    disabled={
                                      !rescheduleDate || !rescheduleTime
                                    }
                                  >
                                    Confirm
                                  </button>
                                </div>
                                <button
                                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                  onClick={() => setShowRescheduleId(null)}
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      if (activeTab === "upcoming") {
                        setUpcomingDisplayCount((prev) => prev + 20);
                      } else if (activeTab === "completed") {
                        setCompletedDisplayCount((prev) => prev + 20);
                      } else if (activeTab === "cancelled") {
                        setCancelledDisplayCount((prev) => prev + 20);
                      } else if (activeTab === "all") {
                        setAllDisplayCount((prev) => prev + 20);
                      }
                    }}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    {t("appointments.loadMore")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("appointments.noAppointmentsFound")}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === "all"
                  ? "You haven't booked any appointments yet"
                  : `No ${activeTab} appointments found`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Doctor Profile Modal */}
      {showDoctorProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {showDoctorProfile.doctor.name}
              </h2>
              <button
                onClick={() => setShowDoctorProfile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Doctor Header */}
              <div className="flex items-start space-x-4 rtl:space-x-reverse mb-6">
                <div className="h-24 w-24 flex-shrink-0">
                  {showDoctorProfile.doctor.avatar ? (
                    <img
                      className="h-24 w-24 rounded-full object-cover"
                      src={showDoctorProfile.doctor.avatar}
                      alt=""
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-medium text-3xl">
                      {showDoctorProfile.doctor.name.charAt(4)}
                      {showDoctorProfile.doctor.name
                        .split(" ")
                        .pop()
                        ?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {showDoctorProfile.doctor.name}
                  </h3>
                  <p className="text-lg text-cyan-600 font-medium">
                    {getSpecialtyTranslation(
                      showDoctorProfile.doctor.specialty
                    )}
                  </p>
                  <div className="flex items-center mt-2 space-x-4 rtl:space-x-reverse">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(showDoctorProfile.doctor.rating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-gray-600">
                        ({showDoctorProfile.doctor.rating.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t("appointments.appointmentDetails")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {t("appointments.date")}:
                    </span>
                    <span className="ml-2 font-medium">
                      {formatDate(showDoctorProfile.date)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {t("appointments.time")}:
                    </span>
                    <span className="ml-2 font-medium">
                      {formatTime24(showDoctorProfile.time)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {t("appointments.location")}:
                    </span>
                    <span className="ml-2 font-medium">
                      {getLocationText(showDoctorProfile.location)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        showDoctorProfile.status
                      )}`}
                    >
                      {getStatusText(showDoctorProfile.status)}
                    </span>
                  </div>
                </div>
                {showDoctorProfile.symptoms && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">
                        {t("appointments.reason")}:
                      </span>{" "}
                      {showDoctorProfile.symptoms}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={() => {
                    setShowScheduleInProfile(!showScheduleInProfile);
                    if (!showScheduleInProfile && doctorSchedule.length === 0) {
                      fetchDoctorSchedule(showDoctorProfile.doctor.id);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center justify-center"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {showScheduleInProfile
                    ? t("appointments.hideSchedule")
                    : t("appointments.viewSchedule")}
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackInProfile(!showFeedbackInProfile);
                    if (
                      !showFeedbackInProfile &&
                      doctorFeedbacks.length === 0
                    ) {
                      fetchDoctorFeedback(showDoctorProfile.doctor.id);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showFeedbackInProfile
                    ? t("appointments.hideFeedback")
                    : t("appointments.viewFeedback")}
                </button>
                {showDoctorProfile.status === "cancelled" && (
                  <button
                    onClick={() => {
                      navigate("/patient/recommendations");
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t("appointments.bookAppointment")}
                  </button>
                )}
              </div>

              {/* Schedule Section */}
              {showScheduleInProfile && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Weekly Schedule
                  </h4>
                  {loadingSchedule ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Loading schedule...</p>
                    </div>
                  ) : doctorSchedule.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Clock className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg">
                        No schedule available
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Doctor hasn't configured appointment time slots yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ]
                        .map((day) => {
                          const daySlots = doctorSchedule.filter(
                            (slot: any) =>
                              slot.day_of_week === day && slot.is_active
                          );
                          return { day, slots: daySlots };
                        })
                        .filter(({ slots }) => slots.length > 0)
                        .map(({ day, slots }) => (
                          <div
                            key={day}
                            className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200"
                          >
                            <div className="flex items-center mb-3">
                              <div className="w-1 h-6 bg-cyan-600 rounded-full mr-3"></div>
                              <h4 className="text-base font-bold text-gray-900">
                                {day}
                              </h4>
                            </div>
                            <div className="space-y-2 ml-4">
                              {slots.map((slot: any) => (
                                <div
                                  key={slot.id}
                                  className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                                      <span className="text-sm font-semibold text-gray-900">
                                        {slot.start_time.substring(0, 5)} -{" "}
                                        {slot.end_time.substring(0, 5)}
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                          slot.mode === "online"
                                            ? "bg-blue-500 text-white"
                                            : "bg-green-500 text-white"
                                        }`}
                                      >
                                        {slot.mode === "online"
                                          ? "🌐 Online"
                                          : "🏥 In-Person"}
                                      </span>
                                      {slot.mode === "in-person" &&
                                        slot.location_info && (
                                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                                            📍 {slot.location_info.name}
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Section */}
              {showFeedbackInProfile && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Patient Reviews
                  </h4>
                  {loadingFeedback ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        Loading feedback...
                      </p>
                    </div>
                  ) : doctorFeedbacks.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {doctorFeedbacks.map((feedback) => (
                        <div
                          key={feedback.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                                {feedback.patient_info?.name?.charAt(0) || "P"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {feedback.patient_info?.name || "Anonymous"}
                                </p>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < feedback.rating
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(
                                feedback.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {feedback.comment}
                          </p>
                          {feedback.doctor_reply && (
                            <div className="mt-3 pl-4 border-l-2 border-cyan-200 bg-cyan-50 p-3 rounded">
                              <p className="text-xs font-semibold text-cyan-900 mb-1">
                                Doctor's Reply:
                              </p>
                              <p className="text-sm text-cyan-800">
                                {feedback.doctor_reply}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {showCancellationReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCancellationReasonModal(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cancellation Reason
            </h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-gray-800 text-base whitespace-pre-line shadow-inner">
              <span className="block font-medium text-orange-700 mb-2">
                Reason:
              </span>
              <span className="block text-gray-900">
                {viewingCancellationReason || "No reason provided"}
              </span>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCancellationReasonModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Reason Modal */}
      {showRescheduleReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowRescheduleReasonModal(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Reschedule Reason
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-800 text-base whitespace-pre-line shadow-inner">
              <span className="block font-medium text-blue-700 mb-2">
                Doctor's Reason:
              </span>
              <span className="block text-gray-900">
                {viewingRescheduleReason || "No reason provided"}
              </span>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRescheduleReasonModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {prescriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setPrescriptionModalOpen(false);
                setPrescriptions([]);
              }}
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Prescriptions
            </h2>

            {loadingPrescriptions ? (
              <div className="text-center py-8 text-gray-600">
                Loading prescriptions...
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No prescriptions were uploaded during this consultation.
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((prescription, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {prescription.document_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Uploaded:{" "}
                          {new Date(
                            prescription.uploaded_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={
                          prescription.document_file || prescription.file_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors text-sm font-medium cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            prescription.document_file ||
                            prescription.file_url
                          ) {
                            window.open(
                              prescription.document_file ||
                                prescription.file_url,
                              "_blank"
                            );
                          }
                        }}
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setPrescriptionModalOpen(false);
                  setPrescriptions([]);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Popup - Only show when explicitly triggered */}
      {(() => {
        console.log("🔍 Popup render check:", {
          showIncomingCallPopup,
          hasIncomingAppointment: !!incomingCallAppointment,
          appointmentId: incomingCallAppointment?.id,
        });
        return null;
      })()}
      {showIncomingCallPopup && incomingCallAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          {console.log("🎉 RENDERING INCOMING CALL POPUP")}
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Incoming Video Call
              </h3>
              <p className="text-lg text-gray-700 mb-1">
                Dr. {incomingCallAppointment.doctor.name}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {incomingCallAppointment.type} - {incomingCallAppointment.mode}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    // Accept call and show video interface
                    try {
                      // Update appointment to mark patient as joined
                      await fetch(
                        `http://localhost:8000/api/appointments/${incomingCallAppointment.id}/`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            patient_joined: true,
                          }),
                        }
                      );
                    } catch (error) {
                      console.error("Failed to update patient_joined:", error);
                    }

                    setActiveCallAppointment(incomingCallAppointment);
                    setShowVideoCall(true);
                    setShowIncomingCallPopup(false);
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
                >
                  Accept
                </button>
                <button
                  onClick={async () => {
                    // Update appointment to mark as declined
                    try {
                      await fetch(
                        `http://localhost:8000/api/appointments/${incomingCallAppointment.id}/`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            call_status: "declined",
                            appointment_started: false,
                          }),
                        }
                      );
                    } catch (error) {
                      console.error("Failed to decline call:", error);
                    }

                    setShowIncomingCallPopup(false);
                    setIncomingCallAppointment(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Interface */}
      {showVideoCall && activeCallAppointment && (
        <>
          <VideoCallInterface
            appointmentId={activeCallAppointment.id}
            patientId={String(patient?.id)}
            patientName={`${patient?.first_name} ${patient?.last_name}`}
            doctorId={String(
              activeCallAppointment.doctor?.id ||
                activeCallAppointment.doctor_info?.id
            )}
            doctorName={
              activeCallAppointment.doctor?.name ||
              activeCallAppointment.doctor_info?.name ||
              "Doctor"
            }
            isDoctor={false}
            completionRequested={
              activeCallAppointment.completion_request_status === "requested"
            }
            onAcceptCompletion={async () => {
              console.log("🟢 Patient accepting completion request");
              try {
                // Update appointment status to accepted
                const response = await fetch(
                  `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      completion_request_status: "accepted",
                    }),
                  }
                );

                if (response.ok) {
                  console.log("✅ Patient accepted completion");
                  alert("Consultation completed successfully!");

                  // End the call after a brief delay
                  setTimeout(() => {
                    setShowVideoCall(false);
                    setActiveCallAppointment(null);
                    setShowIncomingCallPopup(false);
                    setIncomingCallAppointment(null);
                    // Reload to clear all states
                    window.location.href = "/patient/appointments";
                  }, 2000);
                } else {
                  console.error("❌ Failed to accept completion");
                  alert("Failed to complete consultation. Please try again.");
                }
              } catch (error) {
                console.error("Error accepting completion:", error);
                alert("An error occurred. Please try again.");
              }
            }}
            onRejectCompletion={async () => {
              console.log("🔴 Patient rejecting completion request");
              try {
                // Update appointment status to rejected
                const response = await fetch(
                  `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      completion_request_status: "rejected",
                    }),
                  }
                );

                if (response.ok) {
                  console.log(
                    "✅ Patient rejected completion - call continues"
                  );
                  // Update local state to hide the banner
                  setActiveCallAppointment({
                    ...activeCallAppointment,
                    completion_request_status: "rejected",
                  });
                } else {
                  console.error("❌ Failed to reject completion");
                  alert("Failed to process request. Please try again.");
                }
              } catch (error) {
                console.error("Error rejecting completion:", error);
                alert("An error occurred. Please try again.");
              }
            }}
            documentRequested={
              activeCallAppointment.document_request_status === "requested"
            }
            onAcceptDocumentRequest={() => {
              console.log("📄 Patient accepting document request");
              // Open the share document modal
              setShowShareDocumentModal(true);
              // Update status to accepted
              fetch(
                `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    document_request_status: "accepted",
                  }),
                }
              ).then(() => {
                setActiveCallAppointment({
                  ...activeCallAppointment,
                  document_request_status: "accepted",
                });
              });
            }}
            onRejectDocumentRequest={async () => {
              console.log("❌ Patient rejecting document request");
              try {
                const response = await fetch(
                  `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      document_request_status: "rejected",
                    }),
                  }
                );

                if (response.ok) {
                  console.log("✅ Document request rejected");
                  setActiveCallAppointment({
                    ...activeCallAppointment,
                    document_request_status: "rejected",
                  });
                }
              } catch (error) {
                console.error("Error rejecting document request:", error);
              }
            }}
            onCallEnd={async () => {
              console.log("Patient ending call, cleaning up...");
              setShowVideoCall(false);
              setActiveCallAppointment(null);
              setShowIncomingCallPopup(false);
              setIncomingCallAppointment(null);
              // Give a moment for cleanup
              await new Promise((resolve) => setTimeout(resolve, 500));
              // Reload to clear all states including Layout's incoming call
              window.location.href = "/patient/appointments";
            }}
            onShareDocument={() => {
              setShowShareDocumentModal(true);
            }}
          />
        </>
      )}

      {/* Share Document Modal */}
      {showShareDocumentModal && activeCallAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Share Document
            </h3>
            <p className="text-gray-600 mb-4">
              Upload a document to share with Dr.{" "}
              {activeCallAppointment.doctor.name}
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedDocument(e.target.files[0]);
                }
              }}
              className="mb-4 w-full border border-gray-300 rounded-lg p-2"
            />
            {selectedDocument && (
              <p className="text-sm text-gray-600 mb-4">
                Selected: {selectedDocument.name}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!selectedDocument) {
                    alert("Please select a document first");
                    return;
                  }
                  setUploadingDocument(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", selectedDocument);
                    formData.append("document_name", selectedDocument.name);
                    formData.append("category", "Other");
                    formData.append("appointment", activeCallAppointment.id);

                    // Upload the document to medical_documents table
                    const uploadResponse = await fetch(
                      `http://localhost:8000/api/patients/${patient?.id}/upload_document/`,
                      {
                        method: "POST",
                        body: formData,
                      }
                    );

                    if (uploadResponse.ok) {
                      const uploadedDoc = await uploadResponse.json();
                      console.log("Document uploaded:", uploadedDoc);

                      // Update appointment status
                      const statusResponse = await fetch(
                        `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            document_request_status: "accepted",
                          }),
                        }
                      );

                      if (statusResponse.ok) {
                        setShowShareDocumentModal(false);
                        setSelectedDocument(null);
                        // Update local state
                        setActiveCallAppointment({
                          ...activeCallAppointment,
                          document_request_status: "accepted",
                        });
                      }
                    } else {
                      const errorData = await uploadResponse.json();
                      console.error("Failed to upload document:", errorData);
                      alert("Failed to share document. Please try again.");
                    }
                  } catch (error) {
                    console.error("Error sharing document:", error);
                    alert("Error sharing document. Please try again.");
                  } finally {
                    setUploadingDocument(false);
                  }
                }}
                disabled={!selectedDocument || uploadingDocument}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {uploadingDocument ? "Uploading..." : "Share"}
              </button>
              <button
                onClick={() => {
                  setShowShareDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Approval Modal */}
      {showConsultationApprovalModal && activeCallAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Approve Consultation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve the consultation with Dr.{" "}
              {activeCallAppointment.doctor.name}? This will mark the
              appointment as completed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    // This would be your API endpoint to mark appointment as completed
                    const response = await fetch(
                      `http://localhost:8000/api/appointments/${activeCallAppointment.id}/approve/`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          status: "completed",
                          completed_by: "patient",
                        }),
                      }
                    );

                    if (response.ok) {
                      alert("Consultation approved successfully!");
                      setShowConsultationApprovalModal(false);
                      setShowVideoCall(false);
                      setActiveCallAppointment(null);
                      // Refresh appointments
                      window.location.reload();
                    } else {
                      alert(
                        "Failed to approve consultation. Please try again."
                      );
                    }
                  } catch (error) {
                    console.error("Error approving consultation:", error);
                    alert("Error approving consultation. Please try again.");
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Yes, Approve
              </button>
              <button
                onClick={() => {
                  setShowConsultationApprovalModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Request Modal - Doctor asking patient to complete */}
      {showCompletionRequestModal && activeCallAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Complete Consultation?
            </h3>
            <p className="text-gray-600 mb-6">
              Dr. {activeCallAppointment.doctor.name} has requested to complete
              the consultation. Do you want to complete the consultation?
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    // Patient accepts completion - set status to accepted
                    const response = await fetch(
                      `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          completion_request_status: "accepted",
                        }),
                      }
                    );

                    if (response.ok) {
                      console.log("Completion accepted, ending consultation");
                      setShowCompletionRequestModal(false);

                      // Show success message briefly
                      alert("Consultation completed successfully!");

                      // End video call and redirect
                      setShowVideoCall(false);
                      setActiveCallAppointment(null);

                      // Reload to update appointment list
                      window.location.href = "/patient/appointments";
                    } else {
                      alert("Failed to accept completion. Please try again.");
                    }
                  } catch (error) {
                    console.error("Error accepting completion:", error);
                    alert("Error accepting completion. Please try again.");
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Complete
              </button>
              <button
                onClick={async () => {
                  try {
                    // Patient rejects completion - set status to rejected
                    await fetch(
                      `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          completion_request_status: "rejected",
                        }),
                      }
                    );
                    setShowCompletionRequestModal(false);
                  } catch (error) {
                    console.error("Error rejecting completion:", error);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Not Yet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
