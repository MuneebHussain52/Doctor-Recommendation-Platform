import React from "react";
import { AlertCircle, Calendar, UserX, UserPlus, Clock } from "lucide-react";

interface Alert {
  type: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  link: string;
}

interface AlertsListProps {
  alerts: Alert[];
}

const AlertsList: React.FC<AlertsListProps> = ({ alerts }) => {
  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "danger":
        return "bg-red-50 border-red-200 text-red-800";
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "fa-calendar-check":
        return <Calendar className="h-5 w-5" />;
      case "fa-calendar-day":
        return <Calendar className="h-5 w-5" />;
      case "fa-user-md":
        return <UserX className="h-5 w-5" />;
      case "fa-user-plus":
        return <UserPlus className="h-5 w-5" />;
      case "fa-clock":
        return <Clock className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const formatAlertTime = (timeString: string) => {
    if (!timeString || timeString === "Invalid Date" || timeString === "N/A") {
      return "Recently";
    }

    try {
      const date = new Date(timeString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Recently";
      }

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
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-5 text-center text-gray-500">
        No alerts at this time
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {alerts.map((alert, index) => (
        <div key={index} className="p-5 hover:bg-gray-50">
          <div className={`rounded-lg border p-4 ${getAlertColor(alert.type)}`}>
            <div className="flex">
              <div className="flex-shrink-0">{getIcon(alert.icon)}</div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">{alert.title}</h3>
                <div className="mt-2 text-sm">
                  <p>{alert.message}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs">{formatAlertTime(alert.time)}</span>
                  <a
                    href={alert.link}
                    className="text-sm font-medium hover:underline"
                  >
                    View details →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertsList;
