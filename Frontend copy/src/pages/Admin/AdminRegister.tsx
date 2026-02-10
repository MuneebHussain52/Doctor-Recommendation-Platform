import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

const AdminRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone_number: "",
    password: "",
    password_confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "full_name") {
      // Capitalize first letter of each word (first and last name)
      const words = value.split(" ");
      const capitalizedValue = words
        .map((word) => {
          if (word.length > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          }
          return word;
        })
        .join(" ");

      setFormData({
        ...formData,
        full_name: capitalizedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear errors when user starts typing
    if (error) setError(null);
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: null });
    }
    if (name === "full_name") {
      setFullNameError(null);
    }
    if (name === "email") {
      setEmailError(null);
      setEmailAvailable(null);
    }
    if (name === "phone_number") {
      setPhoneError(null);
    }
    if (name === "password") {
      setPasswordError(null);
    }
  };

  // Full name validation helper
  const validateFullName = (fullName: string): string | null => {
    if (!fullName) return "Full name is required";

    const trimmedName = fullName.trim();

    // Check length
    if (trimmedName.length < 2)
      return "Full name must be at least 2 characters";
    if (trimmedName.length > 30)
      return "Full name must not exceed 30 characters";

    // Check for consecutive spaces
    if (/\s{2,}/.test(fullName)) {
      return "Full name cannot contain consecutive spaces";
    }

    // Count spaces (max 3 allowed)
    const spaceCount = (fullName.match(/\s/g) || []).length;
    if (spaceCount > 3) {
      return "Full name can contain at most 3 spaces";
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    // Must start and end with a letter
    if (!/^[A-Za-z]([A-Za-z\s'-])*[A-Za-z]$|^[A-Za-z]$/.test(trimmedName)) {
      return "Full name must contain only letters and may include hyphens (-) or apostrophes (')";
    }

    return null;
  };

  // Validate full name on blur
  const handleFullNameBlur = () => {
    const error = validateFullName(formData.full_name);
    setFullNameError(error);
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
      const params = new URLSearchParams({ email, user_type: "admin" });
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

  // Phone number validation helper
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

  // Validate phone number on blur
  const handlePhoneBlur = () => {
    const error = validatePhone(formData.phone_number);
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
    const error = validatePassword(formData.password);
    setPasswordError(error);
  };

  const validateForm = () => {
    const errors: any = {};

    // Email validation
    const emailTrimmed = formData.email.trim();
    const emailFormatErr = validateEmailFormat(emailTrimmed);
    if (emailFormatErr) {
      errors.email = emailFormatErr;
      setEmailError(emailFormatErr);
    }

    // Check if email is available (already validated on blur)
    if (emailAvailable === false) {
      errors.email = "Email is already registered";
      setEmailError("Email is already registered");
    }

    // Check if email availability check failed or wasn't performed
    if (emailAvailable === null && !emailFormatErr) {
      errors.email =
        "Please wait for email validation to complete or try again";
      setEmailError(
        "Please wait for email validation to complete or try again"
      );
    }

    // Full name validation
    const fullNameErr = validateFullName(formData.full_name);
    if (fullNameErr) {
      errors.full_name = fullNameErr;
      setFullNameError(fullNameErr);
    }

    // Password validation
    const passwordErr = validatePassword(formData.password);
    if (passwordErr) {
      errors.password = passwordErr;
      setPasswordError(passwordErr);
    }

    // Password match validation
    if (formData.password !== formData.password_confirm) {
      errors.password_confirm = "Passwords do not match";
    }

    // Phone number validation
    const phoneErr = validatePhone(formData.phone_number);
    if (phoneErr) {
      errors.phone_number = phoneErr;
      setPhoneError(phoneErr);
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/auth/register/`,
        formData
      );

      // Store token and user data in localStorage
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminUser", JSON.stringify(response.data.user));

      // Show success message and redirect
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    } catch (err: any) {
      if (err.response?.data) {
        const errorData = err.response.data;

        // Handle field-specific errors
        if (typeof errorData === "object") {
          setFieldErrors(errorData);

          // Set general error message
          if (errorData.email) {
            setError("This email is already registered");
          } else if (errorData.password) {
            setError(errorData.password[0]);
          } else if (errorData.non_field_errors) {
            setError(errorData.non_field_errors[0]);
          } else {
            setError("Please check the form for errors");
          }
        } else {
          setError("Registration failed. Please try again.");
        }
      } else if (err.request) {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-amber-900 to-yellow-900 relative overflow-hidden">
      {/* Animated Gradient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent"></div>

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-orange-400/30 to-amber-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-amber-400/30 to-yellow-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-br from-yellow-400/30 to-orange-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float-slow"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <div className="relative bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-orange-500/20 shadow-2xl p-8 w-full max-w-md">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-lg opacity-20"></div>

          <div className="relative">
            {/* Back Button */}
            <Link
              to="/admin/login"
              className="inline-flex items-center text-sm text-white/60 hover:text-orange-400 mb-6 transition-colors font-medium group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Link>

            {/* Header with Admin Badge */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl blur-md animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

              <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold rounded-full mb-3 shadow-lg">
                ADMIN ACCESS
              </div>

              <h1 className="text-4xl font-bold text-white mb-2">
                Admin Registration
              </h1>
              <p className="text-white/60 text-sm">
                Secure access to system management
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 backdrop-blur-sm">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-red-200 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Full Name <span className="text-orange-400">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={handleFullNameBlur}
                  className={`w-full px-4 py-3 bg-white/5 border-2 ${
                    fullNameError || fieldErrors.full_name
                      ? "border-red-400/50 focus:border-red-400"
                      : "border-white/10 focus:border-orange-500"
                  } rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 backdrop-blur-sm`}
                  placeholder="Ahmed Khan"
                />
                {fullNameError && (
                  <p className="mt-1 text-sm text-red-400">{fullNameError}</p>
                )}
                {!fullNameError && fieldErrors.full_name && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.full_name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Email Address <span className="text-orange-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  className={`w-full px-4 py-3 bg-white/5 border-2 ${
                    emailError || fieldErrors.email
                      ? "border-red-400/50 focus:border-red-400"
                      : "border-white/10 focus:border-orange-500"
                  } rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 backdrop-blur-sm`}
                  placeholder="admin@example.com"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-400">{emailError}</p>
                )}
                {emailAvailable === true && !emailError && (
                  <p className="mt-1 text-sm text-green-400">
                    ✓ Email is available
                  </p>
                )}
                {!emailError && fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone_number"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Phone Number <span className="text-orange-400">*</span>
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  onBlur={handlePhoneBlur}
                  className={`w-full px-4 py-3 bg-white/5 border-2 ${
                    phoneError || fieldErrors.phone_number
                      ? "border-red-400/50 focus:border-red-400"
                      : "border-white/10 focus:border-orange-500"
                  } rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 backdrop-blur-sm`}
                  placeholder="03001234567"
                />
                {phoneError && (
                  <p className="mt-1 text-sm text-red-400">{phoneError}</p>
                )}
                {!phoneError && fieldErrors.phone_number && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.phone_number}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Password <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handlePasswordBlur}
                    className={`w-full px-4 py-3 bg-white/5 border-2 ${
                      passwordError || fieldErrors.password
                        ? "border-red-400/50 focus:border-red-400"
                        : "border-white/10 focus:border-orange-500"
                    } rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 backdrop-blur-sm`}
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-white/40 hover:text-white/60" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/40 hover:text-white/60" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-sm text-red-400">{passwordError}</p>
                )}
                {!passwordError && fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="password_confirm"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Confirm Password <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password_confirm"
                    name="password_confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/5 border-2 ${
                      fieldErrors.password_confirm
                        ? "border-red-400/50 focus:border-red-400"
                        : "border-white/10 focus:border-orange-500"
                    } rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 backdrop-blur-sm`}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-white/40 hover:text-white/60" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/40 hover:text-white/60" />
                    )}
                  </button>
                </div>
                {fieldErrors.password_confirm && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.password_confirm}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative flex justify-center items-center py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-orange-500/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative flex items-center">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Creating account...
                      </>
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
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Create Admin Account
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
                    to="/admin/login"
                    className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
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

export default AdminRegister;
