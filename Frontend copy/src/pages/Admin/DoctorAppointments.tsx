import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Loader2,
  AlertCircle,
  X,
  Edit,
  Eye,
  Ban,
} from "lucide-react";
import axios from "axios";
import RescheduleModal from "../../components/Doctor/Dashboard/RescheduleModal";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  specialty: string;
}

interface Appointment {
  id: string;
  patient: Patient;
  doctor: Doctor;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  appointment_mode: string;
  location: {
    id: string;
    name: string;
    address: string;
  } | null;
  status: string;
  symptoms: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  reschedule_reason?: string;
  rescheduled_by?: string;
  created_at: string;
}

const DoctorAppointments = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "upcoming" | "completed" | "cancelled"
  >("upcoming");

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const API_BASE_URL = "http://127.0.0.1:8000";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  useEffect(() => {
    fetchDoctorInfo();
    fetchAppointments();
  }, [doctorId]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, activeTab]);

  const fetchDoctorInfo = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/doctors/${doctorId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      setDoctor(response.data);
    } catch (err: any) {
      console.error("Error fetching doctor:", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/doctors/${doctorId}/appointments/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      setAppointments(response.data);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to fetch appointments"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    const filtered = appointments.filter((apt) => apt.status === activeTab);
    setFilteredAppointments(filtered);
  };

  // COMMENTED OUT - Cancel functionality
  // const handleCancelAppointment = async () => {
  //   if (!cancelReason.trim()) {
  //     showToast('Please provide a cancellation reason', 'error');
  //     return;
  //   }

  //   if (!selectedAppointment) return;

  //   try {
  //     setSubmitting(true);
  //     const token = localStorage.getItem('adminToken');

  //     await axios.post(
  //       `${API_BASE_URL}/api/admin/appointments/${selectedAppointment.id}/cancel/`,
  //       {
  //         cancellation_reason: cancelReason,
  //         cancelled_by: 'admin',
  //       },
  //       {
  //         headers: {
  //           Authorization: `Token ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );

  //     setShowCancelModal(false);
  //     setCancelReason('');
  //     setSelectedAppointment(null);
  //     fetchAppointments();
  //     showToast('Appointment cancelled successfully', 'success');
  //   } catch (err: any) {
  //     console.error('Error cancelling appointment:', err);
  //     showToast(err.response?.data?.error || 'Failed to cancel appointment', 'error');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  // REMOVED - Reschedule functionality
  // const handleRescheduleAppointment = async (
  //   date: string,
  //   time: string,
  //   mode: string,
  //   reason?: string,
  //   locationId?: string,
  //   rescheduleReason?: string
  // ) => {
  //   if (!rescheduleReason || !rescheduleReason.trim()) {
  //     showToast('Please provide a reschedule reason', 'error');
  //     return;
  //   }

  //   if (!date || !time) {
  //     showToast('Please select both date and time', 'error');
  //     return;
  //   }

  //   if (!selectedAppointment) return;

  //   try {
  //     setSubmitting(true);
  //     const token = localStorage.getItem('adminToken');

  //     await axios.post(
  //       `${API_BASE_URL}/api/admin/appointments/${selectedAppointment.id}/reschedule/`,
  //       {
  //         new_date: date,
  //         new_time: time,
  //         reschedule_reason: rescheduleReason,
  //         rescheduled_by: 'admin',
  //       },
  //       {
  //         headers: {
  //           Authorization: `Token ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );

  //     setShowRescheduleModal(false);
  //     setSelectedAppointment(null);
  //     fetchAppointments();
  //     showToast('Appointment rescheduled successfully', 'success');
  //   } catch (err: any) {
  //     console.error('Error rescheduling appointment:', err);
  //     showToast(err.response?.data?.error || 'Failed to reschedule appointment', 'error');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Appointments
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={() => navigate("/admin/doctors")}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500 underline"
              >
                Back to Doctors
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/doctors")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Doctors
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {doctor
              ? `Dr. ${doctor.full_name || `${doctor.first_name} ${doctor.last_name}`}`
              : "Doctor"}{" "}
            - Appointments
          </h1>
          {doctor && (
            <p className="text-sm text-gray-600 mt-1">{doctor.specialty}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`${
              activeTab === "upcoming"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Upcoming (
            {appointments.filter((a) => a.status === "upcoming").length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`${
              activeTab === "completed"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Completed (
            {appointments.filter((a) => a.status === "completed").length})
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`${
              activeTab === "cancelled"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Cancelled (
            {appointments.filter((a) => a.status === "cancelled").length})
          </button>
        </nav>
      </div>

      {/* Appointments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {activeTab} appointments
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no {activeTab} appointments for this doctor.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <li key={appointment.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-sm font-medium text-gray-900">
                          {appointment.patient.first_name}{" "}
                          {appointment.patient.last_name}
                        </h3>
                        {appointment.cancelled_by === "admin" && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Cancelled by Admin
                          </span>
                        )}
                        {appointment.rescheduled_by === "admin" &&
                          appointment.reschedule_reason && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Rescheduled by Admin
                            </span>
                          )}
                        {appointment.rescheduled_by === "doctor" &&
                          appointment.reschedule_reason && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Rescheduled by Doctor
                            </span>
                          )}
                        {appointment.rescheduled_by === "patient" &&
                          appointment.reschedule_reason && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Rescheduled by Patient
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Display appointment status */}
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                            appointment.status === "upcoming"
                              ? "bg-blue-100 text-blue-800"
                              : appointment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </span>

                        {/* REMOVED - Reschedule and Cancel buttons */}
                        {/* {activeTab === 'upcoming' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowRescheduleModal(true);
                              }}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowCancelModal(true);
                              }}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Cancel
                            </button>
                          </>
                        )} */}
                        {(appointment.cancellation_reason ||
                          appointment.reschedule_reason) && (
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowReasonModal(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Reason
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(appointment.appointment_date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(appointment.appointment_time)}
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.appointment_mode === "online"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {appointment.appointment_mode === "online"
                            ? "🌐 Online"
                            : "🏥 In-Person"}
                        </span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="truncate">
                            {appointment.location.name}
                          </span>
                        </div>
                      )}
                    </div>
                    {appointment.symptoms && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Symptoms:</span>{" "}
                        {appointment.symptoms}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* COMMENTED OUT - Cancel Modal */}
      {/* {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Patient: {selectedAppointment.patient.first_name} {selectedAppointment.patient.last_name}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Date: {formatDate(selectedAppointment.appointment_date)} at {formatTime(selectedAppointment.appointment_time)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reason for cancellation..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={submitting || !cancelReason.trim()}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* REMOVED - Reschedule Modal */}
      {/* {showRescheduleModal && selectedAppointment && (
        <RescheduleModal
          open={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedAppointment(null);
          }}
          appointment={{
            id: selectedAppointment.id,
            patient: {
              id: parseInt(selectedAppointment.patient.id) || 0,
              name: `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}`,
              avatar: undefined,
            },
            doctor: {
              id: parseInt(selectedAppointment.doctor.id) || 0,
            },
            date: selectedAppointment.appointment_date,
            time: selectedAppointment.appointment_time,
            type: selectedAppointment.appointment_type,
            location: selectedAppointment.location?.name || '',
            mode: selectedAppointment.appointment_mode,
            status: selectedAppointment.status as 'upcoming' | 'completed' | 'cancelled',
            reason: selectedAppointment.symptoms,
          }}
          onSubmit={handleRescheduleAppointment}
          isFollowUp={false}
          doctorId={selectedAppointment.doctor.id}
        />
      )} */}

      {/* View Reason Modal */}
      {showReasonModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reason Details
              </h3>
              <button
                onClick={() => setShowReasonModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {selectedAppointment.cancellation_reason && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    Cancellation Reason
                  </h4>
                  {selectedAppointment.cancelled_by === "admin" && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Cancelled by Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedAppointment.cancellation_reason}
                </p>
              </div>
            )}
            {selectedAppointment.reschedule_reason && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    Reschedule Reason
                  </h4>
                  {selectedAppointment.rescheduled_by === "admin" && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Rescheduled by Admin
                    </span>
                  )}
                  {selectedAppointment.rescheduled_by === "doctor" && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Rescheduled by Doctor
                    </span>
                  )}
                  {selectedAppointment.rescheduled_by === "patient" && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Rescheduled by Patient
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedAppointment.reschedule_reason}
                </p>
              </div>
            )}
            <button
              onClick={() => setShowReasonModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div
            className={`rounded-lg shadow-lg p-4 ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
