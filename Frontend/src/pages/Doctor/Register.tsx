import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Stethoscope,
  Mail,
  Lock,
  Phone,
  Award,
  AlertCircle,
  Upload,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const DoctorRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    specialty: "",
    customSpecialty: "",
    phone: "",
    license_number: "",
    years_of_experience: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [middleNameError, setMiddleNameError] = useState<string | null>(null);
  const [dateOfBirthError, setDateOfBirthError] = useState<string | null>(null);
  const [genderError, setGenderError] = useState<string | null>(null);
  const [customSpecialtyError, setCustomSpecialtyError] = useState<
    string | null
  >(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCustomSpecialty, setShowCustomSpecialty] = useState(false);

  // Professional documents
  const [documents, setDocuments] = useState({
    nationalId: null as File | null,
    medicalDegree: null as File | null,
    medicalLicense: null as File | null,
    specialistCertificates: null as File | null,
    proofOfPractice: null as File | null,
  });

  // Fetch specialties from API
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setLoadingSpecialties(true);
        const response = await fetch("http://localhost:8000/api/specialties/");
        if (response.ok) {
          const data = await response.json();
          setSpecialties(data.specialties || []);
        } else {
          // Fallback to empty array, "Other" option will still be available
          setSpecialties([]);
        }
      } catch (error) {
        setSpecialties([]);
      } finally {
        setLoadingSpecialties(false);
      }
    };

    fetchSpecialties();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "specialty") {
      if (value === "Other") {
        setShowCustomSpecialty(true);
        setFormData({
          ...formData,
          specialty: value,
          customSpecialty: "",
        });
      } else {
        setShowCustomSpecialty(false);
        setFormData({
          ...formData,
          specialty: value,
          customSpecialty: "",
        });
      }
    } else if (name === "customSpecialty") {
      // Capitalize first letter of each word
      const capitalizedValue = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

      setFormData({
        ...formData,
        customSpecialty: capitalizedValue,
      });
      setCustomSpecialtyError(null);
    } else if (name === "first_name" || name === "last_name") {
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
    if (name === "email") {
      // reset email validation state on change
      setEmailError(null);
      setEmailAvailable(null);
    }
    if (name === "password") {
      // reset password validation state on change
      setPasswordError(null);
    }
    if (name === "first_name") {
      setFirstNameError(null);
    }
    if (name === "last_name") {
      setLastNameError(null);
    }
    if (name === "middle_name") {
      setMiddleNameError(null);
    }
    if (name === "date_of_birth") {
      setDateOfBirthError(null);
    }
    if (name === "gender") {
      setGenderError(null);
    }
    if (name === "phone") {
      setPhoneError(null);
    }
    if (name === "license_number") {
      setLicenseError(null);
    }
    if (name === "years_of_experience") {
      setExperienceError(null);
    }
    if (name === "bio") {
      setBioError(null);
    }
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

    // Optionally suggest capitalization (warning, not error)
    if (!/^[A-Z]/.test(trimmedName)) {
      // We'll just return null here, but could add a warning state if desired
      // For now, we'll be lenient and not enforce capitalization
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

  // Validate date of birth
  const validateDateOfBirth = (dob: string): string | null => {
    if (!dob) return "Date of birth is required";

    const selectedDate = new Date(dob);
    const today = new Date();

    // Check if date is valid
    if (isNaN(selectedDate.getTime())) return "Invalid date";

    // Check if date is in the future
    if (selectedDate > today) return "Date of birth cannot be in the future";

    // Calculate age
    const age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();
    const dayDiff = today.getDate() - selectedDate.getDate();
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    // Check minimum age (25 years for doctors)
    if (actualAge < 25) return "You must be at least 25 years old";

    // Check maximum age (80 years for doctors)
    if (actualAge > 80) return "Age cannot exceed 80 years";

    return null;
  };

  const handleDateOfBirthBlur = () => {
    const error = validateDateOfBirth(formData.date_of_birth);
    setDateOfBirthError(error);
  };

  // Validate gender
  const validateGender = (gender: string): string | null => {
    if (!gender) return "Gender is required";
    return null;
  };

  const handleGenderBlur = () => {
    const error = validateGender(formData.gender);
    setGenderError(error);
  };

  // Validate custom specialty
  const validateCustomSpecialty = (specialty: string): string | null => {
    // Empty check
    if (!specialty || !specialty.trim()) {
      return 'Custom specialty is required when "Other" is selected';
    }

    const trimmedSpecialty = specialty.trim();

    // Check length
    if (trimmedSpecialty.length < 3)
      return "Custom specialty must be at least 3 characters";
    if (trimmedSpecialty.length > 50)
      return "Custom specialty must not exceed 50 characters";

    // Check for valid characters (letters and spaces only)
    if (!/^[A-Za-z\s]+$/.test(trimmedSpecialty)) {
      return "Custom specialty must contain only letters and spaces";
    }

    return null;
  };

  const handleCustomSpecialtyBlur = () => {
    const error = validateCustomSpecialty(formData.customSpecialty);
    setCustomSpecialtyError(error);
  };

  // Validate phone number
  const validatePhone = (phone: string): string | null => {
    // Empty check
    if (!phone) return "Phone number is required";

    // Check for only digits
    if (!/^\d+$/.test(phone)) {
      return "Phone number must contain only digits (0-9)";
    }

    // Check length
    if (phone.length < 10) return "Phone number must be at least 10 digits";
    if (phone.length > 15) return "Phone number must not exceed 15 digits";

    return null;
  };

  const handlePhoneBlur = () => {
    const error = validatePhone(formData.phone);
    setPhoneError(error);
  };

  // Validate license number
  const validateLicense = (license: string): string | null => {
    // Empty check
    if (!license) return "License number is required";

    // Check for valid characters (alphanumeric, hyphens, and slashes only)
    if (!/^[A-Za-z0-9\-\/]+$/.test(license)) {
      return "License number must contain only letters, numbers, hyphens, or slashes";
    }

    return null;
  };

  const handleLicenseBlur = () => {
    const error = validateLicense(formData.license_number);
    setLicenseError(error);
  };

  // Validate years of experience
  const validateExperience = (experience: string): string | null => {
    // Empty check
    if (!experience && experience !== "0")
      return "Years of experience is required";

    // Check if it's a valid number
    const num = Number(experience);
    if (isNaN(num)) return "Years of experience must be a valid number";

    // Check for decimals
    if (!Number.isInteger(num))
      return "Years of experience must be a whole number (no decimals)";

    // Check for negative numbers
    if (num < 0) return "Years of experience cannot be negative";

    // Check minimum and maximum
    if (num < 0) return "Years of experience must be at least 0";
    if (num > 50) return "Years of experience cannot exceed 50";

    return null;
  };

  const handleExperienceBlur = () => {
    const error = validateExperience(formData.years_of_experience);
    setExperienceError(error);
  };

  // Validate bio
  const validateBio = (bio: string): string | null => {
    // Bio is optional, so empty is OK
    if (!bio) return null;

    // Check for HTML tags - more specific pattern to avoid false positives with < and >
    // Matches opening tags like <p>, <div>, <span class="x">, etc.
    // Also matches self-closing tags like <br/>, <img/>
    const htmlTagPattern = /<\s*\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/g;
    if (htmlTagPattern.test(bio)) {
      return "Bio cannot contain HTML tags or scripts";
    }

    // Check for script-like content
    if (
      bio.toLowerCase().includes("<script") ||
      bio.toLowerCase().includes("</script>")
    ) {
      return "Bio cannot contain HTML tags or scripts";
    }

    // Check minimum length (if provided, must be at least 50 characters)
    if (bio.trim().length > 0 && bio.trim().length < 50) {
      return "Bio must be at least 50 characters";
    }

    // Check maximum length
    if (bio.length > 1000) return "Bio must not exceed 1000 characters";

    return null;
  };

  const handleBioBlur = () => {
    const error = validateBio(formData.bio);
    setBioError(error);
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

  // Check uniqueness by calling backend endpoint on blur
  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    const formatErr = validateEmailFormat(email);
    if (formatErr) {
      setEmailError(formatErr);
      setEmailAvailable(false);
      return;
    }

    try {
      const params = new URLSearchParams({ email, user_type: "doctor" });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange =
    (documentType: keyof typeof documents) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setDocuments({
          ...documents,
          [documentType]: file,
        });
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Email format + availability checks
    const emailTrimmed = formData.email.trim();
    const emailFormatErr = validateEmailFormat(emailTrimmed);
    if (emailFormatErr) {
      setError(emailFormatErr);
      return;
    }

    if (emailAvailable !== true) {
      // Attempt to check availability now
      await handleEmailBlur();
      if (emailAvailable === false) {
        setError("Email is already registered");
        return;
      }
      if (emailAvailable === null) {
        setError("Unable to validate email. Please try again later.");
        return;
      }
    }

    // Password validation
    const passwordValidationErr = validatePassword(formData.password);
    if (passwordValidationErr) {
      setError(passwordValidationErr);
      setPasswordError(passwordValidationErr);
      return;
    }

    // Name validations
    const firstNameErr = validateName(formData.first_name, "First name", false);
    if (firstNameErr) {
      setError(firstNameErr);
      setFirstNameError(firstNameErr);
      return;
    }

    const lastNameErr = validateName(formData.last_name, "Last name", false);
    if (lastNameErr) {
      setError(lastNameErr);
      setLastNameError(lastNameErr);
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
      return;
    }

    // Date of birth validation
    const dobErr = validateDateOfBirth(formData.date_of_birth);
    if (dobErr) {
      setError(dobErr);
      setDateOfBirthError(dobErr);
      return;
    }

    // Gender validation
    const genderErr = validateGender(formData.gender);
    if (genderErr) {
      setError(genderErr);
      setGenderError(genderErr);
      return;
    }

    // Custom specialty validation (when "Other" is selected)
    if (formData.specialty === "Other") {
      const customSpecialtyErr = validateCustomSpecialty(
        formData.customSpecialty
      );
      if (customSpecialtyErr) {
        setError(customSpecialtyErr);
        setCustomSpecialtyError(customSpecialtyErr);
        return;
      }
    }

    // Phone number validation
    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) {
      setError(phoneErr);
      setPhoneError(phoneErr);
      return;
    }

    // License number validation
    const licenseErr = validateLicense(formData.license_number);
    if (licenseErr) {
      setError(licenseErr);
      setLicenseError(licenseErr);
      return;
    }

    // Years of experience validation
    const experienceErr = validateExperience(formData.years_of_experience);
    if (experienceErr) {
      setError(experienceErr);
      setExperienceError(experienceErr);
      return;
    }

    // Bio validation (optional field, but validate if provided)
    const bioErr = validateBio(formData.bio);
    if (bioErr) {
      setError(bioErr);
      setBioError(bioErr);
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.date_of_birth ||
      !formData.gender ||
      !formData.specialty ||
      !formData.email ||
      !formData.phone ||
      !formData.license_number ||
      !formData.years_of_experience
    ) {
      setError(
        "Please fill in all required fields (except Middle Name and Bio)"
      );
      return;
    }

    // Validate profile picture
    if (!avatarFile) {
      setError("Profile picture is required");
      return;
    }

    // Validate all required documents
    if (!documents.nationalId) {
      setError("Passport/National ID is required");
      return;
    }
    if (!documents.medicalDegree) {
      setError("Medical degree is required");
      return;
    }
    if (!documents.medicalLicense) {
      setError("Medical registration/license is required");
      return;
    }

    // Validate custom specialty
    let finalSpecialty = formData.specialty;
    if (formData.specialty === "Other") {
      if (!formData.customSpecialty.trim()) {
        setError("Please enter a custom specialty");
        return;
      }

      // Check if custom specialty matches any predefined specialty (case-insensitive)
      const matchedSpecialty = specialties.find(
        (s: string) =>
          s.toLowerCase() === formData.customSpecialty.trim().toLowerCase()
      );

      if (matchedSpecialty) {
        setError(
          `"${formData.customSpecialty}" is already in the list. Please select it from the dropdown.`
        );
        return;
      }

      finalSpecialty = formData.customSpecialty.trim();
    }

    setLoading(true);

    try {
      // Use FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("date_of_birth", formData.date_of_birth);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("specialty", finalSpecialty);

      // Add custom specialty information if applicable
      if (formData.specialty === "Other" && formData.customSpecialty.trim()) {
        formDataToSend.append("is_custom_specialty", "true");
        formDataToSend.append(
          "custom_specialty",
          formData.customSpecialty.trim()
        );
      }

      // Add optional fields
      if (formData.middle_name)
        formDataToSend.append("middle_name", formData.middle_name);
      if (formData.phone) formDataToSend.append("phone", formData.phone);
      if (formData.license_number)
        formDataToSend.append("license_number", formData.license_number);
      if (formData.years_of_experience)
        formDataToSend.append(
          "years_of_experience",
          formData.years_of_experience
        );
      if (formData.bio) formDataToSend.append("bio", formData.bio);
      if (avatarFile) formDataToSend.append("avatar", avatarFile);

      // Add all required documents
      if (documents.nationalId)
        formDataToSend.append("national_id", documents.nationalId);
      if (documents.medicalDegree)
        formDataToSend.append("medical_degree", documents.medicalDegree);
      if (documents.medicalLicense)
        formDataToSend.append("medical_license", documents.medicalLicense);
      if (documents.specialistCertificates)
        formDataToSend.append(
          "specialist_certificates",
          documents.specialistCertificates
        );
      if (documents.proofOfPractice)
        formDataToSend.append("proof_of_practice", documents.proofOfPractice);
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/doctor/register/",
        {
          method: "POST",
          body: formDataToSend,
        }
      );
      console.log(
        "[Register] Response headers:",
        response.headers.get("content-type")
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        await response.text();
        throw new Error(
          "Server returned an invalid response. Please check if the API endpoint exists."
        );
      }

      const data = await response.json();
      if (response.ok) {
        // Update AuthContext with doctor data
        login(data.doctor, "doctor");
        // Navigate to doctor dashboard
        navigate("/doctor/dashboard");
      } else {
        // Handle different error formats
        if (data.error) {
          setError(data.error);
        } else if (data.detail) {
          setError(data.detail);
        } else if (typeof data === "object") {
          // Handle field-specific errors
          const errorMessages = Object.entries(data)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
            )
            .join("\n");
          setError(errorMessages || "Registration failed. Please try again.");
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } catch (err: any) {
      setError(
        err.message ||
          "An error occurred. Please check the console and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-teal-900 to-blue-900 relative overflow-hidden">
      {/* Animated Gradient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-teal-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-teal-400/30 to-blue-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-cyan-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float-slow"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <div className="relative bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl p-8 w-full max-w-2xl">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-3xl blur-lg opacity-20"></div>

          <div className="relative">
            {/* Back Button */}
            <Link
              to="/doctor/login"
              className="inline-flex items-center text-sm text-white/60 hover:text-cyan-400 mb-6 transition-colors font-medium group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Link>

            {/* Header with Medical Theme */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl blur-md animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Stethoscope className="w-12 h-12 text-white" />
                </div>
              </div>

              <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-bold rounded-full mb-3 shadow-lg uppercase tracking-wider">
                ⚕ Medical Professional
              </div>

              <h1 className="text-4xl font-bold text-white mb-2">
                Doctor Registration
              </h1>
              <p className="text-white/60">
                Join our network of healthcare professionals
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start mb-6 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-200 whitespace-pre-line font-medium">
                  {error}
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Account Information
                </h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-white/40" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${emailError ? "border-red-500" : "border-white/10"}`}
                        placeholder="doctor@example.com"
                        required
                      />
                      {emailError && (
                        <p className="text-sm text-red-400 mt-1">
                          {emailError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-white/40" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handlePasswordBlur}
                          className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${passwordError ? "border-red-500" : "border-white/10"}`}
                          placeholder="Min. 8 characters"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {passwordError && (
                        <p className="text-sm text-red-400 mt-1">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-white/40" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-10 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition"
                          placeholder="Re-enter password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-gray-600"
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
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h3>
                <div className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        onBlur={handleFirstNameBlur}
                        className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${firstNameError ? "border-red-500" : "border-white/10"}`}
                        placeholder="Ahmed"
                        required
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
                        className="block text-sm font-medium text-white mb-2"
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
                        className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${middleNameError ? "border-red-500" : "border-white/10"}`}
                        placeholder="Ali"
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
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        onBlur={handleLastNameBlur}
                        className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${lastNameError ? "border-red-500" : "border-white/10"}`}
                        placeholder="Khan"
                        required
                      />
                      {lastNameError && (
                        <p className="text-sm text-red-400 mt-1">
                          {lastNameError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date of Birth and Gender */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="date_of_birth"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="date_of_birth"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        onBlur={handleDateOfBirthBlur}
                        className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${dateOfBirthError ? "border-red-500" : "border-white/10"}`}
                        required
                      />
                      {dateOfBirthError && (
                        <p className="text-sm text-red-400 mt-1">
                          {dateOfBirthError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="gender"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        onBlur={handleGenderBlur}
                        className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${genderError ? "border-red-500" : "border-white/10"}`}
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {genderError && (
                        <p className="text-sm text-red-400 mt-1">
                          {genderError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specialty and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="specialty"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Specialty <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <Award className="h-5 w-5 text-white/40" />
                        </div>
                        <select
                          id="specialty"
                          name="specialty"
                          value={formData.specialty}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition appearance-none bg-white"
                          required
                          disabled={loadingSpecialties}
                        >
                          <option value="">
                            {loadingSpecialties
                              ? "Loading specialties..."
                              : "Select a specialty..."}
                          </option>
                          {specialties.map((specialty: string) => (
                            <option key={specialty} value={specialty}>
                              {specialty}
                            </option>
                          ))}
                          <option value="Other">Other (Please specify)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-white/40" />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handlePhoneBlur}
                          className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${
                            phoneError ? "border-red-500" : "border-white/10"
                          }`}
                          placeholder="03001234567"
                          required
                        />
                      </div>
                      {phoneError && (
                        <p className="mt-1 text-sm text-red-400">
                          {phoneError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Custom Specialty Input (shown when "Other" is selected) */}
                  {showCustomSpecialty && (
                    <div>
                      <label
                        htmlFor="customSpecialty"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Enter Custom Specialty{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="customSpecialty"
                        name="customSpecialty"
                        value={formData.customSpecialty}
                        onChange={handleChange}
                        onBlur={handleCustomSpecialtyBlur}
                        className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${
                          customSpecialtyError
                            ? "border-red-500"
                            : "border-white/10"
                        }`}
                        placeholder="Enter your specialty"
                        required
                      />
                      {customSpecialtyError && (
                        <p className="mt-1 text-sm text-red-400">
                          {customSpecialtyError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Professional Information
                </h3>
                <div className="space-y-4">
                  {/* License and Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="license_number"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        License Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="license_number"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleChange}
                        onBlur={handleLicenseBlur}
                        className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${
                          licenseError ? "border-red-500" : "border-white/10"
                        }`}
                        placeholder="MED123456"
                        required
                      />
                      {licenseError && (
                        <p className="mt-1 text-sm text-red-400">
                          {licenseError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="years_of_experience"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Years of Experience{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="years_of_experience"
                        name="years_of_experience"
                        value={formData.years_of_experience}
                        onChange={handleChange}
                        onBlur={handleExperienceBlur}
                        className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition ${
                          experienceError ? "border-red-500" : "border-white/10"
                        }`}
                        placeholder="5"
                        min="0"
                        max="50"
                        step="1"
                        required
                      />
                      {experienceError && (
                        <p className="mt-1 text-sm text-red-400">
                          {experienceError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Bio{" "}
                      <span className="text-gray-500">
                        (Min 50, Max 1000 characters)
                      </span>
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      onBlur={handleBioBlur}
                      rows={4}
                      maxLength={1000}
                      className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition resize-none ${
                        bioError ? "border-red-500" : "border-white/10"
                      }`}
                      placeholder="Tell us about yourself and your experience... (minimum 50 characters)"
                    />
                    <div className="flex justify-between items-start mt-1">
                      <div>
                        {bioError && (
                          <p className="text-sm text-red-400">{bioError}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formData.bio.length}/1000
                      </p>
                    </div>
                  </div>

                  {/* Avatar Upload */}
                  <div>
                    <label
                      htmlFor="avatar"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Profile Picture <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-4">
                      {avatarPreview && (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
                        />
                      )}
                      <label htmlFor="avatar" className="cursor-pointer flex-1">
                        <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/10 rounded-lg hover:border-cyan-500 transition">
                          <Upload className="h-5 w-5 text-white/40 mr-2" />
                          <span className="text-sm text-gray-600">
                            {avatarFile
                              ? avatarFile.name
                              : "Choose a profile picture"}
                          </span>
                        </div>
                        <input
                          type="file"
                          id="avatar"
                          name="avatar"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Passport/National ID Upload */}
                  <div>
                    <label
                      htmlFor="nationalId"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Passport/National ID{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <label htmlFor="nationalId" className="cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/10 rounded-lg hover:border-cyan-500 transition">
                        <Upload className="h-5 w-5 text-white/40 mr-2" />
                        <span className="text-sm text-gray-600">
                          {documents.nationalId
                            ? documents.nationalId.name
                            : "Upload Passport/National ID"}
                        </span>
                      </div>
                      <input
                        type="file"
                        id="nationalId"
                        name="nationalId"
                        accept="image/*,application/pdf"
                        onChange={handleDocumentChange("nationalId")}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Medical Degree Upload */}
                  <div>
                    <label
                      htmlFor="medicalDegree"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Medical Degree <span className="text-red-500">*</span>
                    </label>
                    <label htmlFor="medicalDegree" className="cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/10 rounded-lg hover:border-cyan-500 transition">
                        <Upload className="h-5 w-5 text-white/40 mr-2" />
                        <span className="text-sm text-gray-600">
                          {documents.medicalDegree
                            ? documents.medicalDegree.name
                            : "Upload Medical Degree"}
                        </span>
                      </div>
                      <input
                        type="file"
                        id="medicalDegree"
                        name="medicalDegree"
                        accept="image/*,application/pdf"
                        onChange={handleDocumentChange("medicalDegree")}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Medical License Upload */}
                  <div>
                    <label
                      htmlFor="medicalLicense"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Medical Registration/License{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <label htmlFor="medicalLicense" className="cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/10 rounded-lg hover:border-cyan-500 transition">
                        <Upload className="h-5 w-5 text-white/40 mr-2" />
                        <span className="text-sm text-gray-600">
                          {documents.medicalLicense
                            ? documents.medicalLicense.name
                            : "Upload Medical Registration/License"}
                        </span>
                      </div>
                      <input
                        type="file"
                        id="medicalLicense"
                        name="medicalLicense"
                        accept="image/*,application/pdf"
                        onChange={handleDocumentChange("medicalLicense")}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Specialist Certificates Upload */}
                  <div>
                    <label
                      htmlFor="specialistCertificates"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Specialist Certificates{" "}
                      <span className="text-white/40 text-xs">(Optional)</span>
                    </label>
                    <label
                      htmlFor="specialistCertificates"
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/10 rounded-lg hover:border-cyan-500 transition">
                        <Upload className="h-5 w-5 text-white/40 mr-2" />
                        <span className="text-sm text-gray-600">
                          {documents.specialistCertificates
                            ? documents.specialistCertificates.name
                            : "Upload Specialist Certificates"}
                        </span>
                      </div>
                      <input
                        type="file"
                        id="specialistCertificates"
                        name="specialistCertificates"
                        accept="image/*,application/pdf"
                        onChange={handleDocumentChange(
                          "specialistCertificates"
                        )}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Proof of Practice Upload */}
                  <div>
                    <label
                      htmlFor="proofOfPractice"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Proof of Practice{" "}
                      <span className="text-white/40 text-xs">(Optional)</span>
                    </label>
                    <label htmlFor="proofOfPractice" className="cursor-pointer">
                      <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/10 rounded-lg hover:border-cyan-500 transition">
                        <Upload className="h-5 w-5 text-white/40 mr-2" />
                        <span className="text-sm text-gray-600">
                          {documents.proofOfPractice
                            ? documents.proofOfPractice.name
                            : "Upload Proof of Practice"}
                        </span>
                      </div>
                      <input
                        type="file"
                        id="proofOfPractice"
                        name="proofOfPractice"
                        accept="image/*,application/pdf"
                        onChange={handleDocumentChange("proofOfPractice")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative flex justify-center items-center py-4 px-4 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative flex items-center">
                    {loading ? (
                      "Creating Account..."
                    ) : (
                      <>
                        <Stethoscope className="w-5 h-5 mr-2" />
                        Register as Doctor
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
                    to="/doctor/login"
                    className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
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

export default DoctorRegister;
