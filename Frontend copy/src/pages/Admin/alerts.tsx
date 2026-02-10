import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Info,
  XCircle,
  Search,
  Filter,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Define types
interface SystemAlert {
  id?: string;
  type: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  link: string;
  severity?: "info" | "warning" | "error" | "success";
  read?: boolean;
}

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "info" | "warning" | "error" | "success"
  >("all");

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchQuery, filterType]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("No authentication token found. Please login.");
        navigate("/admin/login");
        return;
      }

      // Fetch alerts from dashboard endpoint
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Add unique IDs and severity to alerts if not present
      const alertsWithMetadata = response.data.system_alerts.map(
        (alert: SystemAlert, index: number) => ({
          ...alert,
          id: alert.id || `alert-${index}`,
          severity: alert.severity || inferSeverity(alert.type, alert.title),
          read: false,
        })
      );

      setAlerts(alertsWithMetadata);
    } catch (err: any) {
      console.error("Error fetching alerts:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError(err.response?.data?.error || "Failed to fetch alerts");
      }
    } finally {
      setLoading(false);
    }
  };

  const inferSeverity = (
    type: string,
    title: string
  ): "info" | "warning" | "error" | "success" => {
    const lowerType = type.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (
      lowerType.includes("error") ||
      lowerTitle.includes("error") ||
      lowerTitle.includes("failed")
    ) {
      return "error";
    }
    if (
      lowerType.includes("warning") ||
      lowerTitle.includes("warning") ||
      lowerTitle.includes("pending")
    ) {
      return "warning";
    }
    if (
      lowerType.includes("success") ||
      lowerTitle.includes("success") ||
      lowerTitle.includes("completed")
    ) {
      return "success";
    }
    return "info";
  };

  const filterAlerts = () => {
    let filtered = alerts;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (alert) =>
          alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((alert) => alert.severity === filterType);
    }

    setFilteredAlerts(filtered);
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getIconColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "success":
        return "text-green-600";
      default:
        return "text-blue-600";
    }
  };

  const formatTime = (timeString: string) => {
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

  const handleAlertClick = (alert: SystemAlert) => {
    if (alert.link && alert.link !== "#") {
      navigate(alert.link);
    }
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map((alert) => ({ ...alert, read: true })));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading alerts...</p>
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
                Error Loading Alerts
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchAlerts}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-7 w-7 text-blue-600" />
            System Alerts
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all system notifications
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAlerts}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh
          </button>
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Alerts
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {alerts.length}
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
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Errors
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {alerts.filter((a) => a.severity === "error").length}
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
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Warnings
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {alerts.filter((a) => a.severity === "warning").length}
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
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Info
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {alerts.filter((a) => a.severity === "info").length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filterType === "all"
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("error")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filterType === "error"
                  ? "bg-red-100 text-red-700 border-2 border-red-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Errors
            </button>
            <button
              onClick={() => setFilterType("warning")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filterType === "warning"
                  ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Warnings
            </button>
            <button
              onClick={() => setFilterType("info")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filterType === "info"
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Info
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white shadow rounded-lg">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No alerts found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterType !== "all"
                ? "Try adjusting your search or filter."
                : "There are no system alerts at this time."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <li
                key={alert.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  alert.link && alert.link !== "#" ? "cursor-pointer" : ""
                }`}
                onClick={() => handleAlertClick(alert)}
              >
                <div
                  className={`flex gap-4 p-4 rounded-lg border ${getAlertColor(
                    alert.severity || "info"
                  )}`}
                >
                  <div
                    className={`flex-shrink-0 ${getIconColor(
                      alert.severity || "info"
                    )}`}
                  >
                    {getAlertIcon(alert.severity || "info")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold">{alert.title}</h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(alert.time)}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Alerts;
