import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  BarChart2,
  PieChart,
  Download,
  Calendar,
  AlertCircle,
  Loader2,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define types
interface DoctorStats {
  total_doctors: number;
  doctors_by_specialty: Record<string, number>;
  average_experience: number;
}

interface PatientStats {
  total_patients: number;
  new_patients_month: number;
  patients_by_gender: Record<string, number>;
  patients_by_blood_type: Record<string, number>;
}

interface AppointmentStats {
  total_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  today_appointments: number;
  appointments_by_mode: Record<string, number>;
  appointments_by_type: Record<string, number>;
}

interface DoctorPerformance {
  id: string;
  full_name: string;
  specialty: string;
  total_appointments: number;
  years_of_experience: number;
  email: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("overview");
  const [timeFrame, setTimeFrame] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Stats state
  const [doctorStats, setDoctorStats] = useState<DoctorStats | null>(null);
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [appointmentStats, setAppointmentStats] =
    useState<AppointmentStats | null>(null);
  const [topDoctors, setTopDoctors] = useState<DoctorPerformance[]>([]);

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchAllStats();
  }, [timeFrame]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("adminToken");

      if (!token) {
        console.log("No token found, redirecting to login");
        navigate("/admin/login");
        return;
      }

      const headers = {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch all stats in parallel
      const [doctorStatsRes, patientStatsRes, appointmentStatsRes, doctorsRes] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/admin/doctors/stats/`, { headers }),
          axios.get(`${API_BASE_URL}/admin/patients/stats/`, { headers }),
          axios.get(`${API_BASE_URL}/admin/appointments/stats/`, { headers }),
          axios.get(`${API_BASE_URL}/admin/doctors/`, { headers }),
        ]);

      console.log("Doctor Stats:", doctorStatsRes.data);
      console.log("Patient Stats:", patientStatsRes.data);
      console.log("Appointment Stats:", appointmentStatsRes.data);
      console.log("Doctors Response:", doctorsRes.data);

      setDoctorStats(doctorStatsRes.data);
      setPatientStats(patientStatsRes.data);
      setAppointmentStats(appointmentStatsRes.data);

      // Handle different response formats for doctors list
      let doctorsList: DoctorPerformance[] = [];

      if (Array.isArray(doctorsRes.data)) {
        doctorsList = doctorsRes.data;
      } else if (
        doctorsRes.data.results &&
        Array.isArray(doctorsRes.data.results)
      ) {
        doctorsList = doctorsRes.data.results;
      } else {
        console.warn("Unexpected doctors response format:", doctorsRes.data);
        doctorsList = [];
      }

      console.log("Doctors List:", doctorsList);

      // Sort doctors by appointment count for top performers
      const sortedDoctors = [...doctorsList]
        .sort(
          (a, b) => (b.total_appointments || 0) - (a.total_appointments || 0)
        )
        .slice(0, 10);

      console.log("Top Doctors:", sortedDoctors);
      setTopDoctors(sortedDoctors);

      setError(null);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
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
          "Failed to fetch statistics";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportReports = () => {
    setExporting(true);

    try {
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue color
      doc.text("Medical System Analytics Report", 105, yPosition, {
        align: "center",
      });

      yPosition += 10;
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated on: ${currentDate}`, 105, yPosition, {
        align: "center",
      });
      doc.text(
        `Time Frame: ${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}`,
        105,
        yPosition + 6,
        { align: "center" }
      );

      yPosition += 20;

      // System Overview Section
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("System Overview", 14, yPosition);
      yPosition += 8;

      // Overview Statistics Table
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Count"]],
        body: [
          ["Total Doctors", (doctorStats?.total_doctors || 0).toString()],
          ["Total Patients", (patientStats?.total_patients || 0).toString()],
          [
            "Total Appointments",
            (appointmentStats?.total_appointments || 0).toString(),
          ],
          [
            "New Patients (This Month)",
            (patientStats?.new_patients_month || 0).toString(),
          ],
          [
            "Average Doctor Experience",
            `${doctorStats?.average_experience || 0} years`,
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Appointment Statistics Section
      doc.setFontSize(16);
      doc.text("Appointment Statistics", 14, yPosition);
      yPosition += 8;

      autoTable(doc, {
        startY: yPosition,
        head: [["Status", "Count"]],
        body: [
          [
            "Upcoming",
            (appointmentStats?.upcoming_appointments || 0).toString(),
          ],
          [
            "Completed",
            (appointmentStats?.completed_appointments || 0).toString(),
          ],
          [
            "Cancelled",
            (appointmentStats?.cancelled_appointments || 0).toString(),
          ],
          ["Today", (appointmentStats?.today_appointments || 0).toString()],
        ],
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Appointments by Mode
      if (
        appointmentStats?.appointments_by_mode &&
        Object.keys(appointmentStats.appointments_by_mode).length > 0
      ) {
        doc.setFontSize(16);
        doc.text("Appointments by Mode", 14, yPosition);
        yPosition += 8;

        const modeData = Object.entries(
          appointmentStats.appointments_by_mode
        ).map(([mode, count]) => [
          mode.charAt(0).toUpperCase() + mode.slice(1),
          count.toString(),
          `${((count / (appointmentStats?.total_appointments || 1)) * 100).toFixed(1)}%`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Mode", "Count", "Percentage"]],
          body: modeData,
          theme: "grid",
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Appointments by Type
      if (
        appointmentStats?.appointments_by_type &&
        Object.keys(appointmentStats.appointments_by_type).length > 0
      ) {
        doc.setFontSize(16);
        doc.text("Appointments by Type", 14, yPosition);
        yPosition += 8;

        const typeData = Object.entries(
          appointmentStats.appointments_by_type
        ).map(([type, count]) => [
          type.charAt(0).toUpperCase() + type.slice(1),
          count.toString(),
          `${((count / (appointmentStats?.total_appointments || 1)) * 100).toFixed(1)}%`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Type", "Count", "Percentage"]],
          body: typeData,
          theme: "grid",
          headStyles: { fillColor: [245, 158, 11] },
          margin: { left: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // New page for doctor statistics
      doc.addPage();
      yPosition = 20;

      // Top Performing Doctors
      if (topDoctors.length > 0) {
        doc.setFontSize(16);
        doc.text("Top Performing Doctors", 14, yPosition);
        yPosition += 8;

        const doctorData = topDoctors.map((doctor, index) => [
          (index + 1).toString(),
          doctor.full_name,
          doctor.specialty,
          (doctor.years_of_experience || "N/A").toString(),
          (doctor.total_appointments || 0).toString(),
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [
            [
              "Rank",
              "Doctor Name",
              "Specialty",
              "Experience (Years)",
              "Appointments",
            ],
          ],
          body: doctorData,
          theme: "striped",
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Doctors by Specialty
      if (
        doctorStats?.doctors_by_specialty &&
        Object.keys(doctorStats.doctors_by_specialty).length > 0
      ) {
        doc.setFontSize(16);
        doc.text("Doctors by Specialty", 14, yPosition);
        yPosition += 8;

        const specialtyData = Object.entries(
          doctorStats.doctors_by_specialty
        ).map(([specialty, count]) => [
          specialty,
          count.toString(),
          `${((count / (doctorStats?.total_doctors || 1)) * 100).toFixed(1)}%`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Specialty", "Doctor Count", "Percentage"]],
          body: specialtyData,
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Patients by Gender
      if (
        patientStats?.patients_by_gender &&
        Object.keys(patientStats.patients_by_gender).length > 0
      ) {
        doc.setFontSize(16);
        doc.text("Patients by Gender", 14, yPosition);
        yPosition += 8;

        const genderData = Object.entries(patientStats.patients_by_gender).map(
          ([gender, count]) => [
            gender,
            count.toString(),
            `${((count / (patientStats?.total_patients || 1)) * 100).toFixed(1)}%`,
          ]
        );

        autoTable(doc, {
          startY: yPosition,
          head: [["Gender", "Patient Count", "Percentage"]],
          body: genderData,
          theme: "grid",
          headStyles: { fillColor: [236, 72, 153] },
          margin: { left: 14 },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Patients by Blood Type
      if (
        patientStats?.patients_by_blood_type &&
        Object.keys(patientStats.patients_by_blood_type).length > 0
      ) {
        doc.setFontSize(16);
        doc.text("Patients by Blood Type", 14, yPosition);
        yPosition += 8;

        const bloodTypeData = Object.entries(
          patientStats.patients_by_blood_type
        ).map(([bloodType, count]) => [
          bloodType,
          count.toString(),
          `${((count / (patientStats?.total_patients || 1)) * 100).toFixed(1)}%`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Blood Type", "Patient Count", "Percentage"]],
          body: bloodTypeData,
          theme: "grid",
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: 14 },
        });
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
        doc.text("Medical System - Confidential", 14, 290);
      }

      // Save the PDF
      const fileName = `medical-system-report-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      alert("Report exported successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const calculatePerformancePercentage = (
    appointments: number,
    maxAppointments: number
  ) => {
    if (maxAppointments === 0) return 0;
    return Math.min(100, (appointments / maxAppointments) * 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Loading reports...</p>
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
                Error Loading Reports
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={fetchAllStats}
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

  const maxAppointments =
    topDoctors.length > 0
      ? Math.max(...topDoctors.map((d) => d.total_appointments || 0))
      : 1;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Reports & Analytics
        </h1>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            type="button"
            onClick={fetchAllStats}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
            ) : null}
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportReports}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-400" />
            ) : (
              <Download className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            )}
            {exporting ? "Exporting..." : "Export PDF Report"}
          </button>
        </div>
      </div>

      {/* Rest of the component remains the same */}
      {/* Report selector */}
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <div className="sm:flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setReportType("overview")}
              className={`flex items-center px-4 py-2 rounded-md ${
                reportType === "overview"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <LineChart className="h-5 w-5 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setReportType("doctors")}
              className={`flex items-center px-4 py-2 rounded-md ${
                reportType === "doctors"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <BarChart2 className="h-5 w-5 mr-2" />
              Doctor Performance
            </button>
            <button
              onClick={() => setReportType("specialties")}
              className={`flex items-center px-4 py-2 rounded-md ${
                reportType === "specialties"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <PieChart className="h-5 w-5 mr-2" />
              Specialties
            </button>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report content - same as before */}
      <div className="mt-6">
        {reportType === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Doctors
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {doctorStats?.total_doctors || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Patients
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {patientStats?.total_patients || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Appointments
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {appointmentStats?.total_appointments || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      New Patients (Month)
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {patientStats?.new_patients_month || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Status Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Appointment Status Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">Upcoming</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {appointmentStats?.upcoming_appointments || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Scheduled appointments
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {appointmentStats?.completed_appointments || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Successfully completed
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-medium">Cancelled</p>
                  <p className="text-3xl font-bold text-red-900">
                    {appointmentStats?.cancelled_appointments || 0}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Cancelled by patient/doctor
                  </p>
                </div>
              </div>
            </div>

            {/* Appointments by Mode and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Appointments by Mode
                </h2>
                <div className="space-y-3">
                  {appointmentStats?.appointments_by_mode &&
                  Object.entries(appointmentStats.appointments_by_mode).length >
                    0 ? (
                    Object.entries(appointmentStats.appointments_by_mode).map(
                      ([mode, count]) => (
                        <div key={mode}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize font-medium">
                              {mode}
                            </span>
                            <span className="text-gray-500">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(count / (appointmentStats?.total_appointments || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-gray-500">
                      No appointment mode data available
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Appointments by Type
                </h2>
                <div className="space-y-3">
                  {appointmentStats?.appointments_by_type &&
                  Object.entries(appointmentStats.appointments_by_type).length >
                    0 ? (
                    Object.entries(appointmentStats.appointments_by_type).map(
                      ([type, count]) => (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize font-medium">
                              {type}
                            </span>
                            <span className="text-gray-500">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${(count / (appointmentStats?.total_appointments || 1)) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-gray-500">
                      No appointment type data available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === "doctors" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Top Performing Doctors
            </h2>
            {topDoctors.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No doctor data available
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Specialty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topDoctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {doctor.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {doctor.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doctor.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {doctor.specialty}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {doctor.years_of_experience
                              ? `${doctor.years_of_experience} years`
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {doctor.total_appointments || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{
                                width: `${calculatePerformancePercentage(doctor.total_appointments || 0, maxAppointments)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {calculatePerformancePercentage(
                              doctor.total_appointments || 0,
                              maxAppointments
                            ).toFixed(0)}
                            %
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {reportType === "specialties" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Doctor Distribution by Specialty
            </h2>
            {doctorStats?.doctors_by_specialty &&
            Object.keys(doctorStats.doctors_by_specialty).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(doctorStats.doctors_by_specialty).map(
                  ([specialty, count], index) => {
                    const colors = [
                      "bg-blue-500",
                      "bg-green-500",
                      "bg-purple-500",
                      "bg-orange-500",
                      "bg-pink-500",
                      "bg-indigo-500",
                    ];
                    const percentage = (
                      (count / (doctorStats?.total_doctors || 1)) *
                      100
                    ).toFixed(1);
                    return (
                      <div key={specialty}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <div
                              className={`h-4 w-4 rounded ${colors[index % colors.length]} mr-2`}
                            ></div>
                            <span className="text-sm font-medium text-gray-900">
                              {specialty}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                              {count} doctors
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`${colors[index % colors.length]} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                )}

                {/* Summary Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-700">Total Specialties</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {Object.keys(doctorStats.doctors_by_specialty).length}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-700">Avg Experience</p>
                      <p className="text-2xl font-bold text-green-900">
                        {doctorStats.average_experience} years
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No specialty data available
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
