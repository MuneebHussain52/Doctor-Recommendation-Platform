import React, { useEffect, useState } from "react";
import { Users, UserRound, Calendar, AlertCircle } from "lucide-react";

// Define types
interface DashboardStats {
  total_doctors: number;
  total_patients: number;
  total_appointments: number;
  today_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  monthly_appointments: number;
  new_patients_week: number;
  alerts_count: number;
  // Previous period stats for comparison
  prev_total_doctors?: number;
  prev_total_patients?: number;
  prev_total_appointments?: number;
  prev_alerts_count?: number;
}

interface SystemAlert {
  type: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  link: string;
}

interface RecentAppointment {
  id: string;
  doctor_name: string;
  patient_name: string;
  doctor_specialty: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  appointment_mode: string;
  status: string;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  recent_appointments: RecentAppointment[];
  system_alerts: SystemAlert[];
}

// StatCard Component
const StatCard = ({ title, value, change, trend, icon, iconBg }: any) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${iconBg} rounded-md p-3`}>{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change && (
                <div
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend === "up"
                      ? "text-green-600"
                      : trend === "down"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

// AppointmentList Component
const AppointmentList = ({ appointments, limit }: any) => (
  <div className="divide-y divide-gray-200">
    {appointments.slice(0, limit).map((apt: any) => (
      <div key={apt.id} className="p-4 hover:bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {apt.patient_name}
            </p>
            <p className="text-sm text-gray-500">
              Dr. {apt.doctor_name} • {apt.doctor_specialty}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {apt.appointment_date} at {apt.appointment_time}
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              apt.status === "Scheduled"
                ? "bg-blue-100 text-blue-800"
                : apt.status === "Completed"
                ? "bg-green-100 text-green-800"
                : apt.status === "Cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {apt.status}
          </span>
        </div>
      </div>
    ))}
  </div>
);

// AlertsList Component
const AlertsList = ({ alerts }: any) => {
  const formatAlertTime = (timeString: string) => {
    if (!timeString || timeString === "Invalid Date" || timeString === "N/A") {
      return "Recently";
    }

    try {
      const date = new Date(timeString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Recently";
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {alerts.map((alert: any, index: number) => (
        <div key={index} className="p-4 hover:bg-gray-50">
          <div className="flex">
            <div
              className={`flex-shrink-0 ${
                alert.type === "error"
                  ? "text-red-500"
                  : alert.type === "warning"
                  ? "text-yellow-500"
                  : "text-blue-500"
              }`}
            >
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{alert.title}</p>
              <p className="text-sm text-gray-500">{alert.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatAlertTime(alert.time)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("No authentication token found. Please login.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/dashboard/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);

      if (err.message?.includes("401")) {
        setError("Authentication failed. Please login again.");
        window.location.href = "/admin/login";
      } else {
        setError(err.message || "Failed to fetch dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentage change with proper formatting
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) {
      return current > 0 ? `+${current}` : "0";
    }
    const change = ((current - previous) / previous) * 100;
    const formatted = Math.abs(change).toFixed(1);
    return change > 0 ? `+${formatted}%` : change < 0 ? `-${formatted}%` : "0%";
  };

  // Determine trend direction
  const getTrend = (
    current: number,
    previous?: number
  ): "up" | "down" | "neutral" => {
    if (!previous || previous === 0) return current > 0 ? "up" : "neutral";
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "neutral";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { stats, recent_appointments, system_alerts } = dashboardData;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* Stats grid with real percentage changes */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Doctors"
          value={stats.total_doctors.toString()}
          change={calculateChange(
            stats.total_doctors,
            stats.prev_total_doctors
          )}
          trend={getTrend(stats.total_doctors, stats.prev_total_doctors)}
          icon={<UserRound className="h-6 w-6 text-white" />}
          iconBg="bg-blue-500"
        />
        <StatCard
          title="Total Patients"
          value={stats.total_patients.toLocaleString()}
          change={calculateChange(
            stats.total_patients,
            stats.prev_total_patients
          )}
          trend={getTrend(stats.total_patients, stats.prev_total_patients)}
          icon={<Users className="h-6 w-6 text-white" />}
          iconBg="bg-emerald-500"
        />
        <StatCard
          title="Appointments"
          value={stats.total_appointments.toString()}
          change={`Today: ${stats.today_appointments}`}
          trend={stats.today_appointments > 0 ? "up" : "neutral"}
          icon={<Calendar className="h-6 w-6 text-white" />}
          iconBg="bg-indigo-500"
        />
        <StatCard
          title="System Alerts"
          value={stats.alerts_count.toString()}
          change={
            stats.upcoming_appointments > 0
              ? `${stats.upcoming_appointments} upcoming`
              : "No alerts"
          }
          trend={
            stats.alerts_count > 5
              ? "up"
              : stats.alerts_count > 0
              ? "neutral"
              : "down"
          }
          icon={<AlertCircle className="h-6 w-6 text-white" />}
          iconBg="bg-amber-500"
        />
      </div>

      {/* Content grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent appointments */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Appointments
            </h3>
          </div>
          <AppointmentList appointments={recent_appointments} limit={5} />
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
            <a
              href="/admin/appointments"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all appointments
            </a>
          </div>
        </div>

        {/* System alerts */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
          </div>
          <AlertsList alerts={system_alerts} />
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
            <a
              href="/admin/alerts"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all alerts
            </a>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completed_appointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Upcoming Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.upcoming_appointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Cancelled Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.cancelled_appointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
