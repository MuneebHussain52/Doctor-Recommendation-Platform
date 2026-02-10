import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Stethoscope,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/doctor/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Update AuthContext with doctor data
        login(data.doctor, "doctor");
        // Navigate to doctor dashboard
        navigate("/doctor/dashboard");
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(
        "An error occurred. Please try again later. Check console for details."
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

      {/* Main Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl p-8 w-full max-w-md">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-3xl blur-lg opacity-20"></div>

          <div className="relative">
            {/* Back Button */}
            <Link
              to="/"
              className="inline-flex items-center text-sm text-white/60 hover:text-cyan-400 mb-6 transition-colors font-medium group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl blur-md animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Stethoscope className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-600 text-white text-xs font-bold rounded-full mb-3 shadow-lg">
                ⚕ MEDICAL PROFESSIONAL
              </div>

              <h1 className="text-4xl font-bold text-white mb-2">
                Doctor Login
              </h1>
              <p className="text-white/60 text-sm">
                Sign in to access your medical dashboard
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

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200 backdrop-blur-sm"
                  placeholder="doctor@example.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200 backdrop-blur-sm"
                    placeholder="Enter your password"
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
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative flex justify-center items-center py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative flex items-center">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Stethoscope className="w-5 h-5 mr-2" />
                        Sign In
                      </>
                    )}
                  </span>
                </button>
              </div>

              {/* Register Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-white/60">
                  Don't have an account?{" "}
                  <Link
                    to="/doctor/register"
                    className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Create account
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

export default DoctorLogin;
