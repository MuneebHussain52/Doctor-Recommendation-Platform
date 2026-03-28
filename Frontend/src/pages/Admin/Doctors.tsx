import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Ban,
  ShieldOff,
  X,
  Eye,
} from "lucide-react";
import axios from "axios";

// Define types
interface Doctor {
  id: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  specialty: string;
  phone: string | null;
  avatar: string | null;
  license_number: string | null;
  years_of_experience: number | null;
  appointment_interval: number;
  created_at: string;
  updated_at: string;
  total_appointments: number;
  is_blocked: boolean;
  block_reason: string | null;
  blocked_at: string | null;
  blocked_by: string | null;
}

interface PaginatedResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Doctor[];
}

const Doctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const itemsPerPage = 10;

  // Block/Unblock states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  useEffect(() => {
    fetchDoctors();
  }, [searchTerm, filter]);

  const fetchDoctors = async () => {
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
        params.append("specialty", filter);
      }

      const url = `${API_BASE_URL}/admin/doctors/${
        params.toString() ? "?" + params.toString() : ""
      }`;
      console.log("Fetching doctors from:", url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data);

      // Handle different response formats
      let doctorsList: Doctor[] = [];

      if (Array.isArray(response.data)) {
        // Direct array response
        doctorsList = response.data;
      } else if (response.data.results) {
        // Paginated response
        doctorsList = response.data.results;
        setTotalDoctors(response.data.count || doctorsList.length);
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Unexpected response format from server");
        return;
      }

      console.log("Doctors list:", doctorsList);
      setDoctors(doctorsList);
      setTotalDoctors(doctorsList.length);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching doctors:", err);
      console.error("Error response:", err.response);

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
          "Failed to fetch doctors";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (doctorId: string) => {
    navigate(`/admin/doctors/${doctorId}`);
  };

  const handleBlockDoctor = async () => {
    if (!blockReason.trim()) {
      showToast("Please provide a reason for blocking this doctor", "error");
      return;
    }

    if (!selectedDoctor) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("adminToken");

      await axios.post(
        `${API_BASE_URL}/admin/doctors/${selectedDoctor.id}/block/`,
        {
          block_reason: blockReason,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setShowBlockModal(false);
      setBlockReason("");
      setSelectedDoctor(null);
      fetchDoctors();
      showToast("Doctor blocked successfully", "success");
    } catch (err: any) {
      console.error("Error blocking doctor:", err);
      showToast(err.response?.data?.error || "Failed to block doctor", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblockDoctor = async () => {
    if (!selectedDoctor) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("adminToken");

      await axios.post(
        `${API_BASE_URL}/admin/doctors/${selectedDoctor.id}/unblock/`,
        {},
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setShowUnblockModal(false);
      setSelectedDoctor(null);
      fetchDoctors();
      showToast("Doctor unblocked successfully", "success");
    } catch (err: any) {
      console.error("Error unblocking doctor:", err);
      showToast(
        err.response?.data?.error || "Failed to unblock doctor",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDoctors = doctors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(doctors.length / itemsPerPage);

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

  // Get unique specialties for filter
  const specialties = Array.from(
    new Set(doctors.map((d) => d.specialty).filter(Boolean))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Loading doctors...</p>
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
                Error Loading Doctors
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={fetchDoctors}
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
        <h1 className="text-2xl font-semibold text-gray-900">Doctors</h1>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            type="button"
            onClick={fetchDoctors}
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
            placeholder="Search doctors by name, email, or specialty"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Specialties</option>
            {specialties.sort().map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 text-sm text-gray-600">
        Total Doctors: <span className="font-semibold">{totalDoctors}</span>
        {searchTerm && (
          <span className="ml-2">
            • Filtered: <span className="font-semibold">{doctors.length}</span>
          </span>
        )}
      </div>

      {/* Doctors list */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        {doctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No doctors found</p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {currentDoctors.map((doctor) => (
                <li
                  key={doctor.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {doctor.avatar ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover"
                          src={doctor.avatar}
                          alt={doctor.full_name}
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center ${
                          doctor.avatar ? "hidden" : ""
                        }`}
                      >
                        <span className="text-blue-600 font-medium text-lg">
                          {doctor.first_name?.charAt(0) || ""}
                          {doctor.last_name?.charAt(0) || ""}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-medium text-blue-600">
                              {doctor.full_name ||
                                `${doctor.first_name} ${doctor.last_name}`}
                            </h2>
                            {doctor.is_blocked && (
                              <>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                                  <Ban className="h-3 w-3 mr-1" />
                                  BLOCKED
                                </span>
                                {doctor.block_reason && (
                                  <button
                                    onClick={() => {
                                      setSelectedDoctor(doctor);
                                      setShowReasonModal(true);
                                    }}
                                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Reason
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {doctor.specialty || "No specialty"}
                            {doctor.years_of_experience &&
                              ` • ${doctor.years_of_experience} years exp`}
                          </p>
                          {doctor.email && (
                            <p className="text-xs text-gray-400 mt-1">
                              {doctor.email}
                              {doctor.phone && ` • ${doctor.phone}`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {doctor.is_blocked ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          )}
                          {doctor.total_appointments > 0 && (
                            <div className="flex items-center ml-4">
                              <span className="text-sm text-gray-500">
                                {doctor.total_appointments} appointments
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewProfile(doctor.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/doctors/${doctor.id}/appointments`)
                          }
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Appointments
                        </button>
                        {doctor.is_blocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowUnblockModal(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Unblock
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowBlockModal(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Block
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
                aria-label="Pagination"
              >
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, doctors.length)}
                    </span>{" "}
                    of <span className="font-medium">{doctors.length}</span>{" "}
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
          </>
        )}
      </div>

      {/* Block Doctor Modal */}
      {showBlockModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Block Doctor
              </h3>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to block Dr.{" "}
              {selectedDoctor.full_name ||
                `${selectedDoctor.first_name} ${selectedDoctor.last_name}`}
              ?
            </p>
            <p className="text-sm text-red-600 mb-4">
              This doctor will not be able to start appointments and will not
              appear in patient searches until unblocked.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Blocking <span className="text-red-500">*</span>
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter reason for blocking this doctor..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockDoctor}
                disabled={submitting || !blockReason.trim()}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Blocking..." : "Block Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Doctor Modal */}
      {showUnblockModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Unblock Doctor
              </h3>
              <button
                onClick={() => setShowUnblockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to unblock Dr.{" "}
              {selectedDoctor.full_name ||
                `${selectedDoctor.first_name} ${selectedDoctor.last_name}`}
              ?
            </p>
            <p className="text-sm text-green-600 mb-4">
              This doctor will be able to start appointments and will appear in
              patient searches again.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUnblockModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnblockDoctor}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Unblocking..." : "Unblock Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Reason Modal */}
      {showReasonModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Block Reason
              </h3>
              <button
                onClick={() => setShowReasonModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <h4 className="text-sm font-medium text-gray-900">Doctor</h4>
              </div>
              <p className="text-sm text-gray-600">
                Dr.{" "}
                {selectedDoctor.full_name ||
                  `${selectedDoctor.first_name} ${selectedDoctor.last_name}`}
              </p>
            </div>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Reason for Blocking
                </h4>
              </div>
              <p className="text-sm text-gray-600 bg-red-50 p-3 rounded border border-red-200">
                {selectedDoctor.block_reason || "No reason provided"}
              </p>
            </div>
            {selectedDoctor.blocked_at && (
              <div className="mb-4">
                <p className="text-xs text-gray-500">
                  Blocked on:{" "}
                  {new Date(selectedDoctor.blocked_at).toLocaleString()}
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

export default Doctors;
