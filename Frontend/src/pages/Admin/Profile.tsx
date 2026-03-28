import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Lock,
  Save,
  AlertCircle,
  Loader2,
  Camera,
  CheckCircle,
} from "lucide-react";
import axios from "axios";

interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  department: string | null;
  notes: string | null;
  profile_picture: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  login_count: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Profile data
  const [profile, setProfile] = useState<AdminProfile | undefined>(undefined);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    department: "",
    notes: "",
  });

  // Profile picture
  const [profilePicture, setProfilePicture] = useState<File | undefined>(
    undefined
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState("");

  // Password data
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const API_BASE_URL = "http://127.0.0.1:8000/api";
  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      if (!token) {
        console.log("No token found, redirecting to login");
        navigate("/admin/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/profile/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Profile data:", response.data);
      setProfile(response.data);

      // Set form data
      setFormData({
        full_name: response.data.full_name || "",
        phone_number: response.data.phone_number || "",
        department: response.data.department || "",
        notes: response.data.notes || "",
      });

      // Set profile picture preview with full URL
      if (response.data.profile_picture) {
        if (
          response.data.profile_picture.startsWith("/media/") ||
          response.data.profile_picture.startsWith("media/")
        ) {
          setProfilePicturePreview(
            `${BASE_URL}${response.data.profile_picture.startsWith("/") ? "" : "/"}${response.data.profile_picture}`
          );
        } else if (response.data.profile_picture.startsWith("http")) {
          setProfilePicturePreview(response.data.profile_picture);
        } else {
          setProfilePicturePreview(
            `${BASE_URL}/${response.data.profile_picture}`
          );
        }
      } else {
        setProfilePicturePreview("");
      }

      // Update localStorage with latest profile data
      localStorage.setItem("adminUser", JSON.stringify(response.data));

      setError("");
    } catch (err: any) {
      console.error("Error fetching profile:", err);

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
          "Failed to fetch profile";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("File must be an image");
        return;
      }

      setProfilePicture(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("adminToken");

      // Use FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("full_name", formData.full_name);
      if (formData.phone_number)
        formDataToSend.append("phone_number", formData.phone_number);
      if (formData.department)
        formDataToSend.append("department", formData.department);
      if (formData.notes) formDataToSend.append("notes", formData.notes);
      if (profilePicture)
        formDataToSend.append("profile_picture", profilePicture);

      console.log("Updating profile with data:", {
        full_name: formData.full_name,
        has_picture: !!profilePicture,
      });

      const response = await axios.put(
        `${API_BASE_URL}/admin/profile/`,
        formDataToSend,
        {
          headers: {
            Authorization: `Token ${token}`,
            // Don't set Content-Type, let browser set it with boundary for multipart
          },
        }
      );

      console.log("Profile update response:", response.data);

      // Extract user data from response
      const updatedUser = response.data.user || response.data;

      setProfile(updatedUser);
      setSuccess("Profile updated successfully!");

      // Update localStorage with the new profile data
      localStorage.setItem("adminUser", JSON.stringify(updatedUser));

      // Clear profile picture file after successful upload
      setProfilePicture(undefined);

      // Trigger a storage event to notify other components (like Layout)
      window.dispatchEvent(new Event("storage"));

      // Also dispatch a custom event for immediate update
      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: updatedUser,
        })
      );

      // Refresh profile data after a short delay to ensure server has processed
      setTimeout(() => {
        fetchProfile();
      }, 500);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      console.error("Error response:", err.response?.data);

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (typeof err.response?.data === "object"
          ? JSON.stringify(err.response?.data)
          : err.message) ||
        "Failed to update profile";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // Validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("New passwords do not match");
      setSaving(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError("Password must be at least 8 characters long");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      const response = await axios.post(
        `${API_BASE_URL}/admin/change-password/`,
        {
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Password changed:", response.data);
      setSuccess("Password changed successfully!");

      // Clear password fields
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });

      // Optional: Log out user and redirect to login
      setTimeout(() => {
        setSuccess("Password changed! Redirecting to login...");
        setTimeout(() => {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          navigate("/admin/login");
        }, 2000);
      }, 1000);
    } catch (err: any) {
      console.error("Error changing password:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})
          .flat()
          .join(", ") ||
        err.message ||
        "Failed to change password";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Profile
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={fetchProfile}
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Profile Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
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

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="inline-block h-5 w-5 mr-2" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === "password"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Lock className="inline-block h-5 w-5 mr-2" />
              Change Password
            </button>
          </nav>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && profile && (
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleProfileUpdate}>
            {/* Profile Picture */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Profile Picture
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                      key={profilePicturePreview}
                      onError={(e) => {
                        console.error(
                          "Error loading image:",
                          profilePicturePreview
                        );
                        const target = e.currentTarget;
                        target.style.display = "none";
                        // Show fallback
                        const fallback = target.nextElementSibling;
                        if (
                          fallback &&
                          fallback.classList.contains("fallback-avatar")
                        ) {
                          (fallback as HTMLElement).style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200 fallback-avatar ${profilePicturePreview ? "hidden" : ""}`}
                  >
                    <User className="h-12 w-12 text-blue-600" />
                  </div>
                  <label
                    htmlFor="profile-picture"
                    className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </label>
                  <input
                    type="file"
                    id="profile-picture"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Click the camera icon to upload a new profile picture
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                  {profilePicture && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ New image selected: {profilePicture.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        profile.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {profile.is_active ? "Active" : "Inactive"}
                    </span>
                    {profile.is_superuser && (
                      <span className="px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800">
                        Superuser
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone_number"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., IT Department"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Notes
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Additional notes or information..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Account Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium">
                    Date Joined
                  </p>
                  <p className="text-lg font-semibold text-blue-900 mt-1">
                    {formatDate(profile.date_joined)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">
                    Last Login
                  </p>
                  <p className="text-lg font-semibold text-green-900 mt-1">
                    {formatDate(profile.last_login)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-700 font-medium">
                    Total Logins
                  </p>
                  <p className="text-lg font-semibold text-purple-900 mt-1">
                    {profile.login_count}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handlePasswordUpdate}>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change Password
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Ensure your account is using a long, random password to stay
                secure.
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="old_password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="old_password"
                      name="old_password"
                      value={passwordData.old_password}
                      onChange={handlePasswordChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new_password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Min. 8 characters"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Security Notice
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    After changing your password, you will be logged out and
                    need to sign in again with your new password.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="-ml-1 mr-2 h-5 w-5" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
