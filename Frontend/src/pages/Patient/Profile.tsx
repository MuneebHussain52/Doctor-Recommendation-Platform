import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Save, Lock, Eye, EyeOff, X } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDateTimeFormat } from "../../context/DateTimeFormatContext";
import { useAuth } from "../../context/AuthContext";

// Helper function to get translated display value for specific fields (only for display, not storage)
const getTranslatedDisplayValue = (
  field: string,
  value: string,
  t: (key: string) => string
): string => {
  // Only translate specific field values for display
  const translations: { [key: string]: { [value: string]: string } } = {
    gender: {
      Female: t("profile.female"),
      Male: t("profile.male"),
      Other: t("profile.other"),
    },
  };

  return translations[field]?.[value] || value;
};

interface OutletContextType {
  profileName: string;
  setProfileName: (name: string) => void;
  profileAvatar: string;
  setProfileAvatar: (avatar: string) => void;
  refreshNotifications: () => void;
}

const Profile = () => {
  const { patient } = useAuth();
  const { setProfileName, setProfileAvatar, refreshNotifications } =
    useOutletContext<OutletContextType>();
  const { t } = useLanguage();
  const { setTimeFormat, setDateFormat } = useDateTimeFormat();

  const [profilePic, setProfilePic] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPicModal, setShowPicModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
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

  // Initialize profile data from authenticated patient
  const [profileData, setProfileData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    age: 0,
    gender: "",
    emergencyContact: "",
    emergencyContactName: "",
    bloodType: "",
    allergies: "",
    medicalConditions: "",
    emailNotifications: true,
    smsNotifications: true,
    marketingEmails: false,
    timeFormat: "12h",
    dateFormat: "MM-DD-YYYY",
  });
  const [originalProfile, setOriginalProfile] = useState(profileData);
  const [originalProfilePic, setOriginalProfilePic] = useState("");

  // Load patient data on mount
  useEffect(() => {
    if (patient) {
      const initialData = {
        firstName: patient.first_name,
        middleName: patient.middle_name || "",
        lastName: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        age: calculateAge(patient.date_of_birth),
        gender: patient.gender,
        emergencyContact: patient.emergency_contact_phone || "",
        emergencyContactName: patient.emergency_contact_name || "",
        bloodType: patient.blood_type || "",
        allergies: "",
        medicalConditions: "",
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false,
        timeFormat: patient.time_format || "12h",
        dateFormat: patient.date_format || "MM-DD-YYYY",
      };
      setProfileData(initialData);
      setOriginalProfile(initialData);
      setProfilePic(patient.avatar || "");
      setOriginalProfilePic(patient.avatar || "");

      // Apply time and date format settings globally when profile loads
      setTimeFormat(initialData.timeFormat as any);
      setDateFormat(initialData.dateFormat as any);
    }
  }, [patient, setTimeFormat, setDateFormat]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };
  const isProfileChanged = () => {
    return (
      JSON.stringify(profileData) !== JSON.stringify(originalProfile) ||
      profilePic !== originalProfilePic ||
      profilePicFile !== null
    );
  };
  const handleSaveProfile = () => {
    if (!isProfileChanged()) {
      setIsEditing(false);
      return;
    }
    setShowSaveConfirm(true);
  };
  const confirmSaveProfile = async () => {
    if (!patient?.id) {
      alert("Patient ID not found");
      return;
    }

    try {
      console.log("[Profile] Saving profile changes for patient:", patient.id);

      // Use FormData to support file uploads
      const formData = new FormData();
      formData.append("first_name", profileData.firstName);
      formData.append("middle_name", profileData.middleName || "");
      formData.append("last_name", profileData.lastName);
      formData.append("phone", profileData.phone);
      formData.append("gender", profileData.gender);
      formData.append("emergency_contact_phone", profileData.emergencyContact);
      formData.append(
        "emergency_contact_name",
        profileData.emergencyContactName
      );
      formData.append("blood_type", profileData.bloodType);
      formData.append("time_format", profileData.timeFormat);
      formData.append("date_format", profileData.dateFormat);

      // Add avatar file if changed
      if (profilePicFile) {
        formData.append("avatar", profilePicFile);
        console.log("[Profile] Including new avatar file");
      } else if (profilePic === "" && originalProfilePic !== "") {
        // Avatar removed - send empty string
        formData.append("avatar", "");
        console.log("[Profile] Removing avatar");
      }

      const response = await fetch(
        `http://localhost:8000/api/patients/${patient.id}/`,
        {
          method: "PATCH",
          body: formData, // Don't set Content-Type header, browser will set it with boundary
        }
      );

      const data = await response.json();
      console.log("[Profile] Save response:", data);

      if (response.ok) {
        console.log("[Profile] Profile saved successfully");

        // Update avatar URL from backend response if available
        const newAvatarUrl = data.avatar || profilePic;

        setOriginalProfile(profileData);
        setOriginalProfilePic(newAvatarUrl);
        setProfilePic(newAvatarUrl);
        setProfilePicFile(null); // Clear file after successful upload
        setIsEditing(false);
        setShowSaveConfirm(false);

        // Update header name and avatar
        setProfileName(
          [profileData.firstName, profileData.middleName, profileData.lastName]
            .filter(Boolean)
            .join(" ")
        );
        setProfileAvatar(newAvatarUrl);

        // Update format settings globally
        setTimeFormat(profileData.timeFormat as any);
        setDateFormat(profileData.dateFormat as any);

        // Show success message
        setProfileMessage({
          type: "success",
          text: "Profile saved successfully!",
        });
        setTimeout(() => setProfileMessage(null), 3000);

        // Refresh notifications to show the new profile update notification
        refreshNotifications();

        // Update AuthContext with latest patient data so it persists on reload
        if (patient) {
          const updatedPatient = {
            ...patient,
            first_name: profileData.firstName,
            middle_name: profileData.middleName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            gender: profileData.gender,
            avatar: newAvatarUrl,
            blood_type: profileData.bloodType,
            emergency_contact_name: profileData.emergencyContactName,
            emergency_contact_phone: profileData.emergencyContact,
            time_format: profileData.timeFormat,
            date_format: profileData.dateFormat,
          };
          // Update sessionStorage to persist changes during session
          sessionStorage.setItem("patient", JSON.stringify(updatedPatient));
        }
      } else {
        console.error("[Profile] Failed to save profile:", data);
        setProfileMessage({
          type: "error",
          text: "Failed to save profile. Please try again.",
        });
      }
    } catch (error) {
      console.error("[Profile] Error saving profile:", error);
      setProfileMessage({
        type: "error",
        text: "An error occurred while saving profile. Please try again.",
      });
    }
  };
  const handleCancelEdit = () => {
    if (isProfileChanged()) {
      setShowCancelConfirm(true);
    } else {
      setProfileData(originalProfile);
      setProfilePic(originalProfilePic);
      setIsEditing(false);
    }
  };
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null); // Clear previous messages

    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordMessage({
        type: "error",
        text: "Please fill all password fields",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      return;
    }

    if (!patient?.id) {
      setPasswordMessage({ type: "error", text: "Patient ID not found" });
      return;
    }

    try {
      console.log("[Profile] Changing password for patient:", patient.id);
      const response = await fetch(
        "http://localhost:8000/api/auth/patient/change-password/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patient_id: patient.id,
            current_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
          }),
        }
      );

      console.log("[Profile] Response status:", response.status);
      const data = await response.json();
      console.log("[Profile] Response data:", data);

      if (response.ok) {
        console.log("[Profile] Password changed successfully");
        setPasswordMessage({
          type: "success",
          text: "Password changed successfully!",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Auto-clear success message after 3 seconds
        setTimeout(() => setPasswordMessage(null), 3000);

        // Refresh notifications to show the password change notification
        refreshNotifications();
      } else {
        console.error(
          "[Profile] Password change failed. Status:",
          response.status,
          "Error:",
          data.error
        );
        const errorMessage =
          data.error || "Failed to change password. Please try again.";
        setPasswordMessage({ type: "error", text: errorMessage });
      }
    } catch (error) {
      console.error("[Profile] Password change error:", error);
      setPasswordMessage({
        type: "error",
        text: "An error occurred while changing password. Please try again.",
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("profile.title")}
        </h1>
        <p className="text-gray-600">{t("profile.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {t("profile.personalInformation")}
              </h3>
              {isEditing ? (
                <span className="text-cyan-600 font-medium text-sm">
                  {t("profile.editing")}
                </span>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-cyan-600 hover:text-cyan-700 font-medium text-sm"
                >
                  {t("profile.editProfile")}
                </button>
              )}
            </div>

            {/* Profile Save Message */}
            {profileMessage && (
              <div
                className={`mb-4 p-4 rounded-lg border ${
                  profileMessage.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {profileMessage.type === "success" ? (
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{profileMessage.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileMessage(null)}
                    className="ml-auto -mr-1.5 -mt-1.5 inline-flex h-8 w-8 rounded-lg p-1.5 hover:bg-gray-100 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center mb-6">
              <div className="relative">
                {profilePic ? (
                  <img
                    className="h-20 w-20 rounded-full object-cover cursor-pointer"
                    src={profilePic}
                    alt="Profile"
                    onClick={() => setShowPicModal(true)}
                  />
                ) : (
                  <div
                    className="h-20 w-20 rounded-full bg-cyan-600 flex items-center justify-center text-white font-semibold text-2xl cursor-pointer"
                    onClick={() => setShowPicModal(true)}
                  >
                    {profileData.firstName?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                )}
              </div>
              <div className="ml-4 flex flex-col">
                <h4 className="text-lg font-medium text-gray-900">
                  {profileData.firstName}{" "}
                  {profileData.middleName && profileData.middleName + " "}{" "}
                  {profileData.lastName}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("profile.patientId")}: #PAT-2024-001
                </p>
                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <label className="cursor-pointer bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs font-medium">
                      {t("profile.upload")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file) {
                            setProfilePicFile(file);
                            const reader = new FileReader();
                            reader.onload = function (ev) {
                              setProfilePic(
                                ev.target &&
                                  typeof ev.target.result === "string"
                                  ? ev.target.result
                                  : ""
                              );
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium"
                      onClick={() => setShowRemoveConfirm(true)}
                    >
                      {t("profile.remove")}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Remove confirmation modal */}
            {showRemoveConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center relative">
                  <h2 className="text-lg font-semibold mb-4">
                    {t("profile.removeProfilePicture")}
                  </h2>
                  <p className="mb-6 text-gray-600 text-sm">
                    {t("profile.removeProfilePictureConfirm")}
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                      onClick={() => setShowRemoveConfirm(false)}
                    >
                      {t("profile.cancel")}
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                      onClick={() => {
                        setProfilePic("");
                        setProfilePicFile(null);
                        setShowRemoveConfirm(false);
                      }}
                    >
                      {t("profile.remove")}
                    </button>
                  </div>
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowRemoveConfirm(false)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
            {showPicModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="relative">
                  {profilePic ? (
                    <img
                      className="max-w-lg w-full rounded-lg shadow-lg"
                      src={profilePic}
                      alt="Profile Large"
                    />
                  ) : (
                    <div className="max-w-lg w-full h-96 rounded-lg shadow-lg bg-cyan-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-9xl">
                        {profileData.firstName?.charAt(0)?.toUpperCase() || "P"}
                      </span>
                    </div>
                  )}
                  <button
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-200"
                    onClick={() => setShowPicModal(false)}
                  >
                    <span className="text-gray-700 text-lg">&times;</span>
                  </button>
                </div>
              </div>
            )}
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.firstName")}
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) =>
                    handleProfileChange("firstName", e.target.value)
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.middleName")}
                </label>
                <input
                  type="text"
                  value={profileData.middleName}
                  onChange={(e) =>
                    handleProfileChange("middleName", e.target.value)
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.lastName")}
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) =>
                    handleProfileChange("lastName", e.target.value)
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.emailAddress")}
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.phoneNumber")}
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.age")}
                </label>
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) =>
                    handleProfileChange("age", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.gender")}
                </label>
                {isEditing ? (
                  <select
                    value={profileData.gender}
                    onChange={(e) =>
                      handleProfileChange("gender", e.target.value)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  >
                    <option value="Male">{t("profile.male")}</option>
                    <option value="Female">{t("profile.female")}</option>
                    <option value="Other">{t("profile.other")}</option>
                  </select>
                ) : (
                  <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-50 text-gray-500">
                    {getTranslatedDisplayValue("gender", profileData.gender, t)}
                  </div>
                )}
              </div>
              {/* Medical Information */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.bloodType")}
                </label>
                <select
                  value={profileData.bloodType}
                  onChange={(e) =>
                    handleProfileChange("bloodType", e.target.value)
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">{t("profile.selectBloodType")}</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.emergencyContactName")}
                </label>
                <input
                  type="text"
                  value={profileData.emergencyContactName}
                  onChange={(e) =>
                    handleProfileChange("emergencyContactName", e.target.value)
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.emergencyContactPhone")}
                </label>
                <input
                  type="tel"
                  value={profileData.emergencyContact}
                  onChange={(e) =>
                    handleProfileChange("emergencyContact", e.target.value)
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.knownAllergies")}
                </label>
                <textarea
                  rows={2}
                  value={profileData.allergies}
                  onChange={(e) =>
                    handleProfileChange("allergies", e.target.value)
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder={t("profile.allergiesPlaceholder")}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.medicalConditions")}
                </label>
                <textarea
                  rows={2}
                  value={profileData.medicalConditions}
                  onChange={(e) =>
                    handleProfileChange("medicalConditions", e.target.value)
                  }
                  disabled={!isEditing}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder={t("profile.conditionsPlaceholder")}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Change Password */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              {t("profile.changePassword")}
            </h3>

            {/* Password Change Message */}
            {passwordMessage && (
              <div
                className={`mb-4 p-4 rounded-lg border ${
                  passwordMessage.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {passwordMessage.type === "success" ? (
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">
                      {passwordMessage.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordMessage(null)}
                    className="ml-auto -mr-1.5 -mt-1.5 inline-flex h-8 w-8 rounded-lg p-1.5 hover:bg-gray-100 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.currentPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      handlePasswordChange("currentPassword", e.target.value)
                    }
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.newPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.confirmNewPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                {t("profile.updatePassword")}
              </button>
            </form>
          </div>
          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t("profile.accountSettings")}
            </h3>
            <div className="space-y-4">
              {/* Time Format Setting */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {t("profile.timeFormat")}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t("profile.timeFormatDesc")}
                  </p>
                </div>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={profileData.timeFormat}
                  onChange={(e) =>
                    handleProfileChange("timeFormat", e.target.value)
                  }
                  disabled={!isEditing}
                >
                  <option value="12h">{t("profile.timeFormat12h")}</option>
                  <option value="24h">{t("profile.timeFormat24h")}</option>
                </select>
              </div>

              {/* Date Format Setting */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {t("profile.dateFormat")}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t("profile.dateFormatDesc")}
                  </p>
                </div>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={profileData.dateFormat}
                  onChange={(e) =>
                    handleProfileChange("dateFormat", e.target.value)
                  }
                  disabled={!isEditing}
                >
                  <option value="MM-DD-YYYY">
                    {t("profile.dateFormatMDY")}
                  </option>
                  <option value="DD-MM-YYYY">
                    {t("profile.dateFormatDMY")}
                  </option>
                  <option value="YYYY-MM-DD">
                    {t("profile.dateFormatYMD")}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {t("profile.cancel")}
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={!isProfileChanged()}
            className={`px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              !isProfileChanged()
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-cyan-700"
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            {t("profile.saveChanges")}
          </button>
        </div>
      )}
      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center relative">
            <h2 className="text-lg font-semibold mb-4">
              {t("profile.discardChanges")}
            </h2>
            <p className="mb-6 text-gray-600 text-sm">
              {t("profile.discardChangesConfirm")}
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                onClick={() => setShowCancelConfirm(false)}
              >
                {t("profile.keepEditing")}
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium"
                onClick={() => {
                  setProfileData(originalProfile);
                  setIsEditing(false);
                  setShowCancelConfirm(false);
                }}
              >
                {t("profile.discard")}
              </button>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCancelConfirm(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
      {/* Save confirmation modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center relative">
            <h2 className="text-lg font-semibold mb-4">
              {t("profile.saveChangesConfirm")}
            </h2>
            <p className="mb-6 text-gray-600 text-sm">
              {t("profile.saveChangesConfirmText")}
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                onClick={() => setShowSaveConfirm(false)}
              >
                {t("profile.cancel")}
              </button>
              <button
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm font-medium"
                onClick={confirmSaveProfile}
              >
                {t("profile.save")}
              </button>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowSaveConfirm(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
