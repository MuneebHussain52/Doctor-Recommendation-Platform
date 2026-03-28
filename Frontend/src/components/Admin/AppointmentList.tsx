import React from "react";
import { Calendar, Clock, Video, MapPin } from "lucide-react";

interface Appointment {
  id: string;
  doctor_name: string;
  patient_name: string;
  doctor_specialty: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  appointment_mode: string;
  status: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
  limit?: number;
}

const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  limit,
}) => {
  const displayAppointments = limit
    ? appointments.slice(0, limit)
    : appointments;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div className="p-5 text-center text-gray-500">No appointments found</div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {displayAppointments.map((appointment) => (
        <div key={appointment.id} className="p-5 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {appointment.patient_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Dr. {appointment.doctor_name} •{" "}
                    {appointment.doctor_specialty}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                <span className="flex items-center">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  {formatDate(appointment.appointment_date)}
                </span>
                <span className="flex items-center">
                  <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  {formatTime(appointment.appointment_time)}
                </span>
                <span className="flex items-center">
                  {appointment.appointment_mode === "online" ? (
                    <Video className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  ) : (
                    <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  )}
                  {appointment.appointment_mode}
                </span>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
              >
                {appointment.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentList;
