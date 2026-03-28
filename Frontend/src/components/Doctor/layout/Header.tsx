import React, { useState, useEffect, useRef } from "react";
import { useProfile } from "../../../context/ProfileContext";
import {
  Bell,
  ChevronDown,
  User,
  LogOut,
  Ban,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  toggleMobileSidebar: () => void;
}

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar }) => {
  const { doctor, updateDoctor } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "system" | "booking">(
    "all"
  );
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);
  const [hasPricing, setHasPricing] = useState<boolean | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch doctor data to get latest blocking status
  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!doctor?.id) return;

      try {
        const response = await fetch(
          `http://localhost:8000/api/doctors/${doctor.id}/`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.is_blocked !== undefined) {
            updateDoctor({
              is_blocked: data.is_blocked,
              block_reason: data.block_reason,
              blocked_at: data.blocked_at,
            });
          }
        }
      } catch (error) {
        console.error("[Doctor Header] Failed to fetch doctor data:", error);
      }
    };

    fetchDoctorData();
  }, [doctor?.id]);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!doctor?.id) return;

      try {
        const response = await fetch(
          `http://localhost:8000/api/notifications/for_user/?user_type=doctor&user_id=${doctor.id}`
        );
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("[Doctor Header] Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, [doctor]);

  // Check if doctor has bank account and pricing
  useEffect(() => {
    const checkBankAccountAndPricing = async () => {
      if (!doctor?.id) return;

      try {
        // Check bank accounts
        const bankResponse = await fetch(
          `http://localhost:8000/api/doctor-bank-accounts/?doctor_id=${doctor.id}`
        );
        const bankData = await bankResponse.json();
        // Handle paginated response
        const accountsArray = bankData.results || bankData;
        const hasAccounts = Array.isArray(accountsArray)
          ? accountsArray.length > 0
          : false;
        console.log("[Header] Bank accounts check:", {
          accountsArray,
          hasAccounts,
        });
        setHasBankAccount(hasAccounts);

        // Check pricing
        const pricingResponse = await fetch(
          `http://localhost:8000/api/doctor-pricing/?doctor_id=${doctor.id}`
        );
        const pricingData = await pricingResponse.json();
        const pricingArray = pricingData.results || pricingData;
        const pricing = Array.isArray(pricingArray)
          ? pricingArray[0]
          : pricingData;
        // Check both field naming conventions for compatibility
        const onlineFee =
          pricing?.online_consultation_fee || pricing?.online_fee || 0;
        const inPersonFee =
          pricing?.in_person_consultation_fee || pricing?.in_person_fee || 0;
        const hasPricingSet = pricing && onlineFee > 0 && inPersonFee > 0;
        console.log("[Header] Pricing check:", {
          pricing,
          onlineFee,
          inPersonFee,
          hasPricingSet,
        });
        setHasPricing(hasPricingSet);
      } catch (error) {
        console.error(
          "[Doctor Header] Failed to check bank accounts or pricing:",
          error
        );
      }
    };

    checkBankAccountAndPricing();

    // Poll every 5 seconds to check for updates
    const interval = setInterval(checkBankAccountAndPricing, 5000);

    return () => clearInterval(interval);
  }, [doctor]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".notification-dropdown")) {
        setShowNotifications(false);
      }
      if (!target.closest(".user-dropdown")) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.notification_type === activeTab);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const clearAllNotifications = async () => {
    try {
      await Promise.all(
        filteredNotifications.map((n) =>
          fetch(`http://localhost:8000/api/notifications/${n.id}/`, {
            method: "DELETE",
          })
        )
      );

      if (activeTab === "all") {
        setNotifications([]);
      } else {
        setNotifications((prev) =>
          prev.filter((n) => n.notification_type !== activeTab)
        );
      }
    } catch (error) {
      console.error("[Doctor Header] Failed to clear notifications:", error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/notifications/${id}/`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("[Doctor Header] Failed to delete notification:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(
        `http://localhost:8000/api/notifications/${id}/mark_as_read/`,
        {
          method: "POST",
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error(
        "[Doctor Header] Failed to mark notification as read:",
        error
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctorUser");
    setIsUserDropdownOpen(false);
    navigate("/doctor/login");
  };

  const handleProfileClick = () => {
    setIsUserDropdownOpen(false);
    navigate("/doctor/profile");
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "system":
        return "bg-blue-100 text-blue-800";
      case "booking":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "D";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const { profilePic, firstName, middleName, lastName, specialization } =
    useProfile();
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  const displayName = fullName || "Doctor";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-lg font-semibold text-cyan-800">Doctor Portal</h1>
        <div className="flex-1 mx-4">
          <div className="flex items-center gap-3">
            {doctor?.is_blocked && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                  <Ban className="h-3 w-3 mr-1" />
                  BLOCKED
                </span>
                {doctor?.block_reason && (
                  <button
                    onClick={() => setShowBlockReasonModal(true)}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    View Reason
                  </button>
                )}
              </div>
            )}
            {hasBankAccount === false && (
              <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-semibold">
                  Profile Hidden - No Payment Method
                </span>
                <button
                  onClick={() =>
                    navigate("/doctor/payments", {
                      state: { openBanksTab: true },
                    })
                  }
                  className="ml-2 px-2 py-0.5 bg-white text-red-600 text-xs font-semibold rounded hover:bg-red-50"
                >
                  Add Now
                </button>
              </div>
            )}
            {hasBankAccount === true && hasPricing === false && (
              <div className="flex items-center gap-2 bg-amber-600 text-white px-3 py-1.5 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-semibold">
                  Profile Hidden - Consultation Fees Not Set
                </span>
                <button
                  onClick={() =>
                    navigate("/doctor/payments", {
                      state: { openPricingTab: true },
                    })
                  }
                  className="ml-2 px-2 py-0.5 bg-white text-amber-600 text-xs font-semibold rounded hover:bg-amber-50"
                >
                  Set Now
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Notifications */}
          <div className="relative notification-dropdown" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === "all"
                        ? "text-cyan-600 border-b-2 border-cyan-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("system")}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === "system"
                        ? "text-cyan-600 border-b-2 border-cyan-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    System (
                    {
                      notifications.filter(
                        (n) => n.notification_type === "system"
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setActiveTab("booking")}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === "booking"
                        ? "text-cyan-600 border-b-2 border-cyan-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Booking (
                    {
                      notifications.filter(
                        (n) => n.notification_type === "booking"
                      ).length
                    }
                    )
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {filteredNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                          !notification.is_read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(
                                  notification.notification_type
                                )}`}
                              >
                                {notification.notification_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  notification.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p
                              className={`text-sm ${
                                !notification.is_read
                                  ? "font-semibold text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-500 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-200">
                  {filteredNotifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative user-dropdown" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center space-x-3 text-sm focus:outline-none"
              aria-haspopup="true"
              aria-expanded={isUserDropdownOpen}
            >
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {getInitials(displayName)}
                  </span>
                </div>
              )}
              <div className="hidden md:flex md:items-center">
                <span className="text-sm font-medium text-gray-700">
                  Dr. {displayName}
                </span>
                <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
              </div>
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Dr. {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {specialization || "Specialization"}
                  </p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </button>
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
    </header>
  );
};

export default Header;
