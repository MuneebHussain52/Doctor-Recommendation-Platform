import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, Upload, X, ArrowLeft, AlertCircle } from "lucide-react";

const PatientRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // CRITICAL - include from start
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    password: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [middleNameError, setMiddleNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "first_name" || name === "last_name") {
      // Capitalize first letter of name
      const capitalizedValue =
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

      setFormData({
        ...formData,
        [name]: capitalizedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    setError("");

    // Clear specific field errors when user starts typing
    if (name === "first_name") {
      setFirstNameError(null);
    }
    if (name === "last_name") {
      setLastNameError(null);
    }
    if (name === "middle_name") {
      setMiddleNameError(null);
    }
    if (name === "email") {
      setEmailError(null);
      setEmailAvailable(null);
    }
    if (name === "phone") {
      setPhoneError(null);
    }
    if (name === "password") {
      setPasswordError(null);
    }
    if (name === "date_of_birth") {
      setDobError(null);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Name validation helper
  const validateName = (
    name: string,
    fieldName: string,
    isOptional: boolean = false
  ): string | null => {
    // If optional and empty, it's valid
    if (isOptional && !name) return null;

    // If required and empty
    if (!isOptional && !name) return `${fieldName} is required`;

    // Trim the name
    const trimmedName = name.trim();

    // Check length
    if (trimmedName.length < 2)
      return `${fieldName} must be at least 2 characters`;
    if (trimmedName.length > 30)
      return `${fieldName} must not exceed 30 characters`;

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    if (!/^[A-Za-z]([A-Za-z\s'-])*[A-Za-z]$|^[A-Za-z]$/.test(trimmedName)) {
      return `${fieldName} must contain only letters, and may include hyphens (-) or apostrophes (')`;
    }

    return null;
  };

  // Validate individual name fields on blur
  const handleFirstNameBlur = () => {
    const error = validateName(formData.first_name, "First name", false);
    setFirstNameError(error);
  };

  const handleLastNameBlur = () => {
    const error = validateName(formData.last_name, "Last name", false);
    setLastNameError(error);
  };

  const handleMiddleNameBlur = () => {
    const error = validateName(formData.middle_name, "Middle name", true);
    setMiddleNameError(error);
  };

  // Email format validation helper
  const validateEmailFormat = (email: string): string | null => {
    if (!email) return "Email is required";
    if (email.length > 253) return "Email must be under 254 characters";
    if (email.includes(" ")) return "Email must not contain spaces";
    if (!email.includes("@") || !email.includes("."))
      return 'Email must contain "@" and "."';
    return null;
  };

  // Check email uniqueness by calling backend endpoint on blur
  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    const formatErr = validateEmailFormat(email);
    if (formatErr) {
      setEmailError(formatErr);
      setEmailAvailable(false);
      return;
    }

    try {
      const params = new URLSearchParams({ email, user_type: "patient" });
      const res = await fetch(
        `http://127.0.0.1:8000/api/auth/check-email/?${params.toString()}`
      );
      if (!res.ok) {
        setEmailError("Unable to validate email at this time");
        setEmailAvailable(null);
        return;
      }
      const data = await res.json();
      if (data.available) {
        setEmailError(null);
        setEmailAvailable(true);
      } else {
        setEmailError(data.message || "Email is already registered");
        setEmailAvailable(false);
      }
    } catch (err) {
      setEmailError("Unable to validate email at this time");
      setEmailAvailable(null);
    }
  };

  // Phone validation helper
  const validatePhone = (phone: string): string | null => {
    if (!phone) return "Phone number is required";

    // Check if contains only digits
    if (!/^\d+$/.test(phone)) {
      return "Phone number must contain only digits (0-9)";
    }

    // Check length
    if (phone.length < 10) return "Phone number must be at least 10 digits";
    if (phone.length > 15) return "Phone number must not exceed 15 digits";

    return null;
  };

  // Validate phone on blur
  const handlePhoneBlur = () => {
    const error = validatePhone(formData.phone);
    setPhoneError(error);
  };

  // Password validation helper
  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8)
      return "Password must be at least 8 characters long";
    if (password.length > 64) return "Password must not exceed 64 characters";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter (A-Z)";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter (a-z)";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number (0-9)";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
      return "Password must contain at least one special character (!@#$%^&*, etc.)";
    return null;
  };

  // Validate password on blur
  const handlePasswordBlur = () => {
    const password = formData.password;
    const validationError = validatePassword(password);
    setPasswordError(validationError);
  };

  // Date of birth validation helper
  const validateDateOfBirth = (dob: string): string | null => {
    if (!dob) return "Date of birth is required";

    const birthDate = new Date(dob);
    const today = new Date();

    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    birthDate.setHours(0, 0, 0, 0);

    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      return "Please enter a valid date";
    }

    // Check if date is in the future
    if (birthDate >= today) {
      return "Date of birth must be before today";
    }

    // Calculate age
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge =
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;

    // Check if user is at least 1 year old (optional, adjust as needed)
    if (actualAge < 1) {
      return "You must be at least 1 year old to register";
    }

    // Check if age is reasonable (less than 150 years)
    if (actualAge > 150) {
      return "Please enter a valid date of birth";
    }

    return null;
  };

  // Validate date of birth on blur
  const handleDobBlur = () => {
    const error = validateDateOfBirth(formData.date_of_birth);
    setDobError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Name validations
    const firstNameErr = validateName(formData.first_name, "First name", false);
    if (firstNameErr) {
      setError(firstNameErr);
      setFirstNameError(firstNameErr);
      setLoading(false);
      return;
    }

    const lastNameErr = validateName(formData.last_name, "Last name", false);
    if (lastNameErr) {
      setError(lastNameErr);
      setLastNameError(lastNameErr);
      setLoading(false);
      return;
    }

    const middleNameErr = validateName(
      formData.middle_name,
      "Middle name",
      true
    );
    if (middleNameErr) {
      setError(middleNameErr);
      setMiddleNameError(middleNameErr);
      setLoading(false);
      return;
    }

    // Email validation
    const emailTrimmed = formData.email.trim();
    const emailFormatErr = validateEmailFormat(emailTrimmed);
    if (emailFormatErr) {
      setError(emailFormatErr);
      setEmailError(emailFormatErr);
      setLoading(false);
      return;
    }

    // Check if email is available (already validated on blur)
    if (emailAvailable === false) {
      setError("Email is already registered");
      setLoading(false);
      return;
    }

    // Phone validation
    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) {
      setError(phoneErr);
      setPhoneError(phoneErr);
      setLoading(false);
      return;
    }

    // Date of birth validation
    const dobErr = validateDateOfBirth(formData.date_of_birth);
    if (dobErr) {
      setError(dobErr);
      setDobError(dobErr);
      setLoading(false);
      return;
    }

    // Password validation
    const passwordErr = validatePassword(formData.password);
    if (passwordErr) {
      setError(passwordErr);
      setPasswordError(passwordErr);
      setLoading(false);
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("middle_name", formData.middle_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("date_of_birth", formData.date_of_birth);
      formDataToSend.append("password", formData.password);

      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      const response = await fetch(
        "http://localhost:8000/api/auth/patient/register/",
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (response.ok) {
        login(data.patient, "patient"); // CRITICAL - updates AuthContext with user type

        navigate("/patient/dashboard");
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 relative overflow-hidden">
      {/* Animated Gradient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent"></div>

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-teal-400/30 to-cyan-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-br from-cyan-400/30 to-emerald-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float-slow"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <div className="relative bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-emerald-500/20 shadow-2xl p-8 w-full max-w-2xl">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur-lg opacity-20"></div>

          <div className="relative">
            {/* Back Button */}
            <Link
              to="/patient/login"
              className="inline-flex items-center text-sm text-white/60 hover:text-emerald-400 mb-6 transition-colors font-medium group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Link>

            {/* Header with Friendly Design */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full blur-md animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

              <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-bold rounded-full mb-3 shadow-lg uppercase tracking-wider">
                💚 Patient Portal
              </div>

              <h1 className="text-4xl font-bold text-white mb-2">
                Patient Registration
              </h1>
              <p className="text-white/60">
                Welcome! Let's get you started on your healthcare journey
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start mb-6 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-200 font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Profile Picture (Optional)
                </label>
                {avatarPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500/30"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-emerald-500/30 rounded-full cursor-pointer hover:border-emerald-500 transition-colors bg-white/5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 text-cyan-400" />
                  </label>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    onBlur={handleFirstNameBlur}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                      firstNameError ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="Fatima"
                  />
                  {firstNameError && (
                    <p className="text-sm text-red-400 mt-1">
                      {firstNameError}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="middle_name"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Middle Name
                  </label>
                  <input
                    type="text"
                    id="middle_name"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    onBlur={handleMiddleNameBlur}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                      middleNameError ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="Noor"
                  />
                  {middleNameError && (
                    <p className="text-sm text-red-400 mt-1">
                      {middleNameError}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    onBlur={handleLastNameBlur}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                      lastNameError ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="Ali"
                  />
                  {lastNameError && (
                    <p className="text-sm text-red-400 mt-1">{lastNameError}</p>
                  )}
                </div>
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleEmailBlur}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                      emailError ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="patient@example.com"
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                  )}
                  {emailAvailable === true && !emailError && (
                    <p className="text-green-600 text-sm mt-1">
                      ✓ Email is available
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                      phoneError ? "border-red-500" : "border-white/10"
                    }`}
                    placeholder="03001234567"
                  />
                  {phoneError && (
                    <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                  )}
                </div>
              </div>

              {/* Gender and Date of Birth */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="date_of_birth"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    onBlur={handleDobBlur}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                      dobError ? "border-red-500" : "border-white/10"
                    }`}
                  />
                  {dobError && (
                    <p className="text-red-500 text-sm mt-1">{dobError}</p>
                  )}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handlePasswordBlur}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 pr-10 ${
                        passwordError ? "border-red-500" : "border-white/10"
                      }`}
                      placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 pr-10"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative flex justify-center items-center py-4 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative flex items-center">
                    {loading ? (
                      "Creating Account..."
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                        Start Your Health Journey
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-white/60">
                  Already have an account?{" "}
                  <Link
                    to="/patient/login"
                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;
