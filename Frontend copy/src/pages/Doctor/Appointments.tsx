import React, { useState, useEffect } from "react";
import { useAppointmentContext } from "../../context/AppointmentContext";
import { useDateTimeFormat } from "../../context/DateTimeFormatContext";
import { getLastVisitForNewAppointment } from "../../utils/appointmentUtils";
import RescheduleModal from "../../components/Doctor/Dashboard/RescheduleModal";
import { Search, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import VideoCallInterface from "../../components/VideoCallInterface";

// Simple empty box/modal for Start action
interface StartBoxProps {
  open: boolean;
  onClose: () => void;
  onComplete: (note: string) => void;
  initialNote?: string;
  isCompleting?: boolean;
  appointmentMode?: string;
  appointmentId?: string;
  patientInfo?: any;
}

const StartBox: React.FC<StartBoxProps> = ({
  open,
  onClose,
  onComplete,
  initialNote,
  isCompleting = false,
  appointmentMode,
  appointmentId,
  patientInfo,
}) => {
  const [confirm, setConfirm] = useState(false);

  // Prescription modal states (matching online mode)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionType, setPrescriptionType] = useState<"photo" | "text">(
    "photo"
  );
  const [prescriptionPhoto, setPrescriptionPhoto] = useState<File | null>(null);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [showPrescriptionConfirm, setShowPrescriptionConfirm] = useState(false);
  const [showPrescriptionSuccess, setShowPrescriptionSuccess] = useState(false);
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const [showNoPrescriptionWarning, setShowNoPrescriptionWarning] =
    useState(false);

  const isInPerson = appointmentMode?.toLowerCase() === "in-person";

  const handlePrescriptionUpload = async () => {
    try {
      // Get appointment details to get patient ID
      console.log(
        "[DEBUG] Uploading prescription for appointment:",
        appointmentId
      );
      const appointmentResponse = await fetch(
        `http://localhost:8000/api/appointments/${appointmentId}/`
      );
      if (!appointmentResponse.ok) {
        throw new Error("Failed to get appointment details");
      }
      const appointmentData = await appointmentResponse.json();
      const patientId =
        appointmentData.patient_info?.id || appointmentData.patient;
      const doctorName = appointmentData.doctor_info?.name || "Doctor";
      console.log("[DEBUG] Patient ID:", patientId);

      // Upload prescription as a medical document linked to this appointment
      const formData = new FormData();
      formData.append("category", "Prescription");
      formData.append("appointment", appointmentId || "");

      if (prescriptionType === "photo" && prescriptionPhoto) {
        formData.append("file", prescriptionPhoto);
        formData.append("document_name", `Prescription from ${doctorName}`);
      } else if (prescriptionType === "text" && prescriptionText.trim()) {
        // Create a text file from the prescription text
        const blob = new Blob([prescriptionText], { type: "text/plain" });
        const file = new File([blob], `Prescription_${Date.now()}.txt`, {
          type: "text/plain",
        });
        formData.append("file", file);
        formData.append("document_name", `Prescription from ${doctorName}`);
      }

      console.log("[DEBUG] Uploading with appointment ID:", appointmentId);

      const response = await fetch(
        `http://localhost:8000/api/patients/${patientId}/upload_document/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload prescription");
      }

      const result = await response.json();
      console.log("[DEBUG] Upload response:", result);

      // Mark prescription as uploaded in appointment
      await fetch(`http://localhost:8000/api/appointments/${appointmentId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescription_uploaded: true,
        }),
      });

      setShowPrescriptionConfirm(false);
      setShowPrescriptionModal(false);
      setShowPrescriptionSuccess(true);
      setPrescriptionUploaded(true);
      setPrescriptionPhoto(null);
      setPrescriptionText("");
    } catch (error) {
      console.error("Failed to upload prescription:", error);
      alert("Failed to upload prescription. Please try again.");
    }
  };

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          <h3 className="text-lg font-semibold mb-4">
            {isInPerson
              ? "Complete In-Person Appointment"
              : "Complete Appointment"}
          </h3>

          {isInPerson && (
            <div className="mb-4">
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="h-5 w-5"
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
                Add Prescription
              </button>
            </div>
          )}

          <div className="flex justify-end">
            {!confirm ? (
              <button
                className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 text-sm font-medium"
                onClick={() => {
                  // Check for prescription upload for in-person appointments
                  if (isInPerson && !prescriptionUploaded) {
                    setShowNoPrescriptionWarning(true);
                    return;
                  }
                  setConfirm(true);
                }}
              >
                Complete
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 mr-2 text-sm">
                  Mark as completed?
                </span>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs font-medium"
                  onClick={() => {
                    setConfirm(false);
                    onComplete("");
                  }}
                >
                  Yes
                </button>
                <button
                  className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 text-xs font-medium"
                  onClick={() => setConfirm(false)}
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Modal (matching online mode) */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add Prescription
            </h3>

            {/* Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription Type
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setPrescriptionType("photo")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    prescriptionType === "photo"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Upload Photo
                </button>
                <button
                  onClick={() => setPrescriptionType("text")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    prescriptionType === "text"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Type Prescription
                </button>
              </div>
            </div>

            {/* Photo Upload */}
            {prescriptionType === "photo" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Prescription Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.dcm,.xlsx,.csv,.tiff,.tif,.xls,.rtf,.bmp"
                  onChange={(e) =>
                    setPrescriptionPhoto(e.target.files?.[0] || null)
                  }
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {prescriptionPhoto && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {prescriptionPhoto.name}
                  </p>
                )}
              </div>
            )}

            {/* Text Input */}
            {prescriptionType === "text" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription Details
                </label>
                <textarea
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter prescription details..."
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setPrescriptionPhoto(null);
                  setPrescriptionText("");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (
                    (prescriptionType === "photo" && prescriptionPhoto) ||
                    (prescriptionType === "text" && prescriptionText.trim())
                  ) {
                    setShowPrescriptionConfirm(true);
                  }
                }}
                disabled={
                  (prescriptionType === "photo" && !prescriptionPhoto) ||
                  (prescriptionType === "text" && !prescriptionText.trim())
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Upload Confirmation */}
      {showPrescriptionConfirm && patientInfo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Prescription Upload
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to upload this prescription for{" "}
              {patientInfo.name}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPrescriptionConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrescriptionUpload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Success Message */}
      {showPrescriptionSuccess && patientInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
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
              Prescription Uploaded
            </h3>
            <p className="text-gray-600 mb-6">
              The prescription has been successfully uploaded to{" "}
              {patientInfo.name}'s documents.
            </p>
            <button
              onClick={() => setShowPrescriptionSuccess(false)}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* No Prescription Warning */}
      {showNoPrescriptionWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              No Prescription Uploaded
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't uploaded a prescription for this appointment. Do you
              want to complete the appointment without a prescription?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNoPrescriptionWarning(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
              >
                No, Go Back
              </button>
              <button
                onClick={() => {
                  setShowNoPrescriptionWarning(false);
                  setConfirm(true);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Complete Without Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
// Simple modal for viewing notes
const NoteViewModal: React.FC<{
  open: boolean;
  onClose: () => void;
  note: string | null;
}> = ({ open, onClose, note }) => {
  if (!open || !note) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Appointment Note
        </h2>
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-gray-800 text-base whitespace-pre-line shadow-inner">
          <span className="block font-medium text-cyan-700 mb-2">
            Doctor's Note:
          </span>
          <span className="block text-gray-900">{note}</span>
        </div>
      </div>
    </div>
  );
};

// Prescription View Modal
interface PrescriptionDocument {
  id: number;
  document_name: string;
  document_file: string;
  category: string;
  uploaded_at: string;
}

const PrescriptionViewModal: React.FC<{
  open: boolean;
  onClose: () => void;
  prescriptions: PrescriptionDocument[];
  loading: boolean;
}> = ({ open, onClose, prescriptions, loading }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Prescriptions
        </h2>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading prescriptions...</p>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No prescriptions were uploaded during this consultation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-cyan-50 border border-cyan-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-cyan-700 mb-1">
                      {prescription.document_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Uploaded:{" "}
                      {new Date(prescription.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={prescription.document_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-sm"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple modal for viewing cancellation reason
const CancellationReasonModal: React.FC<{
  open: boolean;
  onClose: () => void;
  reason: string | null;
}> = ({ open, onClose, reason }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Cancellation Reason
        </h2>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-gray-800 text-base whitespace-pre-line shadow-inner">
          <span className="block font-medium text-orange-700 mb-2">
            Patient's Reason:
          </span>
          <span className="block text-gray-900">
            {reason || "No reason provided"}
          </span>
        </div>
      </div>
    </div>
  );
};

// Simple modal for viewing reschedule reason
const RescheduleReasonModal: React.FC<{
  open: boolean;
  onClose: () => void;
  reason: string | null;
}> = ({ open, onClose, reason }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Reschedule Reason
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-800 text-base whitespace-pre-line shadow-inner">
          <span className="block font-medium text-blue-700 mb-2">
            Doctor's Reason:
          </span>
          <span className="block text-gray-900">
            {reason || "No reason provided"}
          </span>
        </div>
      </div>
    </div>
  );
};

// Patient interface for type safety
//
// ...existing code...

type Appointment = {
  id: string;
  patient: {
    name: string;
    avatar?: string;
    age?: number;
    gender?: string;
  };
  date: string;
  time: string;
  type: string;
  reason: string;
  mode?: string; // e.g., 'Online', 'In-person'
  status: "upcoming" | "completed" | "cancelled";
  notes?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  reschedule_reason?: string;
  rescheduled_by?: string;
  call_status?: string;
};

// ...existing code...

// Component for handling expandable reason text
const ReasonCell: React.FC<{ reason: string }> = ({ reason }) => {
  const [expanded, setExpanded] = useState(false);
  const reasonRef = React.useRef<HTMLDivElement>(null);
  const [needsReadMore, setNeedsReadMore] = React.useState(false);

  React.useEffect(() => {
    if (reasonRef.current) {
      // Create a temporary div to measure the full text height
      const temp = document.createElement("div");
      temp.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: ${reasonRef.current.offsetWidth}px;
        font-size: 14px;
        line-height: 1.5;
        word-break: break-word;
        white-space: normal;
      `;
      temp.textContent = reason;
      document.body.appendChild(temp);

      const lineHeight = 21; // 14px * 1.5 line-height
      const fullHeight = temp.offsetHeight;
      const lines = Math.ceil(fullHeight / lineHeight);

      document.body.removeChild(temp);
      setNeedsReadMore(lines > 3);
    }
  }, [reason]);

  if (!reason) return <span className="text-gray-400">No reason provided</span>;

  return (
    <div className="w-full max-w-[200px]">
      <div
        ref={reasonRef}
        className="text-sm text-gray-900"
        style={
          expanded
            ? {
                wordBreak: "break-word",
                whiteSpace: "normal",
              }
            : {
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
                whiteSpace: "normal",
                lineHeight: "1.5",
              }
        }
      >
        {reason}
      </div>
      {needsReadMore && (
        <button
          className="text-cyan-600 hover:text-cyan-800 text-xs font-medium mt-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
};
// Simple modal for analytics
const AnalyticsModal: React.FC<{
  open: boolean;
  onClose: () => void;
  stats: { upcoming: number; completed: number; cancelled: number };
}> = ({ open, onClose, stats }) => {
  if (!open) return null;
  const total = stats.upcoming + stats.completed + stats.cancelled;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 relative border border-cyan-100 animate-fadeIn">
        {/* Gradient header with icon */}
        <div className="rounded-t-2xl bg-gradient-to-r from-cyan-500 to-blue-400 px-6 py-5 flex items-center gap-3 shadow-md">
          <div className="bg-white/30 rounded-full p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-0">
              Appointment Analytics
            </h2>
            <p className="text-xs text-cyan-50">
              View detailed analytics about your appointment history,
              cancellations, and more.
            </p>
          </div>
          <button
            className="ml-auto text-white/80 hover:text-white text-2xl"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="bg-cyan-50 rounded p-3 text-center shadow-sm border border-cyan-100">
              <div className="text-2xl font-bold text-cyan-700">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="bg-cyan-50 rounded p-3 text-center shadow-sm border border-cyan-100">
              <div className="text-2xl font-bold text-cyan-700">
                {stats.upcoming}
              </div>
              <div className="text-xs text-gray-500">Upcoming</div>
            </div>
            <div className="bg-green-50 rounded p-3 text-center shadow-sm border border-green-100">
              <div className="text-2xl font-bold text-green-700">
                {stats.completed}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="bg-red-50 rounded p-3 text-center shadow-sm border border-red-100">
              <div className="text-2xl font-bold text-red-700">
                {stats.cancelled}
              </div>
              <div className="text-xs text-gray-500">Cancelled</div>
            </div>
          </div>
          {/* Simple bar chart */}
          <div className="mt-6">
            <div className="text-xs text-gray-500 mb-2">
              Appointments Breakdown
            </div>
            <div className="flex items-end space-x-2 h-24">
              {/* Upcoming */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  style={{
                    height: total
                      ? `${(stats.upcoming / total) * 80}px`
                      : "0px",
                  }}
                  className="w-6 bg-cyan-400 rounded-t shadow"
                ></div>
                <span className="text-xs mt-1">Upcoming</span>
                <span className="text-[10px] text-gray-500">
                  {total
                    ? `${Math.round((stats.upcoming / total) * 100)}%`
                    : "0%"}
                </span>
              </div>
              {/* Completed */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  style={{
                    height: total
                      ? `${(stats.completed / total) * 80}px`
                      : "0px",
                  }}
                  className="w-6 bg-green-400 rounded-t shadow"
                ></div>
                <span className="text-xs mt-1">Completed</span>
                <span className="text-[10px] text-gray-500">
                  {total
                    ? `${Math.round((stats.completed / total) * 100)}%`
                    : "0%"}
                </span>
              </div>
              {/* Cancelled */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  style={{
                    height: total
                      ? `${(stats.cancelled / total) * 80}px`
                      : "0px",
                  }}
                  className="w-6 bg-red-400 rounded-t shadow"
                ></div>
                <span className="text-xs mt-1">Cancelled</span>
                <span className="text-[10px] text-gray-500">
                  {total
                    ? `${Math.round((stats.cancelled / total) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Appointments = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];
  // Use context for appointments
  const { appointments, setAppointments } = useAppointmentContext();
  const { formatDate, formatTime } = useDateTimeFormat();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<
    null | (typeof appointments)[0]
  >(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteToView, setNoteToView] = useState<string | null>(null);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDocument[]>(
    []
  );
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [cancellationReasonModalOpen, setCancellationReasonModalOpen] =
    useState(false);
  const [cancellationReasonToView, setCancellationReasonToView] = useState<
    string | null
  >(null);
  const [rescheduleReasonModalOpen, setRescheduleReasonModalOpen] =
    useState(false);
  const [rescheduleReasonToView, setRescheduleReasonToView] = useState<
    string | null
  >(null);
  const navigate = useNavigate();

  // Get doctor info from AuthContext
  const { doctor } = useAuth();
  const doctorId = doctor?.id;
  const doctorName = doctor
    ? `${doctor.first_name} ${doctor.last_name}`
    : "Doctor";

  console.log(
    "[Appointments] doctorId from AuthContext:",
    doctorId,
    "doctorName:",
    doctorName,
    "doctor:",
    doctor
  );

  // Follow up modal state
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpAppointment, setFollowUpAppointment] = useState<
    null | (typeof appointments)[0]
  >(null);
  const [showFollowUpSuccess, setShowFollowUpSuccess] = useState(false);
  const [showRescheduleSuccess, setShowRescheduleSuccess] = useState(false);
  const [showPaymentRequestSuccess, setShowPaymentRequestSuccess] =
    useState(false);
  const [paymentRequestDetails, setPaymentRequestDetails] = useState<{
    patientName: string;
    type: string;
    appointmentDetails: string;
    amount: number;
    reason?: string;
  } | null>(null);
  // Handle follow up button click
  const handleFollowUp = (appointment: (typeof appointments)[0]) => {
    setFollowUpAppointment(appointment);
    setFollowUpOpen(true);
  };

  // Handle view prescriptions
  const handleViewPrescriptions = async (
    appointment: (typeof appointments)[0]
  ) => {
    setPrescriptionModalOpen(true);
    setLoadingPrescriptions(true);
    setPrescriptions([]);

    try {
      // First fetch the full appointment data to get the actual patient ID
      const appointmentResponse = await fetch(
        `http://localhost:8000/api/appointments/${appointment.id}/`
      );
      const appointmentData = await appointmentResponse.json();
      const patientId = appointmentData.patient;

      // Fetch all documents for this patient
      const response = await fetch(
        `http://localhost:8000/api/patients/${patientId}/documents/`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const documents = await response.json();

      // Filter for prescriptions linked to this specific appointment
      const appointmentPrescriptions = documents.filter((doc: any) => {
        // Handle both string and number comparison for appointment ID
        return (
          doc.category === "Prescription" &&
          (doc.appointment === appointment.id ||
            String(doc.appointment) === String(appointment.id))
        );
      });

      setPrescriptions(appointmentPrescriptions);
      setLoadingPrescriptions(false);
    } catch (error) {
      console.error(
        "[Doctor Appointments] Failed to fetch prescriptions:",
        error
      );
      setPrescriptions([]);
      setLoadingPrescriptions(false);
    }
  };

  // State for Start button modal
  const [startBoxOpenId, setStartBoxOpenId] = useState<string | null>(null);
  const [completingAppointmentId, setCompletingAppointmentId] = useState<
    string | null
  >(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeCallAppointment, setActiveCallAppointment] = useState<
    (typeof appointments)[0] | null
  >(null);
  const [showCallStartConfirm, setShowCallStartConfirm] = useState(false);
  const [pendingCallAppointment, setPendingCallAppointment] = useState<
    (typeof appointments)[0] | null
  >(null);
  const [showDeclinedMessage, setShowDeclinedMessage] = useState(false);
  const [showEndedMessage, setShowEndedMessage] = useState(false);
  const [sharedDocuments, setSharedDocuments] = useState<any[]>([]);
  const [showSharedDocs, setShowSharedDocs] = useState(false);
  const [patientAnswered, setPatientAnswered] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);
  const [permissionDeniedAcknowledged, setPermissionDeniedAcknowledged] =
    useState(false);
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);
  const [showRequestSent, setShowRequestSent] = useState(false);
  const [showDocumentsReceived, setShowDocumentsReceived] = useState(false);
  const [documentsAcknowledged, setDocumentsAcknowledged] = useState(false);
  const [showPatientResponse, setShowPatientResponse] = useState(false);
  const [patientResponseMessage, setPatientResponseMessage] = useState("");
  const [showConsultationFinished, setShowConsultationFinished] =
    useState(false);
  const [completionResponseAcknowledged, setCompletionResponseAcknowledged] =
    useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionType, setPrescriptionType] = useState<"photo" | "text">(
    "photo"
  );
  const [prescriptionPhoto, setPrescriptionPhoto] = useState<File | null>(null);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [showPrescriptionConfirm, setShowPrescriptionConfirm] = useState(false);
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const [showPrescriptionSuccess, setShowPrescriptionSuccess] = useState(false);

  // Pagination state - separate for each tab
  const [upcomingDisplayCount, setUpcomingDisplayCount] = useState(20);
  const [completedDisplayCount, setCompletedDisplayCount] = useState(20);
  const [cancelledDisplayCount, setCancelledDisplayCount] = useState(20);

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Poll for call status updates and shared documents when video call is open
  useEffect(() => {
    if (!showVideoCall || !activeCallAppointment) return;

    const checkCallStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`
        );
        const data = await response.json();

        // Check if patient joined
        if (data.patient_joined && !patientAnswered) {
          setPatientAnswered(true);
        }

        if (data.call_status === "declined") {
          // Close video interface and show declined message
          setShowVideoCall(false);
          setShowDeclinedMessage(true);
          setPatientAnswered(false);
          setSharedDocuments([]);
          setCallStartTime(null);
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === activeCallAppointment.id
                ? { ...a, call_status: "declined", appointment_started: false }
                : a
            )
          );
        } else if (data.call_status === "ended") {
          // Close video interface and show ended message
          setShowVideoCall(false);
          setShowEndedMessage(true);
          setPatientAnswered(false);
          setSharedDocuments([]);
          setCallStartTime(null);
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === activeCallAppointment.id
                ? { ...a, call_status: "ended", appointment_started: false }
                : a
            )
          );
        }

        // Check for permission denied
        if (
          data.document_request_status === "permission_denied" &&
          !permissionDeniedAcknowledged
        ) {
          setShowPermissionDenied(true);
          setPermissionDeniedAcknowledged(true);
        }

        // Check for shared documents - only show documents uploaded during this call session
        if (data.document_request_status === "accepted") {
          // Set call start time if not already set
          if (!callStartTime) {
            setCallStartTime(new Date());
          }

          // Fetch documents linked to this appointment
          const patientId = activeCallAppointment.patient.id || data.patient;
          const docsResponse = await fetch(
            `http://localhost:8000/api/patients/${patientId}/documents/`
          );
          const allDocs = await docsResponse.json();

          // Filter documents that:
          // 1. Are linked to this appointment
          // 2. Are not prescriptions (uploaded by doctor)
          // 3. Were uploaded after the call started (if we have a call start time)
          const appointmentDocs = allDocs.filter((doc: any) => {
            const isForThisAppointment =
              doc.appointment === activeCallAppointment.id;
            const isNotPrescription = doc.category !== "Prescription";
            const uploadedAfterCallStart = callStartTime
              ? new Date(doc.uploaded_at) >= callStartTime
              : true;
            return (
              isForThisAppointment &&
              isNotPrescription &&
              uploadedAfterCallStart
            );
          });

          // Only show documents that are new (not in current sharedDocuments list)
          const currentDocIds = sharedDocuments.map((doc: any) => doc.id);
          const newDocs = appointmentDocs.filter(
            (doc: any) => !currentDocIds.includes(doc.id)
          );

          // Show documents received message only if there are new documents
          if (newDocs.length > 0 && !documentsAcknowledged) {
            setShowDocumentsReceived(true);
            // Add new documents to existing list
            setSharedDocuments([...sharedDocuments, ...newDocs]);
          }
        }

        // Check for patient response to completion request
        if (
          data.completion_request_status === "accepted" &&
          !showConsultationFinished &&
          !completionResponseAcknowledged
        ) {
          // Patient accepted - show response message then finish consultation
          setPatientResponseMessage("accepted");
          setShowPatientResponse(true);
          setCompletionResponseAcknowledged(true);

          // After showing message, mark appointment as completed
          setTimeout(async () => {
            try {
              await fetch(
                `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    status: "completed",
                    appointment_started: false,
                    video_call_started: false,
                    call_status: null,
                    patient_joined: false,
                    document_request_status: null,
                    shared_documents: null,
                    completion_request_status: null,
                  }),
                }
              );
              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === activeCallAppointment.id
                    ? { ...a, status: "completed", appointment_started: false }
                    : a
                )
              );
              setShowPatientResponse(false);
              setShowConsultationFinished(true);

              // End the video call on doctor's side
              setTimeout(() => {
                setShowVideoCall(false);
                setActiveCallAppointment(null);
                setPatientAnswered(false);
                setSharedDocuments([]);
                setPrescriptionUploaded(false);
              }, 1500);
            } catch (error) {
              console.error("Failed to mark appointment as completed:", error);
            }
          }, 3000);
        } else if (
          data.completion_request_status === "rejected" &&
          !completionResponseAcknowledged
        ) {
          // Patient declined
          setPatientResponseMessage("rejected");
          setShowPatientResponse(true);
          setCompletionResponseAcknowledged(true);
        }
      } catch (error) {
        console.error("Failed to check call status:", error);
      }
    };

    checkCallStatus();
    const interval = setInterval(checkCallStatus, 2000);

    return () => clearInterval(interval);
  }, [
    showVideoCall,
    activeCallAppointment,
    patientAnswered,
    permissionDeniedAcknowledged,
    documentsAcknowledged,
    completionResponseAcknowledged,
    showConsultationFinished,
  ]);

  // Move appointment to completed
  const handleStartAppointment = async (id: string) => {
    // Check if doctor is blocked
    if (doctor?.is_blocked) {
      setToast({
        show: true,
        message:
          "Cannot start appointments while your account is blocked. Please contact the administrator.",
        type: "error",
      });
      return;
    }

    try {
      console.log("🚀 Doctor starting appointment:", id);
      // Mark appointment as started and reset all call-related fields
      const response = await fetch(
        `http://localhost:8000/api/appointments/${id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_started: true,
            call_status: null,
            patient_joined: false,
            document_request_status: null,
            shared_documents: null,
            completion_request_status: null,
            prescription_uploaded: false,
          }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        console.log("✅ Appointment started successfully:", updated);
      } else {
        console.error("❌ Failed to start appointment:", response.status);
      }

      // Update local state
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, appointment_started: true, call_status: null }
            : a
        )
      );
    } catch (error) {
      console.error("Failed to start appointment:", error);
      alert("Failed to start appointment. Please try again.");
    }
  };

  const handleCompleteAppointment = async (id: string, note: string) => {
    try {
      // Update in database via API
      await fetch(`http://localhost:8000/api/appointments/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          notes: note,
        }),
      });

      // Update local state
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "completed", notes: note } : a
        )
      );
      setStartBoxOpenId(null);
      setCompletingAppointmentId(null);
    } catch (error) {
      console.error("Failed to complete appointment:", error);
      alert("Failed to complete appointment. Please try again.");
    }
  };

  // Handle follow up submit - Create payment request instead of appointment
  const handleFollowUpSubmit = async (
    date: string,
    time: string,
    mode: string,
    reason?: string,
    locationId?: string,
    rescheduleReason?: string
  ) => {
    if (!followUpAppointment) return;

    console.log("[Follow-up] followUpAppointment object:", followUpAppointment);

    try {
      const finalReason =
        reason || followUpAppointment.reason || "Follow-up appointment";

      // Fetch the full appointment details from backend to get patient_id
      const appointmentResponse = await fetch(
        `http://localhost:8000/api/appointments/${followUpAppointment.id}/`
      );
      if (!appointmentResponse.ok) {
        throw new Error("Failed to fetch appointment details");
      }

      const appointmentData = await appointmentResponse.json();
      console.log(
        "[Follow-up] Full appointment data from backend:",
        appointmentData
      );

      const patientId = appointmentData.patient_id || appointmentData.patient;

      if (!patientId) {
        console.error(
          "[Follow-up] Patient ID not found in backend data:",
          appointmentData
        );
        alert("Error: Patient information is missing. Please contact support.");
        return;
      }

      console.log("[Follow-up] Using patient ID:", patientId);

      // Fetch doctor's pricing
      const pricingResponse = await fetch(
        `http://localhost:8000/api/doctor-pricing/?doctor_id=${doctorId}`
      );
      const pricingData = await pricingResponse.json();
      const pricingArray = pricingData.results || pricingData;

      let amount = mode === "online" ? 1500 : 2500; // Default prices
      if (pricingArray.length > 0) {
        amount =
          mode === "online"
            ? parseFloat(pricingArray[0].online_fee)
            : parseFloat(pricingArray[0].in_person_fee);
      }

      // Create payment request
      const paymentRequestData = {
        patient: patientId,
        doctor: doctorId,
        appointment_type:
          followUpAppointment.status === "cancelled"
            ? "Rescheduled"
            : "Follow-up",
        appointment_date: date,
        appointment_time: time,
        appointment_mode: mode,
        location: mode === "in-person" && locationId ? locationId : null,
        amount: amount,
        reason: finalReason,
        reschedule_reason: rescheduleReason || null,
        original_appointment: followUpAppointment.id,
        status: "pending",
      };

      console.log(
        "[Payment Request] Creating payment request with data:",
        paymentRequestData
      );

      const response = await fetch(
        "http://localhost:8000/api/payment-requests/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentRequestData),
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Failed to send payment request";

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("[Payment Request] Backend error:", errorData);
          errorMessage =
            errorData.error || errorData.detail || JSON.stringify(errorData);
        } else {
          const errorText = await response.text();
          console.error(
            "[Payment Request] Backend HTML error:",
            errorText.substring(0, 500)
          );
          errorMessage = `Server error (${response.status}). Check console for details.`;
        }

        throw new Error(errorMessage);
      }

      const paymentRequest = await response.json();
      console.log("[Payment Request] Created successfully:", paymentRequest);

      // Close modal and show success message
      setFollowUpOpen(false);
      setFollowUpAppointment(null);

      // Set payment request details and show modal
      const appointmentDetails = `${
        mode === "online" ? "Online" : "In-Person"
      } on ${new Date(date).toLocaleDateString()} at ${time}`;
      setPaymentRequestDetails({
        patientName: followUpAppointment.patient.name,
        type:
          followUpAppointment.status === "cancelled"
            ? "Rescheduled Appointment"
            : "Follow-up Appointment",
        appointmentDetails,
        amount,
      });
      setShowPaymentRequestSuccess(true);
    } catch (error) {
      console.error("Failed to send payment request:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send payment request. Please try again.";
      alert("Error: " + errorMessage);
    }
  };

  // Cancel appointment by id (set status to 'cancelled')
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<
    string | null
  >(null);
  const handleCancelClick = (appointmentId: string) => {
    setCancellingAppointmentId(appointmentId);
    setShowCancelModal(true);
    setCancelReason("");
  };

  const handleCancelSubmit = async () => {
    if (!cancellingAppointmentId || !cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    try {
      // Update in database via API - use /cancel/ endpoint to trigger refund
      await fetch(
        `http://localhost:8000/api/appointments/${cancellingAppointmentId}/cancel/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cancellation_reason: cancelReason.trim(),
            cancelled_by: "doctor",
          }),
        }
      );

      // Update local state
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === cancellingAppointmentId && app.status === "upcoming"
            ? {
                ...app,
                status: "cancelled" as "cancelled",
                cancellation_reason: cancelReason.trim(),
                cancelled_by: "doctor",
              }
            : app
        )
      );

      setShowCancelModal(false);
      setCancellingAppointmentId(null);
      setCancelReason("");
      setCancelConfirmId(null);
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const handleReschedule = (appointment: (typeof appointments)[0]) => {
    setRescheduleAppointment(appointment);
    setRescheduleOpen(true);
  };
  const handleCloseReschedule = () => {
    setRescheduleOpen(false);
    setRescheduleAppointment(null);
  };
  const handleRescheduleSubmit = async (
    date: string,
    time: string,
    mode: string,
    reason?: string,
    locationId?: string,
    rescheduleReason?: string
  ) => {
    if (!rescheduleAppointment) return;

    console.log(
      "[Reschedule] rescheduleAppointment object:",
      rescheduleAppointment
    );

    try {
      const finalReason =
        reason || rescheduleAppointment.reason || "Rescheduled appointment";

      // If rescheduling from upcoming appointments, UPDATE the existing appointment (no payment needed)
      if (rescheduleAppointment.status === "upcoming") {
        const updateData: any = {
          appointment_date: date, // yyyy-mm-dd format
          appointment_time: time, // HH:MM format
          appointment_mode: mode,
          status: "upcoming",
        };

        // Add reschedule reason if provided
        if (rescheduleReason && rescheduleReason.trim()) {
          updateData.reschedule_reason = rescheduleReason.trim();
          updateData.rescheduled_by = "doctor";
        }

        // Add location for in-person appointments
        if (mode === "in-person" && locationId) {
          updateData.location = locationId;
        }

        console.log("[Reschedule] Updating appointment with data:", updateData);

        // Update existing appointment
        const response = await fetch(
          `http://localhost:8000/api/appointments/${rescheduleAppointment.id}/`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update appointment");
        }

        // Update local state
        const d = new Date(date);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const formattedDate = `${dd}-${mm}-${yyyy}`;

        // Create new array to trigger re-sort
        setAppointments((prev) => {
          const updated = prev.map((app) =>
            app.id === rescheduleAppointment.id
              ? {
                  ...app,
                  date: formattedDate,
                  time,
                  mode,
                  appointment_mode: mode,
                }
              : app
          );
          // Return new array reference to trigger re-render and re-sort
          return [...updated];
        });

        setRescheduleOpen(false);
        setRescheduleAppointment(null);

        // Show success message for upcoming appointment reschedule
        const appointmentDetails = `${
          mode === "online" ? "Online" : "In-Person"
        } on ${new Date(date).toLocaleDateString()} at ${time}`;
        alert(`✅ Appointment Rescheduled Successfully!

Patient: ${rescheduleAppointment.patient.name}
New Schedule: ${appointmentDetails}
${rescheduleReason ? `Reason: ${rescheduleReason}` : ""}

The appointment has been updated and will appear in your upcoming appointments.

Thank you!`);
        return;
      }

      // For cancelled appointments, send payment request instead of creating appointment directly

      // Fetch the full appointment details from backend to get patient_id
      const appointmentResponse = await fetch(
        `http://localhost:8000/api/appointments/${rescheduleAppointment.id}/`
      );
      if (!appointmentResponse.ok) {
        throw new Error("Failed to fetch appointment details");
      }

      const appointmentData = await appointmentResponse.json();
      console.log(
        "[Reschedule] Full appointment data from backend:",
        appointmentData
      );

      const patientId = appointmentData.patient_id || appointmentData.patient;

      if (!patientId) {
        console.error(
          "[Reschedule] Patient ID not found in backend data:",
          appointmentData
        );
        alert("Error: Patient information is missing. Please contact support.");
        return;
      }

      console.log("[Reschedule] Using patient ID:", patientId);

      // Fetch doctor's pricing
      const pricingResponse = await fetch(
        `http://localhost:8000/api/doctor-pricing/?doctor_id=${doctorId}`
      );
      const pricingData = await pricingResponse.json();
      const pricingArray = pricingData.results || pricingData;

      let amount = mode === "online" ? 1500 : 2500; // Default prices
      if (pricingArray.length > 0) {
        amount =
          mode === "online"
            ? parseFloat(pricingArray[0].online_fee)
            : parseFloat(pricingArray[0].in_person_fee);
      }

      // Create payment request for rescheduled appointment
      const paymentRequestData = {
        patient: patientId,
        doctor: doctorId,
        appointment_type: "Rescheduled",
        appointment_date: date,
        appointment_time: time,
        appointment_mode: mode,
        location: mode === "in-person" && locationId ? locationId : null,
        amount: amount,
        reason: finalReason,
        reschedule_reason: rescheduleReason || null,
        original_appointment: rescheduleAppointment.id,
        status: "pending",
      };

      console.log(
        "[Payment Request] Creating payment request for reschedule with data:",
        paymentRequestData
      );

      const response = await fetch(
        "http://localhost:8000/api/payment-requests/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentRequestData),
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Failed to send payment request";

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("[Payment Request] Backend error:", errorData);
          errorMessage =
            errorData.error || errorData.detail || JSON.stringify(errorData);
        } else {
          const errorText = await response.text();
          console.error(
            "[Payment Request] Backend HTML error:",
            errorText.substring(0, 500)
          );
          errorMessage = `Server error (${response.status}). Check console for details.`;
        }

        throw new Error(errorMessage);
      }

      const paymentRequest = await response.json();
      console.log("[Payment Request] Created successfully:", paymentRequest);

      // Close modal and show success message
      setRescheduleOpen(false);
      setRescheduleAppointment(null);

      // Set payment request details and show modal
      const appointmentDetails = `${
        mode === "online" ? "Online" : "In-Person"
      } on ${new Date(date).toLocaleDateString()} at ${time}`;
      setPaymentRequestDetails({
        patientName: rescheduleAppointment.patient.name,
        type: "Rescheduled Appointment",
        appointmentDetails,
        amount,
        reason: rescheduleReason,
      });
      setShowPaymentRequestSuccess(true);
      return;
    } catch (error) {
      console.error("Failed to send payment request:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send payment request. Please try again.";
      alert("Error: " + errorMessage);
      return;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesTab = appointment.status === activeTab;
    const matchesSearch =
      appointment.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      appointment.type.toLowerCase().includes(search.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || appointment.type === filterType;
    return matchesTab && matchesSearch && matchesType;
  });

  // Sort upcoming appointments strictly by date (today, tomorrow, then future), and by time within the same day
  let sortedAppointments = filteredAppointments;
  const getDateTimeValue = (d: string, t: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    let baseDate: Date;
    if (d.toLowerCase() === "today") {
      baseDate = new Date(today);
    } else if (d.toLowerCase() === "tomorrow") {
      baseDate = new Date(tomorrow);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
      const [day, month, year] = d.split("-").map(Number);
      baseDate = new Date(year, month - 1, day);
    } else {
      const parsed = Date.parse(d);
      baseDate = isNaN(parsed) ? new Date(0) : new Date(parsed);
    }
    if (t) {
      const [h, m] = t.split(":");
      baseDate.setHours(Number(h));
      baseDate.setMinutes(Number(m));
    }
    return baseDate.getTime();
  };
  if (activeTab === "upcoming") {
    sortedAppointments = [...filteredAppointments].sort(
      (a, b) =>
        getDateTimeValue(a.date, a.time) - getDateTimeValue(b.date, b.time)
    );
  } else if (activeTab === "completed") {
    sortedAppointments = [...filteredAppointments].sort(
      (a, b) =>
        getDateTimeValue(b.date, b.time) - getDateTimeValue(a.date, a.time)
    );
  } else if (activeTab === "cancelled") {
    sortedAppointments = [...filteredAppointments].sort(
      (a, b) =>
        getDateTimeValue(b.date, b.time) - getDateTimeValue(a.date, a.time)
    );
  }

  // Apply pagination based on active tab
  const currentDisplayCount =
    activeTab === "upcoming"
      ? upcomingDisplayCount
      : activeTab === "completed"
      ? completedDisplayCount
      : cancelledDisplayCount;

  const totalCount = sortedAppointments.length;
  const displayedAppointments = sortedAppointments.slice(
    0,
    currentDisplayCount
  );
  const hasMore = totalCount > currentDisplayCount;

  // Analytics modal state
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const analyticsStats = {
    upcoming: appointments.filter((a) => a.status === "upcoming").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600">
          Manage and view all your patient appointments
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
          onClick={() => setAnalyticsOpen(true)}
        >
          View Analytics
        </button>
        <AnalyticsModal
          open={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
          stats={analyticsStats}
        />
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? tab.id === "upcoming"
                      ? "bg-blue-50 text-blue-700"
                      : tab.id === "completed"
                      ? "bg-green-50 text-green-700"
                      : tab.id === "cancelled"
                      ? "bg-red-50 text-red-700"
                      : "bg-cyan-50 text-cyan-700"
                    : tab.id === "upcoming"
                    ? "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                    : tab.id === "completed"
                    ? "text-green-600 hover:text-green-900 hover:bg-green-50"
                    : tab.id === "cancelled"
                    ? "text-red-600 hover:text-red-900 hover:bg-red-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search appointments"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="all">All Types</option>
                {[...new Set(appointments.map((a) => a.type))].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          {filteredAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Patient
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Reason
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Mode
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {appointment.patient.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={appointment.patient.avatar}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                                {appointment.patient.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.patient.age} yrs,{" "}
                              {appointment.patient.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(appointment.date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(appointment.time)}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ width: "200px", maxWidth: "200px" }}
                      >
                        <div className="text-sm text-gray-900 break-words">
                          <ReasonCell reason={appointment.reason || ""} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {appointment.mode || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.reschedule_reason && (
                          <div className="flex flex-col gap-1">
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
                                ? "Rescheduled by Admin"
                                : appointment.rescheduled_by === "doctor"
                                ? "Rescheduled by Doctor"
                                : "Rescheduled"}
                            </span>
                            <button
                              className="text-xs text-blue-600 hover:text-blue-900 underline text-left"
                              onClick={() => {
                                setRescheduleReasonToView(
                                  appointment.reschedule_reason ||
                                    "No reason provided"
                                );
                                setRescheduleReasonModalOpen(true);
                              }}
                            >
                              View Reason
                            </button>
                          </div>
                        )}
                        {appointment.status === "cancelled" &&
                          appointment.cancelled_by === "doctor" && (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Cancelled by You
                              </span>
                              {appointment.cancellation_reason && (
                                <button
                                  className="text-xs text-red-600 hover:text-red-900 underline text-left"
                                  onClick={() => {
                                    setCancellationReasonToView(
                                      appointment.cancellation_reason ||
                                        "No reason provided"
                                    );
                                    setCancellationReasonModalOpen(true);
                                  }}
                                >
                                  View Reason
                                </button>
                              )}
                            </div>
                          )}
                        {appointment.status === "cancelled" &&
                          appointment.cancelled_by === "patient" && (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                Cancelled by Patient
                              </span>
                              {appointment.cancellation_reason && (
                                <button
                                  className="text-xs text-orange-600 hover:text-orange-900 underline text-left"
                                  onClick={() => {
                                    setCancellationReasonToView(
                                      appointment.cancellation_reason ||
                                        "No reason provided"
                                    );
                                    setCancellationReasonModalOpen(true);
                                  }}
                                >
                                  View Reason
                                </button>
                              )}
                            </div>
                          )}
                        {appointment.status === "cancelled" &&
                          appointment.cancelled_by === "admin" && (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Cancelled by Admin
                              </span>
                              {appointment.cancellation_reason && (
                                <button
                                  className="text-xs text-purple-600 hover:text-purple-900 underline text-left"
                                  onClick={() => {
                                    setCancellationReasonToView(
                                      appointment.cancellation_reason ||
                                        "No reason provided"
                                    );
                                    setCancellationReasonModalOpen(true);
                                  }}
                                >
                                  View Reason
                                </button>
                              )}
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {(activeTab === "upcoming" ||
                          activeTab === "completed" ||
                          activeTab === "cancelled") && (
                          <>
                            {activeTab === "upcoming" && (
                              <div className="flex flex-row flex-wrap gap-2 items-center justify-center">
                                {appointment.mode?.toLowerCase() ===
                                "in-person" ? (
                                  <button
                                    className="text-green-600 hover:text-green-900"
                                    onClick={() => {
                                      setStartBoxOpenId(appointment.id);
                                      setCompletingAppointmentId(
                                        appointment.id
                                      );
                                    }}
                                  >
                                    Start
                                  </button>
                                ) : (
                                  <button
                                    className="text-green-600 hover:text-green-900"
                                    onClick={() => {
                                      setPendingCallAppointment(appointment);
                                      setShowCallStartConfirm(true);
                                    }}
                                  >
                                    Start
                                  </button>
                                )}
                                <button
                                  className="text-cyan-600 hover:text-cyan-900"
                                  onClick={() => handleReschedule(appointment)}
                                >
                                  Reschedule
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={() =>
                                    handleCancelClick(appointment.id)
                                  }
                                >
                                  Cancel
                                </button>
                                <button
                                  className="text-purple-600 hover:text-purple-900 inline-flex items-center font-semibold"
                                  title="Message Patient"
                                  onClick={() =>
                                    navigate("/doctor/messages", {
                                      state: {
                                        patientId: appointment.patient.id,
                                        patientName: appointment.patient.name,
                                      },
                                    })
                                  }
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />{" "}
                                  Message
                                </button>
                                <StartBox
                                  open={startBoxOpenId === appointment.id}
                                  onClose={() => {
                                    setStartBoxOpenId(null);
                                    setCompletingAppointmentId(null);
                                  }}
                                  onComplete={(note) =>
                                    handleCompleteAppointment(
                                      appointment.id,
                                      note
                                    )
                                  }
                                  initialNote={appointment.notes || ""}
                                  isCompleting={
                                    completingAppointmentId === appointment.id
                                  }
                                  appointmentMode={appointment.mode}
                                  appointmentId={appointment.id}
                                  patientInfo={appointment.patient}
                                />
                              </div>
                            )}
                            {activeTab === "completed" && (
                              <div className="flex flex-row flex-wrap gap-2 items-center justify-center">
                                <button
                                  className="text-cyan-600 hover:text-cyan-900"
                                  onClick={() =>
                                    handleViewPrescriptions(appointment)
                                  }
                                >
                                  View Prescription
                                </button>
                                <button
                                  className="text-cyan-600 hover:text-cyan-900"
                                  onClick={() => handleFollowUp(appointment)}
                                >
                                  Follow Up
                                </button>
                                <button
                                  className="text-purple-600 hover:text-purple-900 inline-flex items-center font-semibold"
                                  title="Message Patient"
                                  onClick={() =>
                                    navigate("/doctor/messages", {
                                      state: {
                                        patientId: appointment.patient.id,
                                        patientName: appointment.patient.name,
                                      },
                                    })
                                  }
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />{" "}
                                  Message
                                </button>
                              </div>
                            )}
                            {activeTab === "cancelled" && (
                              <div className="flex flex-row flex-wrap gap-2 items-center justify-center">
                                <button
                                  className="text-cyan-600 hover:text-cyan-900"
                                  onClick={() => handleReschedule(appointment)}
                                >
                                  Reschedule
                                </button>
                                <button
                                  className="text-purple-600 hover:text-purple-900 inline-flex items-center font-semibold"
                                  title="Message Patient"
                                  onClick={() =>
                                    navigate("/doctor/messages", {
                                      state: {
                                        patientId: appointment.patient.id,
                                        patientName: appointment.patient.name,
                                      },
                                    })
                                  }
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />{" "}
                                  Message
                                </button>
                              </div>
                            )}
                          </>
                        )}
                        {/* Removed duplicate completed and cancelled actions */}
                        <RescheduleModal
                          open={rescheduleOpen}
                          onClose={handleCloseReschedule}
                          appointment={rescheduleAppointment}
                          onSubmit={handleRescheduleSubmit}
                          isFollowUp={false}
                          doctorId={doctorId}
                        />
                        <NoteViewModal
                          open={noteModalOpen}
                          onClose={() => setNoteModalOpen(false)}
                          note={noteToView}
                        />
                        <PrescriptionViewModal
                          open={prescriptionModalOpen}
                          onClose={() => setPrescriptionModalOpen(false)}
                          prescriptions={prescriptions}
                          loading={loadingPrescriptions}
                        />
                        <CancellationReasonModal
                          open={cancellationReasonModalOpen}
                          onClose={() => setCancellationReasonModalOpen(false)}
                          reason={cancellationReasonToView}
                        />
                        <RescheduleReasonModal
                          open={rescheduleReasonModalOpen}
                          onClose={() => setRescheduleReasonModalOpen(false)}
                          reason={rescheduleReasonToView}
                        />
                        {/* Follow Up Modal (reuse RescheduleModal) */}
                        <RescheduleModal
                          open={followUpOpen}
                          onClose={() => {
                            setFollowUpOpen(false);
                            setFollowUpAppointment(null);
                          }}
                          appointment={followUpAppointment}
                          onSubmit={handleFollowUpSubmit}
                          isFollowUp={true}
                          doctorId={doctorId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                No {activeTab} appointments found.
              </p>
            </div>
          )}
        </div>

        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
            <button
              onClick={() => {
                if (activeTab === "upcoming") {
                  setUpcomingDisplayCount((prev) => prev + 10);
                } else if (activeTab === "completed") {
                  setCompletedDisplayCount((prev) => prev + 10);
                } else if (activeTab === "cancelled") {
                  setCancelledDisplayCount((prev) => prev + 10);
                }
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Call Start Confirmation Modal */}
      {showCallStartConfirm && pendingCallAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Start Video Call
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to start a video consultation with{" "}
              {pendingCallAppointment.patient.name}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCallStartConfirm(false);
                  setPendingCallAppointment(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await handleStartAppointment(pendingCallAppointment.id);
                    setActiveCallAppointment(pendingCallAppointment);
                    setShowVideoCall(true); // This will show the CometChat video interface
                    setCallStartTime(new Date()); // Track when call started
                    setShowCallStartConfirm(false);
                    setPendingCallAppointment(null);
                    // Reset prescription state for new call
                    setPrescriptionUploaded(false);
                  } catch (error) {
                    console.error("Error starting call:", error);
                    alert("Failed to start call. Please try again.");
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Start Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Declined Message Modal */}
      {showDeclinedMessage && activeCallAppointment && (
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
              Call Declined
            </h3>
            <p className="text-gray-600 mb-6">
              {activeCallAppointment.patient.name} declined the video call.
            </p>
            <button
              onClick={() => {
                setShowDeclinedMessage(false);
                setActiveCallAppointment(null);
                setDocumentsAcknowledged(false);
                setCompletionResponseAcknowledged(false);
                setPermissionDeniedAcknowledged(false);
              }}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Permission Denied Message Modal */}
      {showPermissionDenied && activeCallAppointment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Permission Denied
            </h3>
            <p className="text-gray-600 mb-6">
              {activeCallAppointment.patient.name} declined to share their
              medical documents.
            </p>
            <button
              onClick={() => {
                setShowPermissionDenied(false);
                setPermissionDeniedAcknowledged(true);
              }}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Call Ended Message Modal */}
      {showEndedMessage && activeCallAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <svg
                  className="h-6 w-6 text-orange-600"
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
              Call Ended
            </h3>
            <p className="text-gray-600 mb-6">
              {activeCallAppointment.patient.name} ended the video call.
            </p>
            <button
              onClick={() => {
                setShowEndedMessage(false);
                setActiveCallAppointment(null);
                setDocumentsAcknowledged(false);
                setCompletionResponseAcknowledged(false);
                setPermissionDeniedAcknowledged(false);
              }}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && activeCallAppointment && (
        <VideoCallInterface
          appointmentId={activeCallAppointment.id}
          patientId={String(activeCallAppointment.patient.id)}
          patientName={activeCallAppointment.patient.name}
          doctorId={String(doctorId)}
          doctorName={doctorName}
          isDoctor={true}
          sharedDocuments={sharedDocuments}
          onCallEnd={async () => {
            console.log("Doctor ending call, cleaning up...");

            // Update appointment status to ended
            if (activeCallAppointment) {
              try {
                await fetch(
                  `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      call_status: "ended",
                      appointment_started: false,
                    }),
                  }
                );
                console.log("✅ Call status updated to ended");
              } catch (error) {
                console.error("Failed to update call status:", error);
              }
            }

            setShowVideoCall(false);
            setActiveCallAppointment(null);
            setPatientAnswered(false);
            setSharedDocuments([]);
            setCallStartTime(null);
            setPrescriptionUploaded(false);
            // Give a moment for cleanup
            await new Promise((resolve) => setTimeout(resolve, 500));
          }}
          onUploadPrescription={() => {
            setShowPrescriptionModal(true);
          }}
          onUploadDocument={async () => {
            if (activeCallAppointment) {
              console.log("📄 Doctor requesting documents");
              try {
                const response = await fetch(
                  `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      document_request_status: "requested",
                    }),
                  }
                );
                if (response.ok) {
                  console.log("✅ Document request sent to patient");
                }
                setShowRequestSent(true);
              } catch (error) {
                console.error("Failed to request documents:", error);
              }
            }
          }}
          onCompleteAppointment={async () => {
            if (activeCallAppointment) {
              try {
                console.log(
                  "🔵 Doctor requesting completion for:",
                  activeCallAppointment.id
                );
                const response = await fetch(
                  `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      completion_request_status: "requested",
                    }),
                  }
                );

                if (response.ok) {
                  const updated = await response.json();
                  console.log(
                    "✅ Completion request sent successfully:",
                    updated
                  );
                } else {
                  console.error(
                    "❌ Failed to send completion request:",
                    response.status
                  );
                }
              } catch (error) {
                console.error("❌ Failed to request completion:", error);
              }
            } else {
              console.log("⚠️ No active call appointment");
            }
          }}
        />
      )}

      {/* Shared Documents Modal */}
      {showSharedDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Shared Documents
              </h3>
              <button
                onClick={() => setShowSharedDocs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
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
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {sharedDocuments.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg
                          className="h-10 w-10 text-cyan-600"
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
                        <div>
                          <p className="font-medium text-gray-900">
                            {doc.document_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {doc.category} • {(doc.file_size / 1024).toFixed(2)}{" "}
                            KB
                          </p>
                          <p className="text-xs text-gray-400">
                            Uploaded:{" "}
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Sent Message */}
      {showRequestSent && (
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Request Sent
            </h3>
            <p className="text-gray-600 mb-6">
              Your document request has been sent to the patient.
            </p>
            <button
              onClick={() => setShowRequestSent(false)}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Documents Received Message */}
      {showDocumentsReceived && (
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
              Documents Received
            </h3>
            <p className="text-gray-600 mb-6">
              The patient has shared {sharedDocuments.length} document
              {sharedDocuments.length !== 1 ? "s" : ""} with you.
            </p>
            <button
              onClick={() => {
                setShowDocumentsReceived(false);
                setDocumentsAcknowledged(true);
              }}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* End Call Confirmation */}
      {showEndCallConfirm && activeCallAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              End Call
            </h3>
            <p className="text-gray-600 mb-6">
              {!prescriptionUploaded ? (
                <>
                  <span className="block mb-2">
                    ⚠️ You haven't uploaded a prescription yet.
                  </span>
                  Are you sure you want to end this call with{" "}
                  {activeCallAppointment.patient.name}?
                </>
              ) : (
                `Are you sure you want to end this call with ${activeCallAppointment.patient.name}?`
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEndCallConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch(
                      `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          appointment_started: false,
                          call_status: null,
                          patient_joined: false,
                          document_request_status: null,
                          shared_documents: null,
                          completion_request_status: null,
                        }),
                      }
                    );
                    setAppointments((prev) =>
                      prev.map((a) =>
                        a.id === activeCallAppointment.id
                          ? {
                              ...a,
                              appointment_started: false,
                              call_status: null,
                            }
                          : a
                      )
                    );
                  } catch (error) {
                    console.error("Failed to end call:", error);
                  }
                  setShowEndCallConfirm(false);
                  setShowVideoCall(false);
                  setActiveCallAppointment(null);
                  setPatientAnswered(false);
                  setSharedDocuments([]);
                  setDocumentsAcknowledged(false);
                  setCompletionResponseAcknowledged(false);
                  setPermissionDeniedAcknowledged(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Response to Completion Request */}
      {showPatientResponse && activeCallAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="mb-4">
              <div
                className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                  patientResponseMessage === "accepted"
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                {patientResponseMessage === "accepted" ? (
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
                ) : (
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
                )}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {patientResponseMessage === "accepted"
                ? "Patient Accepted"
                : "Patient Declined"}
            </h3>
            <p className="text-gray-600 mb-6">
              {patientResponseMessage === "accepted"
                ? "The patient has accepted to complete the consultation."
                : "The patient has declined to complete the consultation."}
            </p>
            <button
              onClick={() => setShowPatientResponse(false)}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Consultation Finished Message */}
      {showConsultationFinished && activeCallAppointment && (
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
              Consultation Finished
            </h3>
            <p className="text-gray-600 mb-6">
              The consultation with {activeCallAppointment.patient.name} has
              been completed successfully.
            </p>
            <button
              onClick={() => {
                setShowConsultationFinished(false);
                setShowVideoCall(false);
                setActiveCallAppointment(null);
                setPatientAnswered(false);
                setSharedDocuments([]);
                setDocumentsAcknowledged(false);
                setCompletionResponseAcknowledged(false);
                setPermissionDeniedAcknowledged(false);
              }}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Add Prescription Modal */}
      {showPrescriptionModal && activeCallAppointment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add Prescription
            </h3>

            {/* Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription Type
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setPrescriptionType("photo")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    prescriptionType === "photo"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Upload Photo
                </button>
                <button
                  onClick={() => setPrescriptionType("text")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    prescriptionType === "text"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Type Prescription
                </button>
              </div>
            </div>

            {/* Photo Upload */}
            {prescriptionType === "photo" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Prescription Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.dcm,.xlsx,.csv,.tiff,.tif,.xls,.rtf,.bmp"
                  onChange={(e) =>
                    setPrescriptionPhoto(e.target.files?.[0] || null)
                  }
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {prescriptionPhoto && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {prescriptionPhoto.name}
                  </p>
                )}
              </div>
            )}

            {/* Text Input */}
            {prescriptionType === "text" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription Details
                </label>
                <textarea
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter prescription details..."
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setPrescriptionPhoto(null);
                  setPrescriptionText("");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (
                    (prescriptionType === "photo" && prescriptionPhoto) ||
                    (prescriptionType === "text" && prescriptionText.trim())
                  ) {
                    setShowPrescriptionConfirm(true);
                  }
                }}
                disabled={
                  (prescriptionType === "photo" && !prescriptionPhoto) ||
                  (prescriptionType === "text" && !prescriptionText.trim())
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Upload Confirmation */}
      {showPrescriptionConfirm && activeCallAppointment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Prescription Upload
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to upload this prescription for{" "}
              {activeCallAppointment.patient.name}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPrescriptionConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Fetch the full appointment to get the patient ID and doctor info
                    const appointmentResponse = await fetch(
                      `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`
                    );
                    const appointmentData = await appointmentResponse.json();
                    const patientId = appointmentData.patient;
                    const doctorName =
                      appointmentData.doctor_info?.name || "Doctor";

                    const formData = new FormData();
                    formData.append("category", "Prescription");
                    formData.append("appointment", activeCallAppointment.id); // Link to appointment

                    if (prescriptionType === "photo" && prescriptionPhoto) {
                      formData.append("file", prescriptionPhoto);
                      formData.append(
                        "document_name",
                        `Prescription from ${doctorName}`
                      );
                    } else if (prescriptionType === "text") {
                      // Create a text file from the prescription text
                      const blob = new Blob([prescriptionText], {
                        type: "text/plain",
                      });
                      const file = new File(
                        [blob],
                        `Prescription_${Date.now()}.txt`,
                        { type: "text/plain" }
                      );
                      formData.append("file", file);
                      formData.append(
                        "document_name",
                        `Prescription from ${doctorName}`
                      );
                    }

                    console.log("Appointment data:", appointmentData);
                    console.log("Patient ID:", patientId);

                    if (!patientId) {
                      alert("Error: Patient ID not found");
                      return;
                    }

                    const response = await fetch(
                      `http://localhost:8000/api/patients/${patientId}/upload_document/`,
                      {
                        method: "POST",
                        body: formData,
                      }
                    );

                    if (response.ok) {
                      // Mark prescription as uploaded in appointment
                      await fetch(
                        `http://localhost:8000/api/appointments/${activeCallAppointment.id}/`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            prescription_uploaded: true,
                          }),
                        }
                      );

                      setPrescriptionUploaded(true);
                      setShowPrescriptionConfirm(false);
                      setShowPrescriptionModal(false);
                      setShowPrescriptionSuccess(true);
                      setPrescriptionPhoto(null);
                      setPrescriptionText("");
                    } else {
                      alert("Failed to upload prescription. Please try again.");
                    }
                  } catch (error) {
                    console.error("Failed to upload prescription:", error);
                    alert("Failed to upload prescription. Please try again.");
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Success Message */}
      {showPrescriptionSuccess && activeCallAppointment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
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
              Prescription Uploaded
            </h3>
            <p className="text-gray-600 mb-6">
              The prescription has been successfully uploaded to{" "}
              {activeCallAppointment.patient.name}'s documents.
            </p>
            <button
              onClick={() => setShowPrescriptionSuccess(false)}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Success Modal */}
      {showFollowUpSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 text-center">
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
              Follow-up Scheduled!
            </h3>
            <p className="text-gray-600 mb-6">
              The follow-up appointment has been successfully scheduled and will
              appear in your upcoming appointments.
            </p>
            <button
              onClick={() => setShowFollowUpSuccess(false)}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Success Modal */}
      {showRescheduleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 text-center">
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
              Appointment Rescheduled!
            </h3>
            <p className="text-gray-600 mb-6">
              The appointment has been successfully rescheduled and will appear
              in your upcoming appointments.
            </p>
            <button
              onClick={() => setShowRescheduleSuccess(false)}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Payment Request Success Modal */}
      {showPaymentRequestSuccess && paymentRequestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Payment Request Sent Successfully!
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Patient:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentRequestDetails.patientName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Type:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentRequestDetails.type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Appointment:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentRequestDetails.appointmentDetails}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Amount:</span>
                <span className="text-green-600 font-bold text-lg">
                  Rs. {paymentRequestDetails.amount.toLocaleString()}
                </span>
              </div>
              {paymentRequestDetails.reason && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Reason:</span>
                  <span className="text-gray-900 font-semibold">
                    {paymentRequestDetails.reason}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    📱 Next Steps:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Patient will receive a notification</li>
                    <li>
                      • Patient can view and pay the request from their Payments
                      section
                    </li>
                    <li>
                      • Once payment is completed, the appointment will be
                      automatically scheduled
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPaymentRequestSuccess(false);
                setPaymentRequestDetails(null);
              }}
              className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Appointment
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for cancelling this appointment:
            </p>

            {/* Refund Notice */}
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Refund Notice
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Cancelling this appointment will automatically issue a full
                    refund to the patient. The refund will appear in both your
                    and the patient's transaction history.
                  </p>
                </div>
              </div>
            </div>

            <textarea
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              required
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingAppointmentId(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-fade-in-down ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Appointments;
