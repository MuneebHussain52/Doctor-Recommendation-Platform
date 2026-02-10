import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import axios from "axios";

// Define types
interface Appointment {
  id: string;
  appointment_number?: string;
  doctor: string;
  doctor_name: string;
  doctor_specialty: string;
  patient: string;
  patient_name: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  appointment_mode: string;
  status: string;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const itemsPerPage = 10;

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchAppointments();
  }, [searchTerm, filter, dateRange]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("adminToken");

      if (!token) {
        console.log("No token found, redirecting to login");
        navigate("/admin/login");
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (filter !== "all") {
        params.append("status", filter);
      }
      if (dateRange === "today") {
        params.append("date", "today");
      } else if (dateRange === "upcoming") {
        params.append("date", "upcoming");
      }

      const url = `${API_BASE_URL}/admin/appointments/${params.toString() ? "?" + params.toString() : ""}`;
      console.log("Fetching appointments from:", url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data);

      let appointmentsList: Appointment[] = [];

      if (Array.isArray(response.data)) {
        appointmentsList = response.data;
      } else if (response.data.results) {
        appointmentsList = response.data.results;
        setTotalAppointments(response.data.count || appointmentsList.length);
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Unexpected response format from server");
        return;
      }

      console.log("Appointments list:", appointmentsList);
      setAppointments(appointmentsList);
      setTotalAppointments(appointmentsList.length);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log("Authentication error, redirecting to login");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch appointments";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      const token = localStorage.getItem("adminToken");

      await axios.patch(
        `${API_BASE_URL}/admin/appointments/${appointmentId}/update-status/`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      fetchAppointments();
      alert("Appointment status updated successfully");
    } catch (err: any) {
      console.error("Error updating appointment status:", err);
      alert(err.response?.data?.error || "Failed to update appointment status");
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      await axios.delete(
        `${API_BASE_URL}/admin/appointments/${appointmentId}/delete/`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      fetchAppointments();
      alert("Appointment deleted successfully");
    } catch (err: any) {
      console.error("Error deleting appointment:", err);
      alert(err.response?.data?.error || "Failed to delete appointment");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getModeIcon = (mode: string) => {
    return mode === "online" ? "🖥️" : "🏥";
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = appointments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(appointments.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
              <div className="mt-3 flex gap-2">
                <button
                  onClick={fetchAppointments}
                  className="text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
                <button
                  onClick={() => navigate("/admin/login")}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            type="button"
            onClick={fetchAppointments}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search appointments, doctors, or patients"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            filter === "all"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("upcoming")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            filter === "upcoming"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            filter === "completed"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          Completed
        </button>
        <button
          type="button"
          onClick={() => setFilter("cancelled")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            filter === "cancelled"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          Cancelled
        </button>

        <div className="border-l border-gray-300 mx-2"></div>

        <button
          type="button"
          onClick={() => setDateRange("today")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            dateRange === "today"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setDateRange("upcoming")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            dateRange === "upcoming"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => setDateRange("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            dateRange === "all"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          All Dates
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 text-sm text-gray-600">
        Total Appointments:{" "}
        <span className="font-semibold">{totalAppointments}</span>
        {searchTerm && (
          <span className="ml-2">
            • Filtered:{" "}
            <span className="font-semibold">{appointments.length}</span>
          </span>
        )}
      </div>

      {/* Appointments list */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No appointments found</p>
            {(searchTerm || filter !== "all" || dateRange !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                  setDateRange("all");
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentAppointments.map((appointment) => (
              <div key={appointment.id} className="p-5 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appointment.patient_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Dr. {appointment.doctor_name} •{" "}
                          {appointment.doctor_specialty}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {formatDate(appointment.appointment_date)}
                      </span>
                      <span className="flex items-center">
                        ⏰ {formatTime(appointment.appointment_time)}
                      </span>
                      <span className="flex items-center">
                        {getModeIcon(appointment.appointment_mode)}{" "}
                        {appointment.appointment_mode}
                      </span>
                      <span className="text-xs text-gray-400">
                        Type: {appointment.appointment_type}
                      </span>
                    </div>
                    {appointment.reason && (
                      <p className="mt-2 text-sm text-gray-600">
                        Reason: {appointment.reason}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
            aria-label="Pagination"
          >
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, appointments.length)}
                </span>{" "}
                of <span className="font-medium">{appointments.length}</span>{" "}
                results
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Appointments;
