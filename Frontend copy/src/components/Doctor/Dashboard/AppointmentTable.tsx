import React, { useState } from "react";
import { useAppointmentContext } from "../../../context/AppointmentContext";
import { useDateTimeFormat } from "../../../context/DateTimeFormatContext";
import { useNavigate } from "react-router-dom";

import PatientViewModal from "./PatientViewModal";

const RescheduleModal = ({
  open,
  onClose,
  appointment,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  appointment: any;
  onSubmit: (date: string, time: string, mode: string) => void;
}) => {
  // Convert to ISO date for input type="date"
  const getISODate = (dateStr: string) => {
    // Try to parse common formats like 'Today', 'Tomorrow', or '12 May 2025'
    if (!dateStr) return "";
    if (dateStr.toLowerCase() === "today") {
      return new Date().toISOString().slice(0, 10);
    }
    if (dateStr.toLowerCase() === "tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    }
    // Try to parse '12 May 2025'
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
    return "";
  };

  const [date, setDate] = useState(getISODate(appointment?.date || ""));
  const [time, setTime] = useState(
    appointment?.time
      ? appointment.time.replace(/(am|pm|AM|PM)/, "").trim()
      : ""
  );
  const [mode, setMode] = useState(appointment?.mode || "In-person");
  if (!open || !appointment) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">Reschedule Appointment</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(date, time, mode);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input
              type="time"
              className="w-full border rounded px-3 py-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mode</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              required
            >
              <option value="In-person">In-person</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-cyan-600 text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Appointment {
  id: string;
  patient: {
    name: string;
    avatar?: string;
    age?: number;
    gender?: string;
  };
  date: string;
  time: string;
  type: string;
  location: string;
  mode?: string; // e.g., 'Online', 'In-person'
  status: "upcoming" | "completed" | "cancelled";
}

interface AppointmentTableProps {
  appointments: Appointment[];
}

const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
  // Accepts 'Today', 'Tomorrow', or '12 May 2025' and time like '9:00 AM' or '13:00'
  let dateObj: Date;
  if (!dateStr) return null;
  if (dateStr.toLowerCase() === "today") {
    dateObj = new Date();
  } else if (dateStr.toLowerCase() === "tomorrow") {
    dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + 1);
  } else {
    // Try to parse '12 May 2025'
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    } else {
      return null;
    }
  }
  // Set time
  if (timeStr) {
    let h = 0,
      m = 0;
    if (timeStr.includes(":")) {
      let [hStr, mStr] = timeStr.split(":");
      // Remove non-digits from minutes and handle AM/PM
      let minStr = mStr.replace(/\D/g, "");
      h = parseInt(hStr, 10);
      m = parseInt(minStr, 10);
      // Handle AM/PM
      const ampm = mStr.toLowerCase().includes("pm")
        ? "pm"
        : mStr.toLowerCase().includes("am")
        ? "am"
        : "";
      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;
    }
    dateObj.setHours(h, m, 0, 0);
  }
  return dateObj;
};

const AppointmentTable: React.FC<AppointmentTableProps> = () => {
  // Use context for real-time sync
  const { appointments, setAppointments } = useAppointmentContext();
  const { formatTime, formatDate } = useDateTimeFormat();
  const getDateTimeValue = (d: string, t: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    let baseDate: Date;
    if (d.toLowerCase() === "today") {
      baseDate = new Date(today);
    } else if (d.toLowerCase() === "tomorrow") {
      baseDate = new Date(tomorrow);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
      const [day, month, year] = d.split("-").map(Number);
      baseDate = new Date(year, month - 1, day);
    } else {
      const parsed = Date.parse(d);
      baseDate = isNaN(parsed) ? new Date(0) : new Date(parsed);
    }
    if (t) {
      const [h, m] = t.split(":");
      baseDate.setHours(Number(h));
      baseDate.setMinutes(Number(m));
    }
    return baseDate.getTime();
  };
  const filteredAppointments = appointments.filter(
    (app) => app.status === "upcoming"
  );
  const sortedAppointments = [...filteredAppointments].sort(
    (a, b) =>
      getDateTimeValue(a.date, a.time) - getDateTimeValue(b.date, b.time)
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] =
    useState<Appointment | null>(null);
  const navigate = useNavigate();

  const getStatusBadgeClasses = (status: Appointment["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "completed":
        return "bg-green-50 text-green-700 border-green-100";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleReschedule = (appointment: Appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleOpen(true);
  };

  const handleCloseReschedule = () => {
    setRescheduleOpen(false);
    setRescheduleAppointment(null);
  };

  // Reschedule logic is handled in the Appointments section/context, so just close modal here
  const handleRescheduleSubmit = async (
    date: string,
    time: string,
    mode: string
  ) => {
    if (!rescheduleAppointment) return;

    try {
      // Always store as YYYY-MM-DD for API
      const d = new Date(date);
      const apiDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;

      // Update in database via API
      await fetch(
        `http://localhost:8000/api/appointments/${rescheduleAppointment.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_date: apiDate,
            appointment_time: time,
            status: "upcoming",
          }),
        }
      );

      // Update local state - format as dd-mm-yyyy for display
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const formattedDate = `${dd}-${mm}-${yyyy}`;

      // Create new array to trigger re-sort
      setAppointments((prev) => {
        const updated = prev.map((app) =>
          app.id === rescheduleAppointment.id
            ? { ...app, date: formattedDate, time, mode }
            : app
        );
        // Return new array reference to trigger re-render and re-sort
        return [...updated];
      });
      setRescheduleOpen(false);
      setRescheduleAppointment(null);
    } catch (error) {
      console.error("Failed to reschedule appointment:", error);
      alert("Failed to reschedule appointment. Please try again.");
    }
  };

  return (
    <>
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Upcoming Appointments
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Patient
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date & Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Mode
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg
                        className="mx-auto h-12 w-12 mb-2 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm font-medium">
                        No upcoming appointments
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedAppointments.slice(0, 10).map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {appointment.patient.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={appointment.patient.avatar}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                              {appointment.patient.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.patient.age} yrs,{" "}
                            {appointment.patient.gender}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(appointment.date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(appointment.time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {appointment.mode || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          appointment.status === "upcoming"
                            ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800"
                            : appointment.status === "completed"
                            ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        }
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            className="text-sm text-cyan-600 hover:text-cyan-900 font-medium"
            onClick={() => navigate("/doctor/appointments")}
          >
            View all appointments →
          </button>
        </div>
      </div>
      <PatientViewModal
        open={modalOpen}
        onClose={handleCloseModal}
        appointment={selectedAppointment}
      />
      <RescheduleModal
        open={rescheduleOpen}
        onClose={handleCloseReschedule}
        appointment={rescheduleAppointment}
        onSubmit={handleRescheduleSubmit}
      />
    </>
  );
};

export default AppointmentTable;
