import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  Users,
  Calendar,
  BarChart2,
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  User,
  CheckCircle,
  Shield,
  Banknote,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    name: "Approvals",
    href: "/admin/approvals",
    icon: CheckCircle,
    badge: true,
  },
  { name: "Doctors", href: "/admin/doctors", icon: UserRound },
  { name: "Patients", href: "/admin/patients", icon: Users },
  { name: "Appointments", href: "/admin/appointments", icon: Calendar },
  { name: "Audit Log", href: "/admin/audit-log", icon: Shield },
  { name: "Reports", href: "/admin/reports", icon: BarChart2 },
  { name: "Payments", href: "/admin/payments", icon: Banknote },
  { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "system" | "booking">(
    "all"
  );

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!adminUser?.id) return;

      try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(
          `http://localhost:8000/api/notifications/for_user/?user_type=admin&user_id=${adminUser.id}`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("[Admin Layout] Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [adminUser]);

  useEffect(() => {
    // Load admin user from localStorage
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAdminUser(parsedUser);
        // Set profile picture URL - handle both relative and absolute URLs
        if (parsedUser.profile_picture) {
          // If it's a relative URL from backend, prepend the API base URL
          if (
            parsedUser.profile_picture.startsWith("/media/") ||
            parsedUser.profile_picture.startsWith("media/")
          ) {
            setProfilePictureUrl(
              `http://127.0.0.1:8000${
                parsedUser.profile_picture.startsWith("/") ? "" : "/"
              }${parsedUser.profile_picture}`
            );
          } else {
            setProfilePictureUrl(parsedUser.profile_picture);
          }
        } else {
          setProfilePictureUrl("");
        }
      } catch (error) {
        console.error("Error parsing admin user:", error);
      }
    }
  }, []);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log("Profile updated event received:", event.detail);
      const updatedUser = event.detail;
      setAdminUser(updatedUser);

      // Update profile picture URL
      if (updatedUser.profile_picture) {
        if (
          updatedUser.profile_picture.startsWith("/media/") ||
          updatedUser.profile_picture.startsWith("media/")
        ) {
          setProfilePictureUrl(
            `http://127.0.0.1:8000${
              updatedUser.profile_picture.startsWith("/") ? "" : "/"
            }${updatedUser.profile_picture}`
          );
        } else {
          setProfilePictureUrl(updatedUser.profile_picture);
        }
      } else {
        setProfilePictureUrl("");
      }
    };

    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("adminUser");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("Storage changed, updating user:", parsedUser);
          setAdminUser(parsedUser);

          // Update profile picture URL
          if (parsedUser.profile_picture) {
            if (
              parsedUser.profile_picture.startsWith("/media/") ||
              parsedUser.profile_picture.startsWith("media/")
            ) {
              setProfilePictureUrl(
                `http://127.0.0.1:8000${
                  parsedUser.profile_picture.startsWith("/") ? "" : "/"
                }${parsedUser.profile_picture}`
              );
            } else {
              setProfilePictureUrl(parsedUser.profile_picture);
            }
          } else {
            setProfilePictureUrl("");
          }
        } catch (error) {
          console.error("Error parsing admin user:", error);
        }
      }
    };

    window.addEventListener(
      "profileUpdated",
      handleProfileUpdate as EventListener
    );
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "profileUpdated",
        handleProfileUpdate as EventListener
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-dropdown")) {
        setIsUserDropdownOpen(false);
      }
      if (!target.closest(".notification-dropdown")) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    // Close dropdown
    setIsUserDropdownOpen(false);

    // Redirect to login
    navigate("/");
  };

  const handleProfileClick = () => {
    setIsUserDropdownOpen(false);
    navigate("/admin/profile");
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(
        `http://localhost:8000/api/notifications/${id}/mark_as_read/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error(
        "[Admin Layout] Failed to mark notification as read:",
        error
      );
    }
  };

  const removeNotification = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`http://localhost:8000/api/notifications/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("[Admin Layout] Failed to delete notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const filteredNotifications =
        activeTab === "all"
          ? notifications
          : notifications.filter((n) => n.notification_type === activeTab);

      await Promise.all(
        filteredNotifications.map((n) =>
          fetch(`http://localhost:8000/api/notifications/${n.id}/`, {
            method: "DELETE",
            headers: {
              Authorization: `Token ${token}`,
            },
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
      console.error("[Admin Layout] Failed to clear notifications:", error);
    }
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

  const formatNotificationTime = (timeString: string) => {
    if (!timeString) return "Recently";

    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return "Recently";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.notification_type === activeTab);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getInitials = (name: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = adminUser?.full_name || adminUser?.email || "Admin User";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600/75"
          onClick={() => setSidebarOpen(false)}
        ></div>
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 h-16 border-b">
            <NavLink
              to="/admin"
              className="text-xl font-semibold text-blue-600 hover:text-blue-700"
              onClick={() => setSidebarOpen(false)}
            >
              MedAdmin
            </NavLink>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === "/admin"}
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    } 
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
              <NavLink
                to="/admin"
                className="text-xl font-semibold text-blue-600 hover:text-blue-700"
              >
                Medora
              </NavLink>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/admin"}
                    className={({ isActive }) =>
                      `${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      } 
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User section at bottom of sidebar */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top nav for mobile */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6 text-gray-500" />
              </button>
              <NavLink
                to="/admin"
                className="ml-3 text-xl font-semibold text-blue-600 hover:text-blue-700"
              >
                Medora
                <p className="text-xs text-gray-500">{"nav.patientPortal"}</p>
              </NavLink>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-bold text-cyan-800  ml-3">
                Admin Portal
              </h1>
              {/* Notifications */}
              <div className="relative notification-dropdown">
                <button
                  onClick={handleNotificationClick}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>
                {isNotificationOpen && (
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
                            ? "text-blue-600 border-b-2 border-blue-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("system")}
                        className={`flex-1 px-4 py-2 text-sm font-medium ${
                          activeTab === "system"
                            ? "text-blue-600 border-b-2 border-blue-600"
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
                            ? "text-blue-600 border-b-2 border-blue-600"
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
                                    {formatNotificationTime(
                                      notification.created_at
                                    )}
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
              <div className="relative user-dropdown">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center text-sm focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={isUserDropdownOpen}
                >
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover"
                      key={profilePictureUrl}
                      onError={(e) => {
                        console.error(
                          "Error loading profile picture:",
                          profilePictureUrl
                        );
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {getInitials(displayName)}
                      </span>
                    </div>
                  )}
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {adminUser?.email}
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
        </div>

        {/* Header for desktop */}
        <header className="bg-white shadow-sm hidden lg:block">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-cyan-800">
                Admin Portal
              </h2>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications */}
              <div className="relative notification-dropdown">
                <button
                  onClick={handleNotificationClick}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none relative"
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>
                {isNotificationOpen && (
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
                            ? "text-blue-600 border-b-2 border-blue-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("system")}
                        className={`flex-1 px-4 py-2 text-sm font-medium ${
                          activeTab === "system"
                            ? "text-blue-600 border-b-2 border-blue-600"
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
                            ? "text-blue-600 border-b-2 border-blue-600"
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
                                    {formatNotificationTime(
                                      notification.created_at
                                    )}
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
              <div className="relative user-dropdown">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-3 text-sm focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={isUserDropdownOpen}
                >
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover"
                      key={profilePictureUrl}
                      onError={(e) => {
                        console.error(
                          "Error loading profile picture:",
                          profilePictureUrl
                        );
                        e.currentTarget.style.display = "none";
                      }}
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
                      {displayName}
                    </span>
                    <ChevronDown
                      className="ml-1 h-4 w-4 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {adminUser?.email}
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
        </header>

        {/* Main content */}
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
