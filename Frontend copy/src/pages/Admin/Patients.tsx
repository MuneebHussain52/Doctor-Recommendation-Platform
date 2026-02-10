import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  Loader2,
} from "lucide-react";
import axios from "axios";

// Define types
interface Patient {
  id: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  avatar: string | null;
  blood_type: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
  total_appointments: number;
  age: number | null;
}

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const itemsPerPage = 10;

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, filter]);

  const fetchPatients = async () => {
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
      if (filter === "new") {
        params.append("filter", "new");
      }

      const url = `${API_BASE_URL}/admin/patients/${
        params.toString() ? "?" + params.toString() : ""
      }`;
      console.log("Fetching patients from:", url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data);

      // Handle different response formats
      let patientsList: Patient[] = [];

      if (Array.isArray(response.data)) {
        patientsList = response.data;
      } else if (response.data.results) {
        patientsList = response.data.results;
        setTotalPatients(response.data.count || patientsList.length);
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Unexpected response format from server");
        return;
      }

      console.log("Patients list:", patientsList);
      setPatients(patientsList);
      setTotalPatients(patientsList.length);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching patients:", err);
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
          "Failed to fetch patients";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (
    patientId: string,
    patientName: string
  ) => {
    if (!window.confirm(`Are you sure you want to delete ${patientName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      await axios.delete(
        `${API_BASE_URL}/admin/patients/${patientId}/delete/`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      fetchPatients();
      alert("Patient deleted successfully");
    } catch (err: any) {
      console.error("Error deleting patient:", err);
      alert(err.response?.data?.error || "Failed to delete patient");
    }
  };

  const handleViewProfile = (patientId: string) => {
    navigate(`/admin/patients/${patientId}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = patients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(patients.length / itemsPerPage);

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
        <p className="text-gray-600">Loading patients...</p>
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
                Error Loading Patients
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={fetchPatients}
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
        <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            type="button"
            onClick={fetchPatients}
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
            placeholder="Search patients by name, email, or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="inline-flex rounded-md items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === "all"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("new")}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === "new"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            New This Week
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 text-sm text-gray-600">
        Total Patients: <span className="font-semibold">{totalPatients}</span>
        {searchTerm && (
          <span className="ml-2">
            • Filtered: <span className="font-semibold">{patients.length}</span>
          </span>
        )}
      </div>

      {/* Patients table */}
      <div className="mt-6 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            {patients.length === 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-12 text-center">
                <p className="text-gray-500 text-lg">No patients found</p>
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
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Contact
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Demographics
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Medical Info
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        History
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {patient.avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={patient.avatar}
                                  alt={patient.full_name}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                              ) : null}
                              <div
                                className={`h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ${
                                  patient.avatar ? "hidden" : ""
                                }`}
                              >
                                <span className="text-blue-600 font-medium">
                                  {patient.first_name?.charAt(0) || ""}
                                  {patient.last_name?.charAt(0) || ""}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {patient.full_name ||
                                  `${patient.first_name} ${patient.last_name}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {patient.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patient.email || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.phone || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            DOB: {formatDate(patient.date_of_birth)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.gender || "N/A"} • Age:{" "}
                            {patient.age || calculateAge(patient.date_of_birth)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Blood Type: {patient.blood_type || "N/A"}
                          </div>
                          {patient.emergency_contact_name && (
                            <div className="text-sm text-gray-500">
                              Emergency: {patient.emergency_contact_name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {patient.total_appointments} appointment
                            {patient.total_appointments !== 1 ? "s" : ""}
                          </div>
                          <div className="text-sm text-gray-500">
                            Joined: {formatDate(patient.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewProfile(patient.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              handleDeletePatient(
                                patient.id,
                                patient.full_name ||
                                  `${patient.first_name} ${patient.last_name}`
                              )
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="bg-white px-4 py-3 flex items-center justify-between border-b border-t border-gray-200 sm:px-6 mt-4"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastItem, patients.length)}
              </span>{" "}
              of <span className="font-medium">{patients.length}</span> results
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
  );
};

export default Patients;
