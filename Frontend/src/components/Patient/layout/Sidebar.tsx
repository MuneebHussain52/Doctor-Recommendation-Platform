import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Stethoscope,
  UserCheck,
  Calendar,
  FileText,
  MessageSquare,
  Mail,
  User,
  LogOut,
  Banknote,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import LanguageToggle from "../../common/LanguageToggle";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logout, patient } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingPaymentRequests, setPendingPaymentRequests] = useState(0);

  const navigation = [
    {
      name: t("nav.dashboard"),
      href: "/patient/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: t("nav.submitSymptoms"),
      href: "/patient/symptoms",
      icon: Stethoscope,
    },
    {
      name: t("nav.bookAppointment"),
      href: "/patient/recommendations",
      icon: UserCheck,
    },
    {
      name: t("nav.appointments"),
      href: "/patient/appointments",
      icon: Calendar,
    },
    { name: t("nav.documents"), href: "/patient/documents", icon: FileText },
    { name: t("nav.messages"), href: "/patient/messages", icon: Mail },
    { name: t("nav.feedback"), href: "/patient/feedback", icon: MessageSquare },
    { name: t("nav.payments"), href: "/patient/payments", icon: Banknote, badge: pendingPaymentRequests },
    { name: t("nav.profile"), href: "/patient/profile", icon: User },
  ];

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!patient?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/messages/conversations/?user_type=patient&user_id=${patient.id}`
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
  const fetchPaymentRequestsCount = async () => {
    if (!patient?.id) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/payment-requests/?patient_id=${patient.id}`
      );

      if (response.ok) {
        const data = await response.json();
        const requests = data.results || data;
        const pendingCount = requests.filter((req: any) => req.status === 'pending').length;
        setPendingPaymentRequests(pendingCount);
      }
    } catch (error) {
      console.error("Failed to fetch payment requests:", error);
    }
  };

  // Poll for unread count and payment requests every 10 seconds
  useEffect(() => {
    fetchUnreadCount();
    fetchPaymentRequestsCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPaymentRequestsCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [patient]);

  return (
    <div className="h-full bg-white border-r border-gray-200 w-64 flex-shrink-0 hidden md:flex flex-col">
      {/* Logo - Clickable */}
      <button
        onClick={() => navigate("/patient/dashboard")}
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
            const isActive = location.pathname === item.href;
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
                  {item.name === t("nav.messages") && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  {item.name === t("nav.payments") && pendingPaymentRequests > 0 && (
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

      <div className="p-4 border-t border-gray-200 space-y-2">
        <LanguageToggle />
        <button
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md w-full transition-colors"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          {t("Logout")}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
