import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useDateTimeFormat } from "../../context/DateTimeFormatContext";
import {
  Clock,
  MapPin,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const Schedule = () => {
  const { doctor, updateDoctor } = useAuth();
  const { timeFormat, dateFormat, monthFormat, formatTime, formatDate } =
    useDateTimeFormat();

  const [activeTab, setActiveTab] = useState("availability");

  // Availability State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentInterval, setAppointmentInterval] = useState(30);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [isCustomInterval, setIsCustomInterval] = useState(false);

  // Appointment Slots State
  const [appointmentSlots, setAppointmentSlots] = useState<any[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotOverlapError, setSlotOverlapError] = useState<string>("");
  const [newSlot, setNewSlot] = useState({
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "17:00",
    mode: "online" as "online" | "in-person" | "both",
    location: "",
  });
  const [slotMessage, setSlotMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showSlotConfirm, setShowSlotConfirm] = useState(false);
  const [showDeleteSlotConfirm, setShowDeleteSlotConfirm] = useState(false);
  const [pendingDeleteSlotId, setPendingDeleteSlotId] = useState<string>("");

  // Hospital Locations State
  const [hospitalLocations, setHospitalLocations] = useState<any[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [locationMessage, setLocationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [showDeleteLocationConfirm, setShowDeleteLocationConfirm] =
    useState(false);
  const [pendingDeleteLocationId, setPendingDeleteLocationId] =
    useState<string>("");

  const tabs = [
    { id: "availability", label: "Availability", icon: Clock },
    { id: "locations", label: "Locations", icon: MapPin },
  ];

  // Load appointment interval from doctor data
  useEffect(() => {
    if (doctor?.appointment_interval) {
      const interval = doctor.appointment_interval;
      if ([15, 30, 45, 60].includes(interval)) {
        setAppointmentInterval(interval);
        setIsCustomInterval(false);
      } else {
        const hours = Math.floor(interval / 60);
        const minutes = interval % 60;
        setCustomHours(hours);
        setCustomMinutes(minutes);
        setAppointmentInterval(0);
        setIsCustomInterval(true);
      }
    }
  }, [doctor]);

  // Load hospital locations and appointment slots
  useEffect(() => {
    const loadData = async () => {
      if (!doctor?.id) return;

      try {
        // Fetch hospital locations
        const locationsRes = await fetch(
          `http://localhost:8000/api/doctors/${doctor.id}/hospital_locations/`
        );
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          setHospitalLocations(locationsData);
        }

        // Fetch appointment slots
        const slotsRes = await fetch(
          `http://localhost:8000/api/doctors/${doctor.id}/appointment_slots/`
        );
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          setAppointmentSlots(slotsData);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, [doctor]);

  const handleSaveAvailability = async () => {
    try {
      const finalInterval = isCustomInterval
        ? customHours * 60 + customMinutes
        : appointmentInterval;

      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_interval: finalInterval,
            time_format: timeFormat,
            date_format: dateFormat,
            month_format: monthFormat,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setHasUnsavedChanges(false);
      setShowSaveModal(false);

      // Update sessionStorage
      if (doctor) {
        const updatedDoctor = {
          ...doctor,
          appointment_interval: finalInterval,
          time_format: timeFormat,
          date_format: dateFormat,
          month_format: monthFormat,
        };
        sessionStorage.setItem("doctor", JSON.stringify(updatedDoctor));
      }

      setSlotMessage({
        type: "success",
        text: "Settings saved successfully!",
      });
      setTimeout(() => setSlotMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSlotMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
      setTimeout(() => setSlotMessage(null), 5000);
    }
  };

  const handleCancelAvailability = () => {
    // Reset to saved values
    if (doctor?.appointment_interval) {
      const interval = doctor.appointment_interval;
      if ([15, 30, 45, 60].includes(interval)) {
        setAppointmentInterval(interval);
        setIsCustomInterval(false);
      } else {
        const hours = Math.floor(interval / 60);
        const minutes = interval % 60;
        setCustomHours(hours);
        setCustomMinutes(minutes);
        setAppointmentInterval(0);
        setIsCustomInterval(true);
      }
    }
    setHasUnsavedChanges(false);
    setShowCancelModal(false);
  };

  // Check for time slot overlaps
  const checkSlotOverlap = (slot: any): string => {
    if (!slot.day_of_week || !slot.start_time || !slot.end_time) return "";

    const newStart = slot.start_time;
    const newEnd = slot.end_time;

    const existingSlotsForDay = appointmentSlots.filter(
      (s) => s.day_of_week === slot.day_of_week && s.is_active !== false
    );

    for (const existingSlot of existingSlotsForDay) {
      const existStart = existingSlot.start_time.substring(0, 5);
      const existEnd = existingSlot.end_time.substring(0, 5);

      const overlaps = newStart < existEnd && newEnd > existStart;

      if (overlaps) {
        return `Time slot overlaps with existing ${
          existingSlot.mode
        } slot (${formatTime(existStart)} - ${formatTime(
          existEnd
        )}). Please choose a different time.`;
      }
    }

    return "";
  };

  // Appointment Slot Management
  const confirmAddSlot = async () => {
    try {
      setSlotMessage(null);
      setShowSlotConfirm(false);

      // Check for overlapping slots
      const existingSlotsForDay = appointmentSlots.filter(
        (slot) => slot.day_of_week === newSlot.day_of_week && slot.is_active
      );

      const newStart = newSlot.start_time;
      const newEnd = newSlot.end_time;

      for (const existingSlot of existingSlotsForDay) {
        const existStart = existingSlot.start_time.substring(0, 5);
        const existEnd = existingSlot.end_time.substring(0, 5);

        const overlaps = newStart < existEnd && newEnd > existStart;

        if (overlaps) {
          setSlotMessage({
            type: "error",
            text: `Time slot overlaps with existing ${
              existingSlot.mode
            } slot (${formatTime(existStart)} - ${formatTime(existEnd)}) on ${
              newSlot.day_of_week
            }. Please choose a different time.`,
          });
          setTimeout(() => setSlotMessage(null), 7000);
          return;
        }
      }

      // Create slots
      const slotsToCreate =
        newSlot.mode === "both"
          ? [
              { ...newSlot, mode: "online", location: "" },
              { ...newSlot, mode: "in-person", location: newSlot.location },
            ]
          : [
              {
                ...newSlot,
                location: newSlot.mode === "in-person" ? newSlot.location : "",
              },
            ];

      const createdSlots = [];
      for (const slot of slotsToCreate) {
        const payload = {
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          mode: slot.mode,
          location: slot.location || null,
        };

        const response = await fetch(
          `http://localhost:8000/api/doctors/${doctor?.id}/appointment_slots/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          const createdSlot = await response.json();
          createdSlots.push(createdSlot);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to create ${slot.mode} slot: ${JSON.stringify(errorData)}`
          );
        }
      }

      setAppointmentSlots([...appointmentSlots, ...createdSlots]);
      setNewSlot({
        day_of_week: "Monday",
        start_time: "09:00",
        end_time: "17:00",
        mode: "online",
        location: "",
      });
      setShowAddSlot(false);
      setSlotMessage({
        type: "success",
        text:
          newSlot.mode === "both"
            ? "Both online and in-person slots added successfully!"
            : "Appointment slot added successfully!",
      });
      setTimeout(() => setSlotMessage(null), 5000);
    } catch (error) {
      console.error("Failed to add appointment slot:", error);
      setSlotMessage({
        type: "error",
        text: "Failed to add appointment slot. Please try again.",
      });
      setTimeout(() => setSlotMessage(null), 5000);
    }
  };

  const confirmDeleteSlot = async () => {
    try {
      setSlotMessage(null);
      setShowDeleteSlotConfirm(false);

      const slotToDelete = appointmentSlots.find(
        (slot) => slot.id === pendingDeleteSlotId
      );
      if (!slotToDelete) {
        throw new Error("Slot not found");
      }

      // Check if slot is used in upcoming appointments
      try {
        const appointmentsResponse = await fetch(
          `http://localhost:8000/api/appointments/?doctor=${doctor?.id}`
        );

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();

          let appointmentsList = Array.isArray(appointmentsData)
            ? appointmentsData
            : appointmentsData.results
            ? appointmentsData.results
            : [];

          const appointmentsUsingSlot = appointmentsList.filter((apt: any) => {
            if (apt.status !== "upcoming") return false;

            const dateParts = apt.appointment_date.split("-");
            const aptDate = new Date(
              parseInt(dateParts[0]),
              parseInt(dateParts[1]) - 1,
              parseInt(dateParts[2])
            );
            const dayNames = [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ];
            const aptDayOfWeek = dayNames[aptDate.getDay()];

            const aptTime = apt.appointment_time.substring(0, 5);
            const slotStartTime = slotToDelete.start_time.substring(0, 5);
            const slotEndTime = slotToDelete.end_time.substring(0, 5);

            return (
              aptDayOfWeek === slotToDelete.day_of_week &&
              aptTime >= slotStartTime &&
              aptTime < slotEndTime
            );
          });

          if (appointmentsUsingSlot.length > 0) {
            const appointmentDetails = appointmentsUsingSlot
              .slice(0, 3)
              .map(
                (apt: any) =>
                  `${apt.patient_info?.name || "Patient"} on ${formatDate(
                    apt.appointment_date
                  )} at ${formatTime(apt.appointment_time.substring(0, 5))}`
              )
              .join("; ");

            const moreText =
              appointmentsUsingSlot.length > 3
                ? ` and ${appointmentsUsingSlot.length - 3} more`
                : "";

            setSlotMessage({
              type: "error",
              text: `Cannot delete this time slot. It is being used by ${appointmentsUsingSlot.length} upcoming appointment(s): ${appointmentDetails}${moreText}. Please reschedule or cancel these appointments first.`,
            });
            setTimeout(() => setSlotMessage(null), 15000);
            setPendingDeleteSlotId("");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check appointments:", error);
      }

      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/appointment_slots/${pendingDeleteSlotId}/delete/`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setAppointmentSlots(
          appointmentSlots.filter((slot) => slot.id !== pendingDeleteSlotId)
        );
        setSlotMessage({
          type: "success",
          text: "Appointment slot deleted successfully!",
        });
        setTimeout(() => setSlotMessage(null), 5000);
      } else {
        throw new Error("Failed to delete slot");
      }
    } catch (error) {
      console.error("Failed to delete appointment slot:", error);
      setSlotMessage({
        type: "error",
        text: "Failed to delete appointment slot. Please try again.",
      });
      setTimeout(() => setSlotMessage(null), 5000);
    }
    setPendingDeleteSlotId("");
  };

  // Hospital Location Management
  const confirmAddLocation = async () => {
    try {
      setLocationMessage(null);
      setShowLocationConfirm(false);

      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/hospital_locations/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newLocation),
        }
      );

      if (response.ok) {
        const createdLocation = await response.json();
        setHospitalLocations([...hospitalLocations, createdLocation]);
        setNewLocation({ name: "", address: "", phone: "" });
        setShowAddLocation(false);
        setLocationMessage({
          type: "success",
          text: "Location added successfully!",
        });
        setTimeout(() => setLocationMessage(null), 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add location");
      }
    } catch (error) {
      console.error("Failed to add location:", error);
      setLocationMessage({
        type: "error",
        text: "Failed to add location. Please try again.",
      });
      setTimeout(() => setLocationMessage(null), 5000);
    }
  };

  const confirmDeleteLocation = async () => {
    try {
      setLocationMessage(null);
      setShowDeleteLocationConfirm(false);

      // Check if location is used in appointment slots
      const slotsUsingLocation = appointmentSlots.filter(
        (slot) =>
          slot.location &&
          slot.location === pendingDeleteLocationId &&
          slot.is_active
      );

      if (slotsUsingLocation.length > 0) {
        const slotDetails = slotsUsingLocation
          .map(
            (slot) =>
              `${slot.day_of_week} (${formatTime(
                slot.start_time.substring(0, 5)
              )} - ${formatTime(slot.end_time.substring(0, 5))})`
          )
          .join(", ");

        setLocationMessage({
          type: "error",
          text: `Cannot delete location. It is being used in ${slotsUsingLocation.length} appointment slot(s): ${slotDetails}. Please remove the location from these slots first in the Availability tab.`,
        });
        setTimeout(() => setLocationMessage(null), 10000);
        setPendingDeleteLocationId("");
        return;
      }

      // Check if location is used in appointments
      try {
        const appointmentsResponse = await fetch(
          `http://localhost:8000/api/appointments/?doctor=${doctor?.id}&location=${pendingDeleteLocationId}`
        );

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          const activeAppointments = appointmentsData.filter(
            (apt: any) =>
              apt.status === "upcoming" || apt.status === "completed"
          );

          if (activeAppointments.length > 0) {
            const appointmentDetails = activeAppointments
              .slice(0, 3)
              .map(
                (apt: any) =>
                  `${apt.patient_info?.name} on ${
                    apt.appointment_date
                  } at ${apt.appointment_time.substring(0, 5)}`
              )
              .join("; ");

            const moreText =
              activeAppointments.length > 3
                ? ` and ${activeAppointments.length - 3} more`
                : "";

            setLocationMessage({
              type: "error",
              text: `Cannot delete location. It is being used in ${activeAppointments.length} appointment(s): ${appointmentDetails}${moreText}. Please reschedule these appointments to a different location first.`,
            });
            setTimeout(() => setLocationMessage(null), 12000);
            setPendingDeleteLocationId("");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check appointments:", error);
      }

      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor?.id}/hospital_locations/${pendingDeleteLocationId}/delete/`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setHospitalLocations(
          hospitalLocations.filter((loc) => loc.id !== pendingDeleteLocationId)
        );
        setLocationMessage({
          type: "success",
          text: "Location deleted successfully!",
        });
        setTimeout(() => setLocationMessage(null), 5000);
      } else {
        throw new Error("Failed to delete location");
      }
    } catch (error) {
      console.error("Failed to delete location:", error);
      setLocationMessage({
        type: "error",
        text: "Failed to delete location. Please try again.",
      });
      setTimeout(() => setLocationMessage(null), 5000);
    }
    setPendingDeleteLocationId("");
  };

  // Check for overlaps whenever slot details change
  useEffect(() => {
    if (showAddSlot) {
      const error = checkSlotOverlap(newSlot);
      setSlotOverlapError(error);
    }
  }, [
    newSlot.day_of_week,
    newSlot.start_time,
    newSlot.end_time,
    showAddSlot,
    appointmentSlots,
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Schedule Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your availability and clinic locations
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTab === tab.id
                          ? "border-cyan-500 text-cyan-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        -ml-0.5 mr-2 h-5 w-5
                        ${
                          activeTab === tab.id
                            ? "text-cyan-500"
                            : "text-gray-400 group-hover:text-gray-500"
                        }
                      `}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Availability Tab */}
          {activeTab === "availability" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Availability Settings
                </h2>
                <p className="text-gray-600">
                  Configure your appointment duration and time slots
                </p>
              </div>

              {/* Success/Error Message */}
              {slotMessage && (
                <div
                  className={`mb-6 p-4 rounded-lg flex items-start ${
                    slotMessage.type === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {slotMessage.type === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`text-sm ${
                      slotMessage.type === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {slotMessage.text}
                  </p>
                </div>
              )}

              {/* Appointment Interval Settings */}
              <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Appointment Duration
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Default Appointment Interval
                    <span className="block text-xs font-normal text-gray-500 mt-1">
                      This determines the duration of each appointment slot
                    </span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="appointmentInterval"
                        value="15"
                        checked={
                          appointmentInterval === 15 && !isCustomInterval
                        }
                        onChange={(e) => {
                          setAppointmentInterval(parseInt(e.target.value));
                          setIsCustomInterval(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        15 minutes
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="appointmentInterval"
                        value="30"
                        checked={
                          appointmentInterval === 30 && !isCustomInterval
                        }
                        onChange={(e) => {
                          setAppointmentInterval(parseInt(e.target.value));
                          setIsCustomInterval(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        30 minutes{" "}
                        <span className="text-gray-500">(recommended)</span>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="appointmentInterval"
                        value="45"
                        checked={
                          appointmentInterval === 45 && !isCustomInterval
                        }
                        onChange={(e) => {
                          setAppointmentInterval(parseInt(e.target.value));
                          setIsCustomInterval(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        45 minutes
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="appointmentInterval"
                        value="60"
                        checked={
                          appointmentInterval === 60 && !isCustomInterval
                        }
                        onChange={(e) => {
                          setAppointmentInterval(parseInt(e.target.value));
                          setIsCustomInterval(false);
                          setHasUnsavedChanges(true);
                        }}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        60 minutes (1 hour)
                      </span>
                    </label>
                    <label className="flex items-start">
                      <input
                        type="radio"
                        name="appointmentInterval"
                        value="custom"
                        checked={isCustomInterval}
                        onChange={() => {
                          setIsCustomInterval(true);
                          setAppointmentInterval(0);
                          setHasUnsavedChanges(true);
                        }}
                        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm text-gray-700 block mb-3">
                          Custom Duration
                        </span>
                        {isCustomInterval && (
                          <div className="bg-white border border-gray-300 rounded-lg p-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  Hours
                                </label>
                                <select
                                  value={customHours}
                                  onChange={(e) => {
                                    setCustomHours(parseInt(e.target.value));
                                    setHasUnsavedChanges(true);
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <option key={i} value={i}>
                                      {i} {i === 1 ? "hour" : "hours"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                  Minutes
                                </label>
                                <select
                                  value={customMinutes}
                                  onChange={(e) => {
                                    setCustomMinutes(parseInt(e.target.value));
                                    setHasUnsavedChanges(true);
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                  {Array.from(
                                    { length: 12 },
                                    (_, i) => i * 5
                                  ).map((min) => (
                                    <option key={min} value={min}>
                                      {min} {min === 1 ? "minute" : "minutes"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-cyan-700 bg-cyan-50 rounded px-3 py-2">
                              <strong>Total Duration:</strong>{" "}
                              {customHours > 0 &&
                                `${customHours} ${
                                  customHours === 1 ? "hour" : "hours"
                                }`}
                              {customHours > 0 && customMinutes > 0 && " and "}
                              {customMinutes > 0 &&
                                `${customMinutes} ${
                                  customMinutes === 1 ? "minute" : "minutes"
                                }`}
                              {customHours === 0 &&
                                customMinutes === 0 &&
                                "0 minutes"}
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Appointment Slots Section */}
              <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Appointment Time Slots
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Configure specific time slots for online and in-person
                      appointments
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddSlot(true)}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors text-sm font-medium"
                  >
                    + Add Time Slot
                  </button>
                </div>

                {/* Slots List grouped by day */}
                {appointmentSlots.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No slots configured</p>
                    <p className="text-sm mt-1">
                      Add your first time slot to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => {
                      const daySlots = appointmentSlots.filter(
                        (slot) => slot.day_of_week === day
                      );
                      if (daySlots.length === 0) return null;

                      return (
                        <div
                          key={day}
                          className="border border-gray-200 rounded-lg p-4 bg-white"
                        >
                          <h4 className="font-semibold text-gray-900 mb-3">
                            {day}
                          </h4>
                          <div className="space-y-2">
                            {daySlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <span className="font-medium text-gray-900">
                                      {formatTime(
                                        slot.start_time.substring(0, 5)
                                      )}{" "}
                                      -{" "}
                                      {formatTime(
                                        slot.end_time.substring(0, 5)
                                      )}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        slot.mode === "online"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-green-100 text-green-700"
                                      }`}
                                    >
                                      {slot.mode === "online"
                                        ? "🌐 Online"
                                        : "🏥 In-Person"}
                                    </span>
                                    {slot.mode === "in-person" &&
                                      slot.location_info && (
                                        <span className="text-sm text-gray-600">
                                          📍 {slot.location_info.name}
                                        </span>
                                      )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setPendingDeleteSlotId(slot.id);
                                    setShowDeleteSlotConfirm(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium ml-4 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-2">
                  About Appointment Slots
                </h4>
                <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                  <li>
                    Add multiple time slots per day with different modes or
                    locations
                  </li>
                  <li>
                    Online slots allow virtual consultations via video call
                  </li>
                  <li>
                    In-person slots require selecting a location from the
                    "Locations" tab
                  </li>
                  <li>
                    Use the "Both" option to create matching online and
                    in-person slots with one click
                  </li>
                </ul>
              </div>

              {/* Save/Cancel Buttons */}
              {hasUnsavedChanges && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium mb-3">
                    You have unsaved changes to your appointment interval
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === "locations" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Hospital & Clinic Locations
                </h2>
                <p className="text-gray-600">
                  Manage your practice locations for in-person appointments
                </p>
              </div>

              {/* Success/Error Message */}
              {locationMessage && (
                <div
                  className={`mb-6 p-4 rounded-lg flex items-start ${
                    locationMessage.type === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {locationMessage.type === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`text-sm ${
                      locationMessage.type === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {locationMessage.text}
                  </p>
                </div>
              )}

              {/* Hospital Locations Section */}
              <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Locations
                  </h3>
                  <button
                    onClick={() => setShowAddLocation(true)}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors text-sm font-medium"
                  >
                    + Add Location
                  </button>
                </div>

                {/* Locations List */}
                {hospitalLocations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No locations added</p>
                    <p className="text-sm mt-1">
                      Add your first hospital or clinic location
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {hospitalLocations.map((location) => (
                      <div
                        key={location.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg flex items-center">
                              <MapPin className="h-5 w-5 text-cyan-600 mr-2" />
                              {location.name}
                            </h4>
                            <p className="text-gray-600 text-sm mt-2">
                              {location.address}
                            </p>
                            {location.phone && (
                              <p className="text-gray-600 text-sm mt-1">
                                <span className="font-medium">Phone:</span>{" "}
                                {location.phone}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setPendingDeleteLocationId(location.id);
                              setShowDeleteLocationConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium ml-4 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-2">
                  About Locations
                </h4>
                <p className="text-blue-800 text-sm mb-3">
                  These locations will be available when configuring in-person
                  appointment slots in the Availability tab.
                </p>
                <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                  <li>Add all clinics and hospitals where you practice</li>
                  <li>
                    Include complete addresses so patients can find you easily
                  </li>
                  <li>
                    Each location can be assigned to specific appointment time
                    slots
                  </li>
                  <li>
                    Patients will see the location when booking in-person
                    appointments
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Add Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Appointment Time Slot
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  value={newSlot.day_of_week}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, day_of_week: e.target.value })
                  }
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    value={newSlot.start_time}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, start_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    value={newSlot.end_time}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, end_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Mode *
                </label>

                {hospitalLocations.length === 0 && (
                  <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800 text-sm">
                      <strong>⚠️ No Locations Added:</strong> To offer in-person
                      appointments, please add at least one location in the{" "}
                      <strong>"Locations"</strong> tab first.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="online"
                      checked={newSlot.mode === "online"}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, mode: "online", location: "" })
                      }
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      🌐 Online - Virtual consultation
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="in-person"
                      checked={newSlot.mode === "in-person"}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, mode: "in-person" })
                      }
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                      disabled={hospitalLocations.length === 0}
                    />
                    <span
                      className={`ml-2 text-sm ${
                        hospitalLocations.length === 0
                          ? "text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      🏥 In-Person - Physical visit
                      {hospitalLocations.length === 0
                        ? " (Disabled - No locations)"
                        : ""}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="both"
                      checked={newSlot.mode === "both"}
                      onChange={(e) => setNewSlot({ ...newSlot, mode: "both" })}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                      disabled={hospitalLocations.length === 0}
                    />
                    <span
                      className={`ml-2 text-sm ${
                        hospitalLocations.length === 0
                          ? "text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      🔄 Both - Offer online and in-person
                      {hospitalLocations.length === 0
                        ? " (Disabled - No locations)"
                        : ""}
                    </span>
                  </label>
                </div>
              </div>

              {(newSlot.mode === "in-person" || newSlot.mode === "both") &&
                hospitalLocations.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      value={newSlot.location}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, location: e.target.value })
                      }
                    >
                      <option value="">Select a location</option>
                      {hospitalLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} - {loc.address}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              {slotOverlapError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    <strong>⚠️ Time Conflict:</strong> {slotOverlapError}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddSlot(false);
                  setSlotOverlapError("");
                  setNewSlot({
                    day_of_week: "Monday",
                    start_time: "09:00",
                    end_time: "17:00",
                    mode: "online",
                    location: "",
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSlotConfirm(true)}
                disabled={
                  !newSlot.day_of_week ||
                  !newSlot.start_time ||
                  !newSlot.end_time ||
                  ((newSlot.mode === "in-person" || newSlot.mode === "both") &&
                    !newSlot.location) ||
                  !!slotOverlapError
                }
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Hospital Location
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Clinic Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  value={newLocation.name}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, name: e.target.value })
                  }
                  placeholder="e.g., City General Hospital"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complete Address *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  rows={3}
                  value={newLocation.address}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, address: e.target.value })
                  }
                  placeholder="Complete address including street, city, state, country"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include full address: street, city, state/province, and
                  country
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  value={newLocation.phone}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, phone: e.target.value })
                  }
                  placeholder="Contact phone number"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddLocation(false);
                  setNewLocation({ name: "", address: "", phone: "" });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowLocationConfirm(true)}
                disabled={!newLocation.name || !newLocation.address}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {showSlotConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Add Appointment Slot
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to add this time slot?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="text-sm">
                <strong>Day:</strong> {newSlot.day_of_week}
              </p>
              <p className="text-sm mt-1">
                <strong>Time:</strong> {formatTime(newSlot.start_time)} -{" "}
                {formatTime(newSlot.end_time)}
              </p>
              <p className="text-sm mt-1">
                <strong>Mode:</strong>{" "}
                {newSlot.mode === "online"
                  ? "🌐 Online"
                  : newSlot.mode === "in-person"
                  ? "🏥 In-Person"
                  : "🔄 Both"}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => setShowSlotConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                onClick={confirmAddSlot}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSlotConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this appointment slot? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => {
                  setShowDeleteSlotConfirm(false);
                  setPendingDeleteSlotId("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={confirmDeleteSlot}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Add Location
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to add this location?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <p className="text-sm">
                <strong>Name:</strong> {newLocation.name}
              </p>
              <p className="text-sm mt-1">
                <strong>Address:</strong> {newLocation.address}
              </p>
              {newLocation.phone && (
                <p className="text-sm mt-1">
                  <strong>Phone:</strong> {newLocation.phone}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => setShowLocationConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                onClick={confirmAddLocation}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteLocationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this location? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => {
                  setShowDeleteLocationConfirm(false);
                  setPendingDeleteLocationId("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={confirmDeleteLocation}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Changes
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to save these settings?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                onClick={handleSaveAvailability}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Discard Changes?
            </h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Editing
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={handleCancelAvailability}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
