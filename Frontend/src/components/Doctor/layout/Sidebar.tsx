import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Banknote,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, doctor } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPaymentRequests, setPendingPaymentRequests] = useState(0);

  const navigation = [
    { name: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { name: "Patients", href: "/doctor/patients", icon: Users },
    { name: "Messages", href: "/doctor/messages", icon: MessageSquare },
    { name: "Payments", href: "/doctor/payments", icon: Banknote },
  ];

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!doctor?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/messages/conversations/?user_type=doctor&user_id=${doctor.id}`
      );

      if (response.ok) {
        const conversations = await response.json();
        const total = conversations.reduce(
          (sum: number, conv: any) => sum + (conv.unread_count || 0),
          0
        );
        setUnreadCount(total);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Fetch pending payment requests count
  const fetchPendingPaymentsCount = async () => {
    if (!doctor?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/payment-requests/?doctor_id=${doctor.id}&status=pending`
      );

      if (response.ok) {
        const data = await response.json();
        const requests = data.results || data;
        setPendingPaymentRequests(
          Array.isArray(requests) ? requests.length : 0
        );
      }
    } catch (error) {
      console.error("Failed to fetch pending payment requests:", error);
    }
  };

  // Poll for unread count and pending payments every 10 seconds
  useEffect(() => {
    fetchUnreadCount();
    fetchPendingPaymentsCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPendingPaymentsCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [doctor]);

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 w-64 flex-shrink-0 hidden md:flex flex-col">
      {/* Logo - Clickable */}
      <button
        onClick={() => navigate("/doctor/dashboard")}
        className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left w-full"
      >
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
            MD
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Medora</h1>
          </div>
        </div>
      </button>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md group transition-all ${
                    isActive
                      ? "bg-cyan-50 text-cyan-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <Icon
                      className={`mr-3 h-5 w-5 transition-colors ${
                        isActive
                          ? "text-cyan-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </div>
                  {item.name === "Messages" && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {item.name === "Payments" && pendingPaymentRequests > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-orange-500 text-white text-xs font-semibold rounded-full">
                      {pendingPaymentRequests}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-100"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
