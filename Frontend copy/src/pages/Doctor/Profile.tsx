import React, { useState, useEffect } from "react";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Lock,
  FileText,
  Upload,
  Eye,
  Trash2,
  Loader2,
  Ban,
  AlertCircle,
  X,
} from "lucide-react";

const Profile = () => {
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

  // State variables for profile section
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [showLargePic, setShowLargePic] = useState(false);
  const defaultPic =
    "https://ui-avatars.com/api/?name=User&background=cccccc&color=555555&size=256";
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingPic, setPendingPic] = useState<string | null>(null);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);

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

  // State for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Change Password", icon: Lock },
    { id: "documents", label: "Documents", icon: FileText },
  ];

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

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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

      console.log("[Profile] Saving profile data:", profileData);

      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        }
      );

      console.log("[Profile] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Profile] Error response:", errorData);
        throw new Error(`Failed to save profile: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log("[Profile] Profile saved successfully:", responseData);

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
      console.error("[Profile] Failed to save profile:", error);
      setShowSaveConfirm(false);
      alert("Failed to save profile. Please try again.");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "All fields are required",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match",
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 8 characters long",
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/change_password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      if (response.ok) {
        setPasswordMessage({
          type: "success",
          text: "Password changed successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setPasswordMessage({
          type: "error",
          text: errorData.error || "Failed to change password",
        });
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      setPasswordMessage({
        type: "error",
        text: "Failed to change password. Please try again.",
      });
    }
  };

  // Document upload handler
  const handleDocumentUpload = async (docType: string, file: File) => {
    setUploadingDoc(docType);
    setDocMessage(null);

    try {
      const formData = new FormData();
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
        const reloadResponse = await fetch(
          `http://localhost:8000/api/doctors/${doctor?.id}/`
        );
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          const reloadedDocUrl = reloadData[fieldName];

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your profile information</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-cyan-500 text-cyan-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon
                    className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id ? "text-cyan-600" : "text-gray-400"
                    }`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Profile Information
              </h2>

              {/* Blocked Status Alert */}
              {doctor?.is_blocked && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Ban className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">
                          Account Blocked
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          Your account has been blocked by the administrator.
                          You cannot start appointments or accept new bookings.
                        </p>
                      </div>
                    </div>
                    {doctor?.block_reason && (
                      <button
                        onClick={() => setShowBlockReasonModal(true)}
                        className="ml-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        View Reason
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center">
                <div className="relative h-24 w-24 flex-shrink-0 mb-4 sm:mb-0">
                  <img
                    className={`h-24 w-24 rounded-full object-cover${
                      localProfilePic ? " cursor-pointer" : ""
                    }`}
                    src={localProfilePic || defaultPic}
                    alt="User"
                    onClick={() => localProfilePic && setShowLargePic(true)}
                    style={localProfilePic ? {} : { cursor: "default" }}
                  />
                  {showLargePic && localProfilePic && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
                      onClick={() => setShowLargePic(false)}
                    >
                      <img
                        className="rounded-lg shadow-lg max-w-full max-h-full"
                        src={localProfilePic}
                        alt="User Large"
                      />
                    </div>
                  )}
                </div>
                <div className="sm:ml-6">
                  <p className="text-sm text-gray-500 mb-1">Profile picture</p>
                  <div className="flex space-x-3">
                    <button
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      type="button"
                      onClick={handleUploadClick}
                    >
                      Upload
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    {showUploadConfirm && pendingPic && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
                          <p className="mb-4 text-gray-800">
                            Are you sure you want to upload this profile
                            picture?
                          </p>
                          <img
                            src={pendingPic}
                            alt="Preview"
                            className="mx-auto mb-4 rounded-full h-24 w-24 object-cover"
                          />
                          <div className="flex justify-center space-x-4">
                            <button
                              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                              onClick={() => {
                                setShowUploadConfirm(false);
                                setPendingPic(null);
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700"
                              onClick={() => {
                                setLocalProfilePic(pendingPic);
                                setShowUploadConfirm(false);
                                setPendingPic(null);
                              }}
                            >
                              Upload
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowRemoveConfirm(true)}
                      type="button"
                      disabled={!localProfilePic}
                    >
                      Remove
                    </button>
                    {showRemoveConfirm && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
                          <p className="mb-4 text-gray-800">
                            Are you sure you want to remove your profile
                            picture?
                          </p>
                          <div className="flex justify-center space-x-4">
                            <button
                              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                              onClick={() => setShowRemoveConfirm(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                              onClick={() => {
                                setLocalProfilePic("");
                                setShowRemoveConfirm(false);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSave}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                      value={localFirstName}
                      onChange={(e) => setLocalFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="middleName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="middleName"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                      value={localMiddleName}
                      onChange={(e) => setLocalMiddleName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                      value={localLastName}
                      onChange={(e) => setLocalLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="specialization"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Specialization
                  </label>
                  <input
                    type="text"
                    id="specialization"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    value={localSpecialization}
                    onChange={(e) => setLocalSpecialization(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    value={localBio}
                    onChange={(e) => setLocalBio(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 mr-3 ${
                      isChanged ? "" : "cursor-not-allowed opacity-50"
                    }`}
                    disabled={!isChanged}
                    onClick={() => {
                      if (!isChanged) return;
                      setShowCancelConfirm(true);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isChanged
                        ? "bg-cyan-600 hover:bg-cyan-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!isChanged}
                  >
                    Save Changes
                  </button>
                </div>
              </form>

              {/* Modals */}
              {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
                    <p className="mb-4 text-gray-800">
                      Are you sure you want to discard your changes?
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        No
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          setLocalFirstName(initialProfile.firstName);
                          setLocalMiddleName(initialProfile.middleName);
                          setLocalLastName(initialProfile.lastName);
                          setLocalSpecialization(initialProfile.specialization);
                          setLocalEmail(initialProfile.email);
                          setLocalPhone(initialProfile.phone);
                          setLocalBio(initialProfile.bio);
                          setLocalProfilePic(initialProfile.profilePic);
                          setShowCancelConfirm(false);
                        }}
                      >
                        Yes, discard
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {showSaveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
                    <p className="mb-4 text-gray-800">
                      Are you sure you want to save these changes?
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                        onClick={() => setShowSaveConfirm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700"
                        onClick={confirmSave}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {saveMessage && (
                <div className="mt-4 text-green-600 text-sm text-center">
                  {saveMessage}
                </div>
              )}
            </div>
          )}

          {activeTab === "password" && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Change Password
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Update your password to keep your account secure.
              </p>

              {/* Success/Error Messages */}
              {passwordMessage && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    passwordMessage.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <form
                onSubmit={handlePasswordChange}
                className="space-y-6 max-w-md"
              >
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "documents" && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Professional Documents
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Manage your professional documents. You can upload, view, and
                remove documents as needed.
              </p>

              {/* Success/Error Messages */}
              {docMessage && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    docMessage.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {docMessage.text}
                </div>
              )}

              <div className="space-y-6">
                {/* National ID / Passport */}
                <DocumentUploadCard
                  title="Passport / National ID"
                  description="Government-issued identification document"
                  document={documents.nationalId}
                  docType="nationalId"
                  uploading={uploadingDoc === "nationalId"}
                  onUpload={(file) => handleDocumentUpload("nationalId", file)}
                  onDelete={() => {
                    setPendingDeleteDoc("nationalId");
                    setShowDeleteDocConfirm(true);
                  }}
                />

                {/* Medical Degree */}
                <DocumentUploadCard
                  title="Medical Degree"
                  description="Your medical school degree or diploma"
                  document={documents.medicalDegree}
                  docType="medicalDegree"
                  uploading={uploadingDoc === "medicalDegree"}
                  onUpload={(file) =>
                    handleDocumentUpload("medicalDegree", file)
                  }
                  onDelete={() => {
                    setPendingDeleteDoc("medicalDegree");
                    setShowDeleteDocConfirm(true);
                  }}
                />

                {/* Medical License */}
                <DocumentUploadCard
                  title="Medical Registration / License"
                  description="Valid medical practice license"
                  document={documents.medicalLicense}
                  docType="medicalLicense"
                  uploading={uploadingDoc === "medicalLicense"}
                  onUpload={(file) =>
                    handleDocumentUpload("medicalLicense", file)
                  }
                  onDelete={() => {
                    setPendingDeleteDoc("medicalLicense");
                    setShowDeleteDocConfirm(true);
                  }}
                />

                {/* Specialist Certificates */}
                <DocumentUploadCard
                  title="Specialist Certificates"
                  description="Board certification or specialty training certificates"
                  document={documents.specialistCertificates}
                  docType="specialistCertificates"
                  uploading={uploadingDoc === "specialistCertificates"}
                  onUpload={(file) =>
                    handleDocumentUpload("specialistCertificates", file)
                  }
                  onDelete={() => {
                    setPendingDeleteDoc("specialistCertificates");
                    setShowDeleteDocConfirm(true);
                  }}
                />

                {/* Proof of Practice */}
                <DocumentUploadCard
                  title="Proof of Practice"
                  description="Hospital affiliation or clinic registration"
                  document={documents.proofOfPractice}
                  docType="proofOfPractice"
                  uploading={uploadingDoc === "proofOfPractice"}
                  onUpload={(file) =>
                    handleDocumentUpload("proofOfPractice", file)
                  }
                  onDelete={() => {
                    setPendingDeleteDoc("proofOfPractice");
                    setShowDeleteDocConfirm(true);
                  }}
                />
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteDocConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-96 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Remove Document
                    </h3>
                    <p className="mb-4 text-gray-600">
                      Are you sure you want to remove this document? This action
                      cannot be undone.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                        onClick={() => {
                          setShowDeleteDocConfirm(false);
                          setPendingDeleteDoc("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                        onClick={handleDeleteDocument}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
                onClick={() => setShowBlockReasonModal(false)}
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
                {doctor.block_reason || "No reason provided"}
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
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
          {document && (
            <div className="mt-2 flex items-center text-sm text-green-600">
              <FileText className="h-4 w-4 mr-1" />
              <span className="truncate max-w-xs">{document.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {document && (
            <>
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-md transition-colors"
                title="View document"
              >
                <Eye className="h-4 w-4" />
              </a>
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete document"
                disabled={uploading}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
            title={document ? "Replace document" : "Upload document"}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
