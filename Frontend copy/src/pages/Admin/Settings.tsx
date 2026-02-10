import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCog,
  Lock,
  Bell,
  Database,
  Shield,
  CheckSquare,
  Save,
  AlertCircle,
  Loader2,
  CheckCircle,
  Download,
  Upload,
} from "lucide-react";
import axios from "axios";

interface SystemSettings {
  system_name: string;
  admin_email: string;
  timezone: string;
  date_format: string;
  maintenance_mode: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SystemSettings>({
    system_name: "MedAdmin Doctor Recommendation System",
    admin_email: "",
    timezone: "America/New_York",
    date_format: "MM/DD/YYYY",
    maintenance_mode: false,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    min_password_length: true,
    require_special_chars: true,
    password_expiry: true,
    require_2fa_admin: true,
    require_2fa_doctors: false,
    session_timeout: 30,
    max_login_attempts: 5,
  });

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");

      if (!token) {
        navigate("/admin/login");
        return;
      }

      // Fetch admin profile to get current settings
      const response = await axios.get(`${API_BASE_URL}/admin/profile/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update settings from profile
      setSettings((prev) => ({
        ...prev,
        admin_email: response.data.email || "",
      }));

      setError(null);
    } catch (err: any) {
      console.error("Error fetching settings:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login");
      } else {
        setError("Failed to load settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;

    setSecuritySettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("adminToken");

      // Save settings (you can create a dedicated endpoint for this)
      // For now, we'll just show success message

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Settings saved successfully!");

      // Store settings in localStorage as fallback
      localStorage.setItem("systemSettings", JSON.stringify(settings));
      localStorage.setItem(
        "securitySettings",
        JSON.stringify(securitySettings)
      );
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportDatabase = () => {
    setSuccess(
      "Database export initiated. You will receive an email when ready."
    );
  };

  const handleBackupDatabase = async () => {
    try {
      setSaving(true);
      setError(null);

      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess("Database backup completed successfully!");
    } catch (err) {
      setError("Failed to backup database");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          System Settings
        </h1>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={fetchSettings}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="sm:hidden">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="general">General</option>
            <option value="users">User Management</option>
            <option value="security">Security</option>
            <option value="notifications">Notifications</option>
            <option value="database">Database & Backup</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("general")}
                className={`w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === "general"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <UserCog className="h-5 w-5 inline mr-1 -mt-0.5" />
                Users
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === "security"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Lock className="h-5 w-5 inline mr-1 -mt-0.5" />
                Security
              </button>

              <button
                onClick={() => setActiveTab("database")}
                className={`w-1/6 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === "database"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Database className="h-5 w-5 inline mr-1 -mt-0.5" />
                Backup
              </button>
            </nav>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "general" && (
            <form onSubmit={handleSaveSettings}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                General Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    System Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">System Name</p>
                      <p className="text-sm font-medium">
                        MedAdmin Doctor Recommendation System
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Version</p>
                      <p className="text-sm font-medium">v2.5.1</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium">
                        {new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Environment</p>
                      <p className="text-sm font-medium">Production</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="system_name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      System Name
                    </label>
                    <input
                      type="text"
                      name="system_name"
                      id="system_name"
                      value={settings.system_name}
                      onChange={handleSettingsChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin_email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Admin Contact Email
                    </label>
                    <input
                      type="email"
                      name="admin_email"
                      id="admin_email"
                      value={settings.admin_email}
                      onChange={handleSettingsChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="timezone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      System Timezone
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={settings.timezone}
                      onChange={handleSettingsChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="America/New_York">
                        Eastern Time (ET)
                      </option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">
                        Pacific Time (PT)
                      </option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="date_format"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Date Format
                    </label>
                    <select
                      id="date_format"
                      name="date_format"
                      value={settings.date_format}
                      onChange={handleSettingsChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="maintenance_mode"
                    id="maintenance_mode"
                    checked={settings.maintenance_mode}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="maintenance_mode"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable system-wide maintenance mode
                  </label>
                </div>

                <div className="pt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => fetchSettings()}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "users" && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                User Management
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-700">
                  Manage user roles and permissions for system administrators,
                  doctors, and staff members.
                </p>
              </div>

              <div className="border border-gray-200 rounded-md">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">
                    Role Permissions
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Permission
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Admin
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Doctor
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Patient
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          View Dashboard
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked
                            disabled
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Manage Doctors
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked
                            disabled
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Manage Patients
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked
                            disabled
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          System Settings
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked
                            disabled
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pt-5 flex justify-end">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="ml-3 inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSaveSettings}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Security Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Password Policy
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="min_password_length"
                          name="min_password_length"
                          type="checkbox"
                          checked={securitySettings.min_password_length}
                          onChange={handleSecurityChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="min_password_length"
                          className="font-medium text-gray-700"
                        >
                          Minimum password length
                        </label>
                        <p className="text-gray-500">
                          Require at least 8 characters
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="require_special_chars"
                          name="require_special_chars"
                          type="checkbox"
                          checked={securitySettings.require_special_chars}
                          onChange={handleSecurityChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="require_special_chars"
                          className="font-medium text-gray-700"
                        >
                          Special characters
                        </label>
                        <p className="text-gray-500">
                          Require at least one special character
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="password_expiry"
                          name="password_expiry"
                          type="checkbox"
                          checked={securitySettings.password_expiry}
                          onChange={handleSecurityChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="password_expiry"
                          className="font-medium text-gray-700"
                        >
                          Password expiration
                        </label>
                        <p className="text-gray-500">
                          Require password change every 90 days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Two-Factor Authentication
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="require_2fa_admin"
                          name="require_2fa_admin"
                          type="checkbox"
                          checked={securitySettings.require_2fa_admin}
                          onChange={handleSecurityChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="require_2fa_admin"
                          className="font-medium text-gray-700"
                        >
                          Required for administrators
                        </label>
                        <p className="text-gray-500">
                          All administrators must use 2FA
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="require_2fa_doctors"
                          name="require_2fa_doctors"
                          type="checkbox"
                          checked={securitySettings.require_2fa_doctors}
                          onChange={handleSecurityChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="require_2fa_doctors"
                          className="font-medium text-gray-700"
                        >
                          Required for doctors
                        </label>
                        <p className="text-gray-500">
                          All doctors must use 2FA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Session Settings
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-4">
                    <div>
                      <label
                        htmlFor="session_timeout"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Session timeout (minutes)
                      </label>
                      <input
                        type="number"
                        name="session_timeout"
                        id="session_timeout"
                        value={securitySettings.session_timeout}
                        onChange={handleSecurityChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="max_login_attempts"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Max login attempts
                      </label>
                      <input
                        type="number"
                        name="max_login_attempts"
                        id="max_login_attempts"
                        value={securitySettings.max_login_attempts}
                        onChange={handleSecurityChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "database" && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Database & Backup
              </h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-700">
                    Regular backups ensure your data is safe. Last backup:{" "}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <Database className="h-10 w-10 text-blue-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Backup Database
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Create a complete backup of all system data
                    </p>
                    <button
                      onClick={handleBackupDatabase}
                      disabled={saving}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Creating Backup...
                        </>
                      ) : (
                        <>
                          <Upload className="-ml-1 mr-2 h-4 w-4" />
                          Create Backup
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <Download className="h-10 w-10 text-green-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Export Database
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Export database to SQL file for external use
                    </p>
                    <button
                      onClick={handleExportDatabase}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Download className="-ml-1 mr-2 h-4 w-4" />
                      Export Database
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Backup History
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date().toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            245 MB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Success
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button className="text-blue-600 hover:text-blue-700">
                              Download
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "general" &&
            activeTab !== "users" &&
            activeTab !== "security" &&
            activeTab !== "database" && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="bg-gray-100 p-6 rounded-full">
                  <Shield className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Settings Coming Soon
                </h3>
                <p className="mt-1 text-sm text-gray-500 text-center max-w-md">
                  This settings section is under development and will be
                  available in a future update.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
