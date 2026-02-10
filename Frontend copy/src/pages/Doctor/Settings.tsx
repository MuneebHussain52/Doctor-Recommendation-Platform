import React, { useState, useEffect } from "react";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import { useDateTimeFormat } from "../../context/DateTimeFormatContext";
import { useLocation } from "react-router-dom";
import {
  User,
  Bell,
  Lock,
  Shield,
  FileText,
  Upload,
  Eye,
  Trash2,
  Loader2,
  Ban,
  AlertCircle,
  X,
} from "lucide-react";

const Settings = () => {
  const { doctor, updateDoctor } = useAuth();

  // Use ProfileContext for unified state management
  const {
    profilePic,
    setProfilePic,
    firstName,
    setFirstName,
    middleName,
    setMiddleName,
    lastName,
    setLastName,
    specialization,
    setSpecialization,
    email,
    setEmail,
    phone,
    setPhone,
    bio,
    setBio,
  } = useProfile();

  // Use DateTimeFormat context
  const {
    timeFormat,
    setTimeFormat,
    dateFormat,
    setDateFormat,
    monthFormat,
    setMonthFormat,
    formatTime,
    formatDate,
  } = useDateTimeFormat();

  // State variables for profile section
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);

  const [activeTab, setActiveTab] = useState("notifications");
  const [showLargePic, setShowLargePic] = useState(false);
  const defaultPic =
    "https://ui-avatars.com/api/?name=User&background=cccccc&color=555555&size=256";
  const location = useLocation();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const [pendingPic, setPendingPic] = useState<string | null>(null);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const result = event.target && event.target.result;
        if (typeof result === "string") {
          setPendingPic(result);
          setShowUploadConfirm(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  // Local state for editing profile
  const [localFirstName, setLocalFirstName] = useState(firstName);
  const [localMiddleName, setLocalMiddleName] = useState(middleName);
  const [localLastName, setLocalLastName] = useState(lastName);
  const [localSpecialization, setLocalSpecialization] =
    useState(specialization);
  const [localEmail, setLocalEmail] = useState(email);
  const [localPhone, setLocalPhone] = useState(phone);
  const [localBio, setLocalBio] = useState(bio);
  const [localProfilePic, setLocalProfilePic] = useState(profilePic);
  const [initialProfile, setInitialProfile] = useState({
    firstName,
    middleName,
    lastName,
    specialization,
    email,
    phone,
    bio,
    profilePic,
  });

  // State for documents management
  const [documents, setDocuments] = useState<{
    nationalId: { url: string; name: string } | null;
    medicalDegree: { url: string; name: string } | null;
    medicalLicense: { url: string; name: string } | null;
    specialistCertificates: { url: string; name: string } | null;
    proofOfPractice: { url: string; name: string } | null;
  }>({
    nationalId: null,
    medicalDegree: null,
    medicalLicense: null,
    specialistCertificates: null,
    proofOfPractice: null,
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [docMessage, setDocMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDeleteDocConfirm, setShowDeleteDocConfirm] = useState(false);
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState<string>("");

  React.useEffect(() => {
    setInitialProfile({
      firstName,
      middleName,
      lastName,
      specialization,
      email,
      phone,
      bio,
      profilePic,
    });
    setLocalFirstName(firstName);
    setLocalMiddleName(middleName);
    setLocalLastName(lastName);
    setLocalSpecialization(specialization);
    setLocalEmail(email);
    setLocalPhone(phone);
    setLocalBio(bio);
    setLocalProfilePic(profilePic);
  }, [
    firstName,
    middleName,
    lastName,
    specialization,
    email,
    phone,
    bio,
    profilePic,
  ]);

  // Load doctor documents
  useEffect(() => {
    const loadDocuments = async () => {
      if (!doctor?.id) return;

      try {
        console.log(
          "[LoadDocuments] Fetching documents for doctor:",
          doctor.id
        );
        const response = await fetch(
          `http://localhost:8000/api/doctors/${doctor.id}/`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("[LoadDocuments] Doctor data:", data);
          console.log("[LoadDocuments] Blocking fields:", {
            is_blocked: data.is_blocked,
            block_reason: data.block_reason,
            blocked_at: data.blocked_at,
          });

          // Update AuthContext with blocking fields if they exist
          if (data.is_blocked !== undefined) {
            console.log(
              "[LoadDocuments] Updating doctor in AuthContext with blocking data"
            );
            updateDoctor({
              is_blocked: data.is_blocked,
              block_reason: data.block_reason,
              blocked_at: data.blocked_at,
            });
          }

          console.log("[LoadDocuments] Document URLs:", {
            nationalId: data.national_id,
            medicalDegree: data.medical_degree,
            medicalLicense: data.medical_license,
            specialistCertificates: data.specialist_certificates,
            proofOfPractice: data.proof_of_practice,
          });

          setDocuments({
            nationalId: data.national_id
              ? { url: data.national_id, name: "National ID" }
              : null,
            medicalDegree: data.medical_degree
              ? { url: data.medical_degree, name: "Medical Degree" }
              : null,
            medicalLicense: data.medical_license
              ? { url: data.medical_license, name: "Medical License" }
              : null,
            specialistCertificates: data.specialist_certificates
              ? {
                  url: data.specialist_certificates,
                  name: "Specialist Certificates",
                }
              : null,
            proofOfPractice: data.proof_of_practice
              ? { url: data.proof_of_practice, name: "Proof of Practice" }
              : null,
          });
        } else {
          console.error("[LoadDocuments] Failed to fetch:", response.status);
        }
      } catch (error) {
        console.error("[LoadDocuments] Failed to load documents:", error);
      }
    };

    loadDocuments();
  }, [doctor]);

  // Document upload handler
  const handleDocumentUpload = async (docType: string, file: File) => {
    setUploadingDoc(docType);
    setDocMessage(null);

    try {
      const formData = new FormData();
      // Convert camelCase to snake_case properly
      const fieldName = docType
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
      formData.append(fieldName, file);

      console.log("[DocumentUpload] Uploading:", fieldName, file.name);

      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("[DocumentUpload] Response data:", data);
        console.log("[DocumentUpload] Available fields:", Object.keys(data));
        console.log("[DocumentUpload] Looking for field:", fieldName);
        const docUrl = data[fieldName];
        console.log("[DocumentUpload] Document URL:", docUrl);

        // Reload the full doctor data to get the updated document URL
        const reloadResponse = await fetch(
          `http://localhost:8000/api/doctors/${doctor?.id}/`
        );
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          console.log("[DocumentUpload] Reloaded doctor data:", reloadData);
          const reloadedDocUrl = reloadData[fieldName];
          console.log(
            "[DocumentUpload] Reloaded document URL:",
            reloadedDocUrl
          );

          if (reloadedDocUrl) {
            setDocuments((prev) => ({
              ...prev,
              [docType]: { url: reloadedDocUrl, name: file.name },
            }));

            setDocMessage({
              type: "success",
              text: `${docType
                .replace(/([A-Z])/g, " $1")
                .trim()} uploaded successfully!`,
            });
            setTimeout(() => setDocMessage(null), 5000);
          } else {
            throw new Error("No document URL in reloaded response");
          }
        } else {
          throw new Error("Failed to reload doctor data");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[DocumentUpload] Upload failed:", errorData);
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("[DocumentUpload] Failed to upload document:", error);
      setDocMessage({
        type: "error",
        text: "Failed to upload document. Please try again.",
      });
      setTimeout(() => setDocMessage(null), 5000);
    } finally {
      setUploadingDoc(null);
    }
  };

  // Document delete handler
  const handleDeleteDocument = async () => {
    if (!pendingDeleteDoc) return;

    try {
      setDocMessage(null);
      // Convert camelCase to snake_case properly
      const fieldName = pendingDeleteDoc
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");

      const formData = new FormData();
      formData.append(fieldName, "");

      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (response.ok) {
        setDocuments((prev) => ({
          ...prev,
          [pendingDeleteDoc]: null,
        }));

        setDocMessage({
          type: "success",
          text: `${pendingDeleteDoc
            .replace(/([A-Z])/g, " $1")
            .trim()} removed successfully!`,
        });
        setTimeout(() => setDocMessage(null), 5000);
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      setDocMessage({
        type: "error",
        text: "Failed to remove document. Please try again.",
      });
      setTimeout(() => setDocMessage(null), 5000);
    } finally {
      setShowDeleteDocConfirm(false);
      setPendingDeleteDoc("");
    }
  };

  // Handle hash navigation to switch tabs
  useEffect(() => {
    const hash = location.hash.substring(1); // Remove the '#' character
    if (hash && ["notifications", "security", "privacy"].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  const isChanged =
    localFirstName !== initialProfile.firstName ||
    localMiddleName !== initialProfile.middleName ||
    localLastName !== initialProfile.lastName ||
    localSpecialization !== initialProfile.specialization ||
    localEmail !== initialProfile.email ||
    localPhone !== initialProfile.phone ||
    localBio !== initialProfile.bio ||
    localProfilePic !== initialProfile.profilePic;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChanged) return;
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    try {
      // Save profile to database
      const profileData: any = {
        first_name: localFirstName,
        middle_name: localMiddleName || null,
        last_name: localLastName,
        specialty: localSpecialization,
        email: localEmail,
        phone: localPhone || null,
        bio: localBio || null,
      };

      // Only include avatar if it has changed
      if (localProfilePic !== initialProfile.profilePic) {
        if (localProfilePic === "") {
          profileData.avatar = "";
        } else if (localProfilePic.startsWith("data:image")) {
          profileData.avatar = localProfilePic;
        }
      }

      console.log("[Settings] Saving profile data:", profileData);

      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        }
      );

      console.log("[Settings] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Settings] Error response:", errorData);
        throw new Error(`Failed to save profile: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log("[Settings] Profile saved successfully:", responseData);

      // Update local context
      setFirstName(localFirstName);
      setMiddleName(localMiddleName);
      setLastName(localLastName);
      setSpecialization(localSpecialization);
      setEmail(localEmail);
      setPhone(localPhone);
      setBio(localBio);
      setProfilePic(localProfilePic);
      setInitialProfile({
        firstName: localFirstName,
        middleName: localMiddleName,
        lastName: localLastName,
        specialization: localSpecialization,
        email: localEmail,
        phone: localPhone,
        bio: localBio,
        profilePic: localProfilePic,
      });
      setShowSaveConfirm(false);
      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("[Settings] Failed to save profile:", error);
      setShowSaveConfirm(false);
      alert("Failed to save profile. Please try again.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="sm:flex">
          {/* Settings navigation */}
          <div className="sm:w-64 bg-gray-50 sm:border-r border-gray-200">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full transition-colors ${
                      activeTab === tab.id
                        ? "bg-cyan-50 text-cyan-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        activeTab === tab.id ? "text-cyan-600" : "text-gray-400"
                      }`}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings content */}
          <div className="sm:flex-1 p-6">
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Notification Preferences
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="appointments"
                            name="appointments"
                            type="checkbox"
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="appointments"
                            className="font-medium text-gray-700"
                          >
                            Appointment Reminders
                          </label>
                          <p className="text-gray-500">
                            Receive notifications about upcoming appointments
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="cancellations"
                            name="cancellations"
                            type="checkbox"
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="cancellations"
                            className="font-medium text-gray-700"
                          >
                            Cancellations & Reschedules
                          </label>
                          <p className="text-gray-500">
                            Get notified when appointments are changed or
                            cancelled
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="messages"
                            name="messages"
                            type="checkbox"
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="messages"
                            className="font-medium text-gray-700"
                          >
                            New Messages
                          </label>
                          <p className="text-gray-500">
                            Receive email notifications for new patient messages
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="system"
                            name="system"
                            type="checkbox"
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="system"
                            className="font-medium text-gray-700"
                          >
                            System Updates
                          </label>
                          <p className="text-gray-500">
                            Get notified about system changes and updates
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      SMS Notifications
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="sms-appointments"
                            name="sms-appointments"
                            type="checkbox"
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="sms-appointments"
                            className="font-medium text-gray-700"
                          >
                            Appointment Reminders
                          </label>
                          <p className="text-gray-500">
                            Receive SMS reminders about upcoming appointments
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="sms-cancellations"
                            name="sms-cancellations"
                            type="checkbox"
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="sms-cancellations"
                            className="font-medium text-gray-700"
                          >
                            Cancellations & Reschedules
                          </label>
                          <p className="text-gray-500">
                            Get SMS notifications for appointment changes
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="sms-urgent"
                            name="sms-urgent"
                            type="checkbox"
                            className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="sms-urgent"
                            className="font-medium text-gray-700"
                          >
                            Urgent Messages
                          </label>
                          <p className="text-gray-500">
                            Receive SMS for urgent patient messages
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {(activeTab === "security" || activeTab === "privacy") && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="text-center">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {activeTab === "security"
                      ? "Security Settings"
                      : "Privacy Settings"}
                  </h2>
                  <p className="text-gray-500">
                    {activeTab === "security"
                      ? "Configure your security preferences"
                      : "Manage your privacy settings"}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block Reason Modal */}
      {showBlockReasonModal && doctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Block Reason
              </h3>
              <button
                onClick={() => {
                  console.log("[BlockReasonModal] Closing modal");
                  setShowBlockReasonModal(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Your account has been blocked by the administrator.
              </p>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Reason:
              </h4>
              <p className="text-sm text-gray-600 bg-red-50 p-3 rounded border border-red-200">
                {(() => {
                  console.log("[BlockReasonModal] Doctor object:", doctor);
                  console.log(
                    "[BlockReasonModal] Block reason:",
                    doctor.block_reason
                  );
                  return doctor.block_reason || "No reason provided";
                })()}
              </p>
            </div>
            {doctor.blocked_at && (
              <div className="mb-4">
                <p className="text-xs text-gray-500">
                  Blocked on: {new Date(doctor.blocked_at).toLocaleString()}
                </p>
              </div>
            )}
            <button
              onClick={() => setShowBlockReasonModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Document Upload Card Component
interface DocumentUploadCardProps {
  title: string;
  description: string;
  document: { url: string; name: string } | null;
  docType: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  description,
  document,
  docType,
  uploading,
  onUpload,
  onDelete,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleViewDocument = () => {
    if (document?.url) {
      console.log("[ViewDocument] Original URL:", document.url);
      // Check if URL is relative or absolute
      const fullUrl = document.url.startsWith("http")
        ? document.url
        : `http://localhost:8000${document.url}`;
      console.log("[ViewDocument] Full URL:", fullUrl);
      window.open(fullUrl, "_blank");
    } else {
      console.error("[ViewDocument] No document URL available");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>

          {document && (
            <div className="mt-3 flex items-center text-sm text-green-600">
              <FileText className="h-4 w-4 mr-2" />
              <span className="font-medium">Document uploaded</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {uploading ? (
            <div className="flex items-center text-cyan-600">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <>
              {document ? (
                <>
                  <button
                    onClick={handleViewDocument}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    title="View document"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    View
                  </button>
                  <button
                    onClick={onDelete}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                    title="Remove document"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Upload
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default Settings;
