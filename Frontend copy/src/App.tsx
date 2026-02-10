import { AppointmentProvider } from "./context/AppointmentContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import { ProfileProvider } from "./context/ProfileContext";
import { DateTimeFormatProvider } from "./context/DateTimeFormatContext";
import { AuthProvider } from "./context/AuthContext";
import "./styles/modal.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

// Admin Components
import AdminLayout from "./components/Admin/Layout";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminDoctors from "./pages/Admin/Doctors";
import AdminDoctorProfile from "./pages/Admin/DoctorProfile";
import AdminDoctorAppointments from "./pages/Admin/DoctorAppointments";
import AdminPatients from "./pages/Admin/Patients";
import AdminAppointments from "./pages/Admin/Appointments";
import AdminApprovals from "./pages/Admin/Approvals";
import AdminReports from "./pages/Admin/Reports";
import AdminSettings from "./pages/Admin/Settings";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminRegister from "./pages/Admin/AdminRegister";
import AdminProfile from "./pages/Admin/Profile";
import AdminAuditLog from "./pages/Admin/AuditLog";
import Alerts from "./pages/Admin/alerts";
import AdminPatientAppointments from "./pages/Admin/PatientAppointments";
import AdminPayments from "./pages/Admin/Payments";

// Doctor Components
import DoctorLayout from "./components/Doctor/layout/Layout";
import DoctorDashboard from "./pages/Doctor/Dashboard";
import DoctorAppointments from "./pages/Doctor/Appointments";
import DoctorPatients from "./pages/Doctor/Patients";
import DoctorMessages from "./pages/Doctor/Messages";
import DoctorSettings from "./pages/Doctor/Settings";
import DoctorFeedbacks from "./pages/Doctor/Feedbacks";
import DoctorLogin from "./pages/Doctor/Login";
import DoctorRegister from "./pages/Doctor/Register";
import DoctorProfile from "./pages/Doctor/Profile";
import DoctorPayments from "./pages/Doctor/Payments";
import Schedule from "./pages/Doctor/Schedule";

// Patient Components
import PatientLayout from "./components/Patient/layout/Layout";
import PatientDashboard from "./pages/Patient/Dashboard";
import PatientSymptoms from "./pages/Patient/Symptoms";
import PatientRecommendations from "./pages/Patient/Recommendations";
import PatientAppointments from "./pages/Patient/Appointments";
import PatientDocuments from "./pages/Patient/Documents";
import PatientMessages from "./pages/Patient/Messages";
import PatientFeedback from "./pages/Patient/Feedback";
import PatientProfile from "./pages/Patient/Profile";
import PatientLogin from "./pages/Patient/Login";
import PatientRegister from "./pages/Patient/Register";
import PatientPayments from "./pages/Patient/Payments";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

