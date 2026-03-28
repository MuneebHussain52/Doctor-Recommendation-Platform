import React, { useState, useRef, useEffect } from "react";
import { Bell, Menu, ChevronDown, User, LogOut, X } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  toggleMobileSidebar: () => void;
  name: string;
  avatar: string;
  notificationRefreshTrigger: number;
}

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Header: React.FC<HeaderProps> = ({
  toggleMobileSidebar,
  name,
  avatar,
  notificationRefreshTrigger,
}) => {
  const { t } = useLanguage();
  const { patient } = useAuth();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "system" | "booking">(
    "all"
  );
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!patient?.id) return;

      try {
        const response = await fetch(
          `http://localhost:8000/api/notifications/for_user/?user_type=patient&user_id=${patient.id}`
        );
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("[Header] Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
  }, [patient, notificationRefreshTrigger]);

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

  const removeNotification = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/notifications/${id}/`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("[Header] Failed to delete notification:", error);
    }
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
      console.error("[Header] Failed to clear notifications:", error);
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
      console.error("[Header] Failed to mark notification as read:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientUser");
    setIsUserDropdownOpen(false);
    navigate("/patient/login");
  };

  const handleProfileClick = () => {
    setIsUserDropdownOpen(false);
    navigate("/patient/profile");
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
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 md:pl-0">
        <h1 className="text-lg font-bold text-cyan-800  ml-3 ">
          {t("nav.patientPortal")}
        </h1>
        {/* Mobile: Menu button and title */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
            onClick={toggleMobileSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-3 rtl:mr-3 rtl:ml-0">
            <h1 className="text-lg font-semibold text-gray-900">
              {t("header.patientDash")}
            </h1>
          </div>
        </div>

        {/* Desktop: Empty spacer to push content right */}
        <div className="hidden md:block flex-1"></div>

        {/* Right side content - both mobile and desktop */}
        <div className="flex items-center space-x-4 rtl:space-x-reverse md:pr-4 lg:pr-8">
          {/* Notification Bell */}
          <div className="relative notification-dropdown" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none relative"
              aria-label="Show notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 rtl:left-0 rtl:right-auto block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {t("header.notifications")}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        {unreadCount} {t("header.new")}
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
                    {t("header.all")} ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("system")}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === "system"
                        ? "text-cyan-600 border-b-2 border-cyan-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t("header.system")} (
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
                    {t("header.booking")} (
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
                      {t("header.noNotifications")}
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
                      {t("header.clearAll")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative user-dropdown" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center space-x-3 text-sm focus:outline-none"
              aria-haspopup="true"
              aria-expanded={isUserDropdownOpen}
            >
              {avatar ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={avatar}
                  alt={name}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {getInitials(name)}
                  </span>
                </div>
              )}
              <div className="hidden md:flex md:items-center">
                <span className="text-sm font-medium text-gray-700">
                  {name}
                </span>
                <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
              </div>
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {t("header.patient")}
                  </p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-2" />
                  {t("Profile") || "Profile"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
