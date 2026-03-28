import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: "admin" | "doctor" | "patient";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredUserType,
}) => {
  const { isAuthenticated, loading, userType } = useAuth();
  const location = useLocation();

  // Check for admin authentication separately
  const adminToken = localStorage.getItem("adminToken");
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle admin routes
  if (isAdminRoute) {
    if (!adminToken) {
      return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
  }

  // Handle doctor and patient routes
  if (!isAuthenticated) {
    // Redirect to appropriate login page based on the path
    const loginPath = location.pathname.startsWith("/patient")
      ? "/patient/login"
      : "/doctor/login";
    return <Navigate to={loginPath} replace />;
  }

  // Check if user is trying to access the correct dashboard based on requiredUserType
  if (requiredUserType && userType !== requiredUserType) {
    // Redirect to their correct dashboard
    if (userType === "doctor") {
      return <Navigate to="/doctor/dashboard" replace />;
    } else if (userType === "patient") {
      return <Navigate to="/patient/dashboard" replace />;
    }
  }

  // Legacy checks for backward compatibility
  if (location.pathname.startsWith("/doctor") && userType !== "doctor") {
    return <Navigate to="/patient/dashboard" replace />;
  }

  if (location.pathname.startsWith("/patient") && userType !== "patient") {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