const DashboardSelector = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
    {/* Animated Gradient Mesh Background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent"></div>
      <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent"></div>

      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-400/30 to-teal-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float-delayed"></div>
      <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-br from-orange-400/30 to-pink-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float-slow"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
    </div>

    {/* Main Content */}
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-20 max-w-6xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-white/90 text-sm font-semibold">
            Powered by Advanced AI Technology
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
          <span className="block text-white mb-2">The Future of</span>
          <span className="block bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
            Healthcare
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
          Experience seamless healthcare management powered by AI-driven
          insights, real-time coordination, and compassionate care
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <a
            href="#portals"
            className="group px-8 py-4 bg-white text-gray-900 rounded-full font-bold shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              Explore Portals
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-white mb-2">
              1K+
            </div>
            <div className="text-white/60 text-sm md:text-base">
              Active Patients
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-white mb-2">
              50+
            </div>
            <div className="text-white/60 text-sm md:text-base">
              Expert Doctors
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-white mb-2">
              24/7
            </div>
            <div className="text-white/60 text-sm md:text-base">Support</div>
          </div>
        </div>
      </div>

      {/* Portal Cards */}
      <div
        id="portals"
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full px-4 mb-20"
      >
        {/* Admin Portal */}
        <Link
          to="/admin/login"
          className="group relative bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-xl rounded-3xl border border-orange-500/20 hover:border-orange-400/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>

          <div className="relative p-8 bg-gray-900/40 backdrop-blur-xl rounded-3xl">
            {/* Icon */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <svg
                  className="w-9 h-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>

            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold rounded-full">
                ADMIN
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Admin Portal</h2>

            <p className="text-white/60 mb-6 leading-relaxed text-sm">
              System management, doctor approvals, analytics, and comprehensive
              healthcare oversight
            </p>

            <div className="flex items-center gap-2 text-orange-400 font-semibold group-hover:gap-3 transition-all">
              <span>Enter Portal</span>
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </Link>

        {/* Doctor Portal */}
        <Link
          to="/doctor/login"
          className="group relative bg-gradient-to-br from-cyan-500/10 to-teal-500/10 backdrop-blur-xl rounded-3xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/10 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>

          <div className="relative p-8 bg-gray-900/40 backdrop-blur-xl rounded-3xl">
            {/* Icon */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <svg
                  className="w-9 h-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
            </div>

            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-xs font-bold rounded-full">
                DOCTOR
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Doctor Portal
            </h2>

            <p className="text-white/60 mb-6 leading-relaxed text-sm">
              Patient management, appointments, medical records, and
              professional consultation tools
            </p>

            <div className="flex items-center gap-2 text-cyan-400 font-semibold group-hover:gap-3 transition-all">
              <span>Enter Portal</span>
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </Link>

        {/* Patient Portal */}
        <Link
          to="/patient/login"
          className="group relative bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl rounded-3xl border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/10 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>

          <div className="relative p-8 bg-gray-900/40 backdrop-blur-xl rounded-3xl">
            {/* Icon */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur-md group-hover:blur-lg transition-all duration-500"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <svg
                  className="w-9 h-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                PATIENT
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Patient Portal
            </h2>

            <p className="text-white/60 mb-6 leading-relaxed text-sm">
              AI-powered symptom analysis, smart recommendations, easy booking,
              and health records
            </p>

            <div className="flex items-center gap-2 text-emerald-400 font-semibold group-hover:gap-3 transition-all">
              <span>Enter Portal</span>
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl w-full px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose Us
          </h3>
          <p className="text-white/60 text-lg">
            Comprehensive healthcare features designed for excellence
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-1 text-sm">Secure</h3>
            <p className="text-xs text-white/60">End-to-end encrypted</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-1 text-sm">AI-Powered</h3>
            <p className="text-xs text-white/60">Smart insights</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-1 text-sm">24/7</h3>
            <p className="text-xs text-white/60">Always available</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-1 text-sm">Easy Booking</h3>
            <p className="text-xs text-white/60">Quick access</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-1 text-sm">Analytics</h3>
            <p className="text-xs text-white/60">Data insights</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-white mb-1 text-sm">Messaging</h3>
            <p className="text-xs text-white/60">Direct chat</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Appointments will be loaded from the database via API
// Individual dashboards should fetch their own appointments
const initialAppointments: any[] = [];

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppointmentProvider initial={initialAppointments}>
          <FeedbackProvider>
            <ProfileProvider>
              <DateTimeFormatProvider>
                <Routes>
                  <Route path="/" element={<DashboardSelector />} />

                  {/* Admin Auth Routes - Public */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/register" element={<AdminRegister />} />

                  {/* Doctor Auth Routes - Public */}
                  <Route path="/doctor/login" element={<DoctorLogin />} />
                  <Route path="/doctor/register" element={<DoctorRegister />} />

                  {/* Patient Auth Routes - Public */}
                  <Route path="/patient/login" element={<PatientLogin />} />
                  <Route
                    path="/patient/register"
                    element={<PatientRegister />}
                  />

                  {/* Admin Dashboard Routes - Protected */}
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute requiredUserType="admin">
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="approvals" element={<AdminApprovals />} />
                    <Route path="doctors" element={<AdminDoctors />} />
                    <Route
                      path="doctors/:doctorId"
                      element={<AdminDoctorProfile />}
                    />
                    <Route
                      path="doctors/:doctorId/appointments"
                      element={<AdminDoctorAppointments />}
                    />
                    <Route
                      path="patients/:patientId"
                      element={<AdminPatientAppointments />}
                    />
                    <Route path="patients" element={<AdminPatients />} />
                    <Route
                      path="appointments"
                      element={<AdminAppointments />}
                    />
                    <Route path="audit-log" element={<AdminAuditLog />} />
                    <Route path="alerts" element={<Alerts />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route
                      index
                      element={<Navigate to="dashboard" replace />}
                    />
                  </Route>

                  {/* Doctor Dashboard Routes - Protected */}
                  <Route
                    path="/doctor/*"
                    element={
                      <ProtectedRoute requiredUserType="doctor">
                        <DoctorLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<DoctorDashboard />} />
                    <Route
                      path="appointments"
                      element={<DoctorAppointments />}
                    />
                    <Route path="patients" element={<DoctorPatients />} />
                    <Route path="messages" element={<DoctorMessages />} />
                    <Route path="settings" element={<DoctorSettings />} />
                    <Route path="feedbacks" element={<DoctorFeedbacks />} />
                    <Route path="payments" element={<DoctorPayments />} />
                    <Route path="profile" element={<DoctorProfile />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route
                      index
                      element={<Navigate to="dashboard" replace />}
                    />
                  </Route>

                  {/* Patient Dashboard Routes - Protected */}
                  <Route
                    path="/patient/*"
                    element={
                      <ProtectedRoute requiredUserType="patient">
                        <PatientLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="symptoms" element={<PatientSymptoms />} />
                    <Route
                      path="recommendations"
                      element={<PatientRecommendations />}
                    />
                    <Route
                      path="appointments"
                      element={<PatientAppointments />}
                    />
                    <Route path="documents" element={<PatientDocuments />} />
                    <Route path="messages" element={<PatientMessages />} />
                    <Route path="feedback" element={<PatientFeedback />} />
                    <Route path="payments" element={<PatientPayments />} />
                    <Route path="profile" element={<PatientProfile />} />
                    <Route
                      index
                      element={<Navigate to="dashboard" replace />}
                    />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </DateTimeFormatProvider>
            </ProfileProvider>
          </FeedbackProvider>
        </AppointmentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
