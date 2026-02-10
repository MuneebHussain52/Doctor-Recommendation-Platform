import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Star,
  Clock,
  Heart,
  User,
  Calendar,
  X,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PaymentModal from "../../components/PaymentModal";

interface Doctor {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  specialty: string;
  years_of_experience: number;
  avatar?: string;
  bio?: string;
  phone?: string;
  email: string;
  license_number?: string;
  appointment_interval?: number;
  approval_status?: string;
  is_verified?: boolean;
  online_consultation_fee?: number;
  in_person_consultation_fee?: number;
}

interface Feedback {
  id: string;
  patient: {
    id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  doctor_reply?: string;
  created_at: string;
}

const Recommendations = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { patient } = useAuth();

  // Helper function to translate specialty names
  const getSpecialtyTranslation = (specialty: string): string => {
    // Always try to get translation based on current language
    const translationKey = `specialty.${specialty}`;
    const translation = t(translationKey);

    console.log("Translation Debug:", {
      specialty,
      translationKey,
      translation,
      language,
      isTranslated: translation !== translationKey,
    });

    // If translation exists and is different from the key, return it
    // This works for both English and Urdu
    if (translation !== translationKey) {
      return translation;
    }

    // Return original English name if no translation found
    return specialty;
  };
  const { refreshAppointments } = useOutletContext<{
    refreshAppointments: () => Promise<void>;
  }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    specialty: "",
    gender: "",
  });
  const [sortBy, setSortBy] = useState("experience");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<{
    date: string;
    time: string;
    mode: string;
    location?: string;
  } | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [appointmentSlots, setAppointmentSlots] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [isBooking, setIsBooking] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = React.useRef<HTMLDivElement>(null);
  const [appointmentMode, setAppointmentMode] = useState<
    "online" | "in-person"
  >("online");
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);
  const [timeSlotMap, setTimeSlotMap] = useState<{ [key: string]: any }>({});
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [allSpecialties, setAllSpecialties] = useState<string[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [consultationFee, setConsultationFee] = useState(0);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<
    string | null
  >(null);

  // Fetch approved specialties from backend
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/specialties/");
        if (response.ok) {
          const data = await response.json();
          setAllSpecialties(data.specialties || []);
        } else {
          console.error("Failed to fetch specialties");
          setAllSpecialties([]);
        }
      } catch (error) {
        console.error("Error fetching specialties:", error);
        setAllSpecialties([]);
      } finally {
        setLoadingSpecialties(false);
      }
    };

    fetchSpecialties();
  }, []);

  // Recalculate available times when appointment mode changes
  useEffect(() => {
    if (bookingDate && appointmentSlots.length > 0) {
      handleDateChange(bookingDate);
    }
  }, [appointmentMode]);

  // Recalculate available times when location changes (for in-person mode)
  useEffect(() => {
    if (
      appointmentMode === "in-person" &&
      bookingDate &&
      appointmentSlots.length > 0
    ) {
      handleDateChange(bookingDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCalendar]);

  // Fetch doctors from backend (only approved doctors)
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/doctors/");
        const data = await response.json();
        // API returns paginated results, extract the results array
        const allDoctors = data.results || data;
        // Filter to show only approved doctors
        const approvedDoctors = allDoctors.filter(
          (doctor: Doctor) => doctor.approval_status === "approved"
        );
        console.log(
          "[Recommendations] Fetched doctors with pricing:",
          approvedDoctors.map((d) => ({
            id: d.id,
            name: `${d.first_name} ${d.last_name}`,
            online_fee: d.online_consultation_fee,
            in_person_fee: d.in_person_consultation_fee,
          }))
        );
        setDoctors(approvedDoctors);
        setLoading(false);
      } catch (error) {
        console.error("[Recommendations] Failed to fetch doctors:", error);
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch patient's favorite doctors
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");

      if (!patient?.id || !token) {
        console.log("[Favorites] Skip fetching - no patient or token:", {
          hasPatient: !!patient,
          hasToken: !!token,
        });
        return;
      }

      console.log("[Favorites] Fetching favorites for patient:", patient.id);

      try {
        const response = await fetch(
          `http://localhost:8000/api/patients/${patient.id}/favorites/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        console.log("[Favorites] Fetch response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("[Favorites] Fetched data:", data);

          // Extract doctor IDs from the favorites list
          const favoriteDoctorIds =
            data.favorites?.map((fav: any) => fav.doctor_id || fav.id) || [];
          console.log("[Favorites] Extracted IDs:", favoriteDoctorIds);
          setFavorites(favoriteDoctorIds);
        } else {
          const errorText = await response.text();
          console.error("[Favorites] Fetch failed:", errorText);
        }
      } catch (error) {
        console.error("[Favorites] Failed to fetch favorites:", error);
      }
    };

    fetchFavorites();
  }, [patient]);

  // Handle navigation state from Symptoms page
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedDoctor && state?.openProfileModal) {
      setSelectedDoctor(state.selectedDoctor);
      setShowProfileModal(true);
      // Clear the navigation state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Extract unique specialties from approved specialties list
  const specialties = [t("recommendations.allSpecialties"), ...allSpecialties];

  const sortOptions = [
    { value: "experience", label: t("recommendations.experience") },
    { value: "name", label: t("recommendations.name") },
    { value: "rating", label: t("recommendations.rating") },
    { value: "favorites", label: t("recommendations.favorites") },
  ];

  const toggleFavorite = async (doctorId: string) => {
    const token = localStorage.getItem("token");

    // Debug: Log all localStorage keys
    console.log("[Favorites] localStorage keys:", Object.keys(localStorage));
    console.log("[Favorites] localStorage token:", token);
    console.log("[Favorites] patient from context:", patient);

    if (!patient?.id || !token) {
      console.error("[Favorites] Patient not logged in or missing token");
      console.log("[Favorites] Missing:", {
        hasPatient: !!patient?.id,
        hasToken: !!token,
      });
      alert("Please log out and log back in to use favorites feature");
      return;
    }

    const isFavorite = favorites.includes(doctorId);

    // Prevent multiple toggles at once
    if (togglingFavorite === doctorId) {
      console.log("[Favorites] Already toggling this doctor");
      return;
    }

    console.log("[Favorites] Toggling favorite:", {
      doctorId,
      isFavorite,
      patientId: patient.id,
    });
    setTogglingFavorite(doctorId);

    try {
      // Optimistic update
      setFavorites((prev) =>
        isFavorite ? prev.filter((id) => id !== doctorId) : [...prev, doctorId]
      );
      console.log("[Favorites] Optimistic UI update done");

      // Call backend API
      const url = isFavorite
        ? `http://localhost:8000/api/patients/${patient.id}/favorites/${doctorId}/remove/`
        : `http://localhost:8000/api/patients/${patient.id}/favorites/${doctorId}/add/`;

      console.log("[Favorites] Calling API:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[Favorites] API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Favorites] API error:", errorText);

        // Revert on error
        setFavorites((prev) =>
          isFavorite
            ? [...prev, doctorId]
            : prev.filter((id) => id !== doctorId)
        );

        alert(
          `Failed to ${
            isFavorite ? "remove from" : "add to"
          } favorites. Please try again.`
        );
      } else {
        const data = await response.json();
        console.log("[Favorites] Success:", data);
      }
    } catch (error) {
      console.error("[Favorites] Error toggling favorite:", error);

      // Revert on error
      setFavorites((prev) =>
        isFavorite ? [...prev, doctorId] : prev.filter((id) => id !== doctorId)
      );

      alert("Network error. Please check your connection and try again.");
    } finally {
      setTogglingFavorite(null);
      console.log("[Favorites] Toggle complete");
    }
  };

  const handleBookAppointment = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    setBookingDate("");
    setBookingTime("");
    setAvailableTimes([]);
    setBookingError("");
    setSymptoms("");
    setAppointmentMode("online");
    setSelectedLocation(null);

    // Fetch appointment slots and hospital locations for this doctor
    setLoadingSchedule(true);
    try {
      const [slotsResponse, locationsResponse] = await Promise.all([
        fetch(
          `http://localhost:8000/api/doctors/${doctor.id}/appointment_slots/`
        ),
        fetch(
          `http://localhost:8000/api/doctors/${doctor.id}/hospital_locations/`
        ),
      ]);
      const slotsData = await slotsResponse.json();
      const locationsData = await locationsResponse.json();
      setAppointmentSlots(slotsData);
      setAvailableLocations(locationsData);
    } catch (error) {
      console.error("[Recommendations] Failed to fetch doctor data:", error);
      setAppointmentSlots([]);
      setAvailableLocations([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleViewProfile = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowProfileModal(true);

    // Fetch feedbacks for this doctor
    setLoadingFeedbacks(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/doctors/${doctor.id}/feedback/`
      );
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error("[Recommendations] Failed to fetch feedbacks:", error);
      setFeedbacks([]);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleViewSchedule = async () => {
    if (!selectedDoctor) return;

    setShowScheduleModal(true);
    setLoadingSchedule(true);

    try {
      // Fetch appointment slots
      const slotsResponse = await fetch(
        `http://localhost:8000/api/doctors/${selectedDoctor.id}/appointment_slots/`
      );
      const slotsData = await slotsResponse.json();
      setAppointmentSlots(slotsData);
    } catch (error) {
      console.error("[Recommendations] Failed to fetch schedule data:", error);
      setAppointmentSlots([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const proceedToPayment = async () => {
    if (!selectedDoctor || !patient || !bookingDate || !bookingTime) {
      setBookingError("Please fill in all required fields");
      return;
    }

    // Validate location for in-person appointments
    if (appointmentMode === "in-person" && !selectedLocation) {
      setBookingError("Please select a location for in-person appointment");
      return;
    }

    setIsBooking(true);
    setBookingError("");

    try {
      // Generate unique appointment ID
      const appointmentId = `APT-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create appointment BEFORE payment
      const response = await fetch("http://localhost:8000/api/appointments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: appointmentId,
          patient: patient.id,
          doctor: selectedDoctor.id,
          appointment_date: bookingDate,
          appointment_time: bookingTime,
          appointment_type: "Consultation",
          appointment_mode: appointmentMode,
          location:
            appointmentMode === "in-person" ? selectedLocation?.id : null,
          reason: symptoms || "General consultation",
          status: "upcoming",
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Failed to book appointment";

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const errorText = await response.text();
          console.error("Server returned non-JSON response:", errorText);
          errorMessage = "Server error. Please try again later.";
        }

        throw new Error(errorMessage);
      }

      // Store appointment ID for payment
      setPendingAppointmentId(appointmentId);

      // Store doctor ID in sessionStorage for transaction creation
      sessionStorage.setItem("selectedDoctorId", selectedDoctor.id);

      // Set consultation fee from doctor's pricing in database
      console.log("[Recommendations] Doctor pricing data:", {
        online_fee: selectedDoctor.online_consultation_fee,
        in_person_fee: selectedDoctor.in_person_consultation_fee,
        mode: appointmentMode,
      });

      const fee =
        appointmentMode === "online"
          ? selectedDoctor.online_consultation_fee || 1500
          : selectedDoctor.in_person_consultation_fee || 2500;

      console.log("[Recommendations] Setting consultation fee to:", fee);
      console.log("[Recommendations] Appointment created:", appointmentId);
      setConsultationFee(fee);
      setBookingError("");
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error("[Recommendations] Failed to create appointment:", error);
      setBookingError(
        error.message || "Failed to create appointment. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  };

  const confirmBooking = async () => {
    // Appointment is already created in proceedToPayment, just show success
    setConfirmedBooking({
      date: bookingDate,
      time: bookingTime,
      mode: appointmentMode,
      location:
        appointmentMode === "in-person" && selectedLocation
          ? selectedLocation.name
          : undefined,
    });
    setShowBookingModal(false);
    setShowBookingSuccess(true);
    setBookingDate("");
    setBookingTime("");
    setSymptoms("");
    setAvailableTimes([]);
    setPendingAppointmentId(null);

    // Refresh appointments list to show the newly booked appointment
    if (refreshAppointments) {
      await refreshAppointments();
    }
  };

  const filteredAndSortedDoctors = doctors
    .filter((doctor) => {
      const fullName = `${doctor.first_name} ${doctor.middle_name || ""} ${
        doctor.last_name
      }`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty =
        !filters.specialty ||
        filters.specialty === t("recommendations.allSpecialties") ||
        doctor.specialty === filters.specialty;

      return matchesSearch && matchesSpecialty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "experience":
          return (b.years_of_experience || 0) - (a.years_of_experience || 0);
        case "name":
          return `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          );
        case "rating":
          return (b.average_rating || 0) - (a.average_rating || 0);
        case "favorites":
          const aIsFavorite = favorites.includes(a.id) ? 1 : 0;
          const bIsFavorite = favorites.includes(b.id) ? 1 : 0;
          return bIsFavorite - aIsFavorite;
        default:
          return 0;
      }
    });

  const getDoctorFullName = (doctor: Doctor) => {
    return `Dr. ${doctor.first_name} ${
      doctor.middle_name ? doctor.middle_name + " " : ""
    }${doctor.last_name}`;
  };

  const getPatientFullName = (patient: Feedback["patient"]) => {
    const firstName = patient?.first_name || "Patient";
    const middleName = patient?.middle_name ? patient.middle_name + " " : "";
    const lastName = patient?.last_name || "";
    return `${firstName} ${middleName}${lastName}`.trim();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${
        Math.floor(diffDays / 7) > 1 ? "s" : ""
      } ago`;
    if (diffDays < 365)
      return `${Math.floor(diffDays / 30)} month${
        Math.floor(diffDays / 30) > 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffDays / 365)} year${
      Math.floor(diffDays / 365) > 1 ? "s" : ""
    } ago`;
  };

  const getDayOfWeek = (dateString: string) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const translateDay = (day: string) => {
    const dayMap: { [key: string]: string } = {
      Monday: t("days.monday"),
      Tuesday: t("days.tuesday"),
      Wednesday: t("days.wednesday"),
      Thursday: t("days.thursday"),
      Friday: t("days.friday"),
      Saturday: t("days.saturday"),
      Sunday: t("days.sunday"),
    };
    return dayMap[day] || day;
  };

  const translateMode = (mode: string) => {
    return mode === "online"
      ? t("dashboard.mode.online")
      : t("dashboard.mode.inPerson");
  };

  const generateTimeSlots = (
    startTime: string,
    endTime: string,
    interval: number = 30
  ) => {
    const slots: string[] = [];

    console.log("[generateTimeSlots] Input:", { startTime, endTime, interval });

    // Parse time strings by splitting on ':' to handle both "HH:MM" and "HH:MM:SS" formats
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    console.log("[generateTimeSlots] Parsed:", {
      startHour,
      startMinute,
      endHour,
      endMinute,
    });

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeString = `${currentHour
        .toString()
        .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
      slots.push(timeString);

      currentMinute += interval;
      if (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour += 1;
      }
    }

    console.log("[generateTimeSlots] Generated slots:", slots);
    return slots;
  };

  // Check if a date is available (doctor works on that day)
  const isDateAvailable = (dateString: string): boolean => {
    if (!dateString) return false;

    const dayOfWeek = getDayOfWeek(dateString);

    // Only use appointment slots
    if (appointmentSlots && appointmentSlots.length > 0) {
      return appointmentSlots.some((slot) => {
        // Basic checks
        if (
          slot.day_of_week !== dayOfWeek ||
          !slot.is_active ||
          slot.mode !== appointmentMode
        ) {
          return false;
        }

        // For in-person appointments, if a location is already selected,
        // only show dates that have slots for that location
        if (appointmentMode === "in-person" && selectedLocation) {
          return slot.location === selectedLocation.id;
        }

        return true;
      });
    }

    // No appointment slots = no availability
    return false;
  };

  // Generate calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateChange = async (date: string) => {
    setBookingDate(date);
    setBookingTime("");
    setLoadingTimes(true);

    if (!date || !selectedDoctor) {
      setAvailableTimes([]);
      setLoadingTimes(false);
      return;
    }

    const dayOfWeek = getDayOfWeek(date);

    // Check if appointment slots are configured
    const useSlots = appointmentSlots && appointmentSlots.length > 0;

    if (useSlots) {
      // Use appointment slots system
      let daySlots = appointmentSlots.filter(
        (slot) =>
          slot.day_of_week === dayOfWeek &&
          slot.is_active &&
          slot.mode === appointmentMode
      );

      // For in-person mode: if location is selected, filter by location
      if (appointmentMode === "in-person" && selectedLocation) {
        daySlots = daySlots.filter(
          (slot) => slot.location === selectedLocation.id
        );
      }

      // For in-person mode: if NO location selected yet, auto-select first available location
      if (
        appointmentMode === "in-person" &&
        !selectedLocation &&
        daySlots.length > 0
      ) {
        const firstSlotWithLocation = daySlots.find(
          (slot) => slot.location_info
        );
        if (firstSlotWithLocation?.location_info) {
          console.log(
            "[Recommendations] Auto-selecting location:",
            firstSlotWithLocation.location_info.name
          );
          setSelectedLocation(firstSlotWithLocation.location_info);
        }
      }

      if (daySlots.length === 0) {
        setAvailableTimes([]);
        setLoadingTimes(false);
        return;
      }

      try {
        // Generate all possible times from all slots for this day and mode
        const interval = selectedDoctor.appointment_interval || 30;
        const timeToSlotMap: { [key: string]: any } = {};

        daySlots.forEach((slot) => {
          console.log("[Recommendations] Processing slot:", slot);
          const slotTimes = generateTimeSlots(
            slot.start_time,
            slot.end_time,
            interval
          );
          console.log("[Recommendations] Generated times for slot:", slotTimes);
          slotTimes.forEach((time) => {
            // Map each time to its slot (with location info)
            if (!timeToSlotMap[time]) {
              timeToSlotMap[time] = [];
            }
            timeToSlotMap[time].push(slot);
          });
        });

        const allTimes = Object.keys(timeToSlotMap).sort();
        console.log("[Recommendations] All times:", allTimes);

        // Fetch existing appointments for this doctor on this date with the same mode
        const response = await fetch(
          `http://localhost:8000/api/appointments/?doctor=${selectedDoctor.id}&appointment_date=${date}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("[Recommendations] API response:", data);
          // Handle both direct array and paginated response
          const appointments = Array.isArray(data) ? data : data.results || [];
          console.log("[Recommendations] Existing appointments:", appointments);

          // Filter appointments by status and mode
          const relevantAppointments = appointments.filter(
            (apt: any) =>
              apt.status !== "cancelled" &&
              apt.appointment_mode === appointmentMode
          );
          console.log(
            "[Recommendations] Relevant appointments (same mode, not cancelled):",
            relevantAppointments
          );

          const bookedTimes = relevantAppointments.map((apt: any) => {
            const time = apt.appointment_time;
            return time.length > 5 ? time.substring(0, 5) : time;
          });

          console.log("[Recommendations] Booked times:", bookedTimes);
          const availableTimes = allTimes.filter(
            (time) => !bookedTimes.includes(time)
          );
          console.log("[Recommendations] Available times:", availableTimes);
          setAvailableTimes(availableTimes);
          setTimeSlotMap(timeToSlotMap);
          setLoadingTimes(false);

          if (availableTimes.length > 0) {
            setBookingTime(availableTimes[0]);
            // Auto-select location for in-person appointments
            if (
              appointmentMode === "in-person" &&
              timeToSlotMap[availableTimes[0]]?.[0]?.location_info
            ) {
              setSelectedLocation(
                timeToSlotMap[availableTimes[0]][0].location_info
              );
            }
          }
        } else {
          setAvailableTimes(allTimes);
          setTimeSlotMap(timeToSlotMap);
          setLoadingTimes(false);
          if (allTimes.length > 0) {
            setBookingTime(allTimes[0]);
            if (
              appointmentMode === "in-person" &&
              timeToSlotMap[allTimes[0]]?.[0]?.location_info
            ) {
              setSelectedLocation(timeToSlotMap[allTimes[0]][0].location_info);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setAvailableTimes([]);
        setTimeSlotMap({});
        setLoadingTimes(false);
      }
    } else {
      // No appointment slots configured
      setAvailableTimes([]);
      setTimeSlotMap({});
      setLoadingTimes(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("recommendations.title")}
        </h1>
        <p className="text-gray-600">{t("recommendations.subtitle")}</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t("recommendations.searchPlaceholder")}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            value={filters.specialty}
            onChange={(e) =>
              setFilters({ ...filters, specialty: e.target.value })
            }
            disabled={loadingSpecialties}
          >
            {loadingSpecialties ? (
              <option value="">Loading specialties...</option>
            ) : (
              specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty === t("recommendations.allSpecialties")
                    ? specialty
                    : getSpecialtyTranslation(specialty)}
                </option>
              ))
            )}
          </select>

          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">{t("recommendations.sortBy")}...</option>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <p className="text-sm text-gray-600">
          {t("recommendations.showing")} {filteredAndSortedDoctors.length}{" "}
          {filteredAndSortedDoctors.length === 1
            ? t("recommendations.doctor")
            : t("recommendations.doctors")}
          {searchQuery && ` ${t("recommendations.for")} "${searchQuery}"`}
        </p>
      </div>

      {/* Doctor Cards */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading doctors...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow relative"
            >
              {/* Favorite Button - Top Right Corner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    "[Favorites] Button clicked for doctor:",
                    doctor.id
                  );
                  toggleFavorite(doctor.id);
                }}
                disabled={togglingFavorite === doctor.id}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  togglingFavorite === doctor.id
                    ? "bg-gray-100 animate-pulse"
                    : "bg-white hover:shadow-lg hover:scale-110"
                }`}
                title={
                  favorites.includes(doctor.id)
                    ? t("recommendations.removeFromFavorites")
                    : t("recommendations.addToFavorites")
                }
              >
                {togglingFavorite === doctor.id ? (
                  <svg
                    className="animate-spin h-5 w-5 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <Heart
                    className={`h-5 w-5 transition-all ${
                      favorites.includes(doctor.id)
                        ? "text-red-500 fill-red-500"
                        : "text-gray-400 hover:text-red-400"
                    }`}
                  />
                )}
              </button>

              <div className="p-6">
                <div className="flex items-start mb-4">
                  <div className="h-16 w-16 flex-shrink-0">
                    {doctor.avatar ? (
                      <img
                        className="h-16 w-16 rounded-full object-cover"
                        src={doctor.avatar}
                        alt=""
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-medium text-xl">
                        {doctor.first_name.charAt(0)}
                        {doctor.last_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 rtl:mr-4 rtl:ml-0 flex-1 pr-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {getDoctorFullName(doctor)}
                          </h3>
                        </div>
                        <p className="text-sm text-cyan-600 font-medium">
                          {getSpecialtyTranslation(doctor.specialty)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {doctor.years_of_experience || 0}{" "}
                    {t("recommendations.yearsExperience")}
                  </div>
                  {(doctor.online_consultation_fee ||
                    doctor.in_person_consultation_fee) && (
                    <div className="flex flex-col gap-1 text-sm">
                      {doctor.online_consultation_fee && (
                        <div className="flex items-center text-gray-700">
                          <span className="font-medium">
                            {t("recommendations.onlineConsultation")}:
                          </span>
                          <span className="ml-2 rtl:mr-2 rtl:ml-0 text-cyan-600 font-semibold">
                            Rs.{" "}
                            {doctor.online_consultation_fee.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {doctor.in_person_consultation_fee && (
                        <div className="flex items-center text-gray-700">
                          <span className="font-medium">
                            {t("recommendations.inPersonConsultation")}:
                          </span>
                          <span className="ml-2 rtl:mr-2 rtl:ml-0 text-cyan-600 font-semibold">
                            Rs.{" "}
                            {doctor.in_person_consultation_fee.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 rtl:space-x-reverse mt-4">
                  <button
                    onClick={() => handleBookAppointment(doctor)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Calendar className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t("recommendations.bookAppointment")}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      handleViewSchedule();
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    title={t("recommendations.viewSchedule")}
                  >
                    <Clock className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleViewProfile(doctor)}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    title={t("recommendations.viewProfile")}
                  >
                    <User className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredAndSortedDoctors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("recommendations.noDoctorsFound")}
          </h3>
          <p className="text-gray-600">{t("recommendations.adjustCriteria")}</p>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("recommendations.bookingTitle")}{" "}
                  {getDoctorFullName(selectedDoctor)}
                </h2>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1: Appointment Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("booking.step1")}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentMode("online");
                      setSelectedLocation(null);
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      appointmentMode === "online"
                        ? "border-cyan-600 bg-cyan-50 text-cyan-900"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">
                        {t("booking.online")}
                      </span>
                      <span className="text-xs mt-1">
                        {t("booking.videoConsultation")}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentMode("in-person")}
                    disabled={availableLocations.length === 0}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      appointmentMode === "in-person"
                        ? "border-cyan-600 bg-cyan-50 text-cyan-900"
                        : availableLocations.length === 0
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">
                        {t("booking.inPerson")}
                      </span>
                      <span className="text-xs mt-1">
                        {availableLocations.length === 0
                          ? t("booking.notAvailable")
                          : t("booking.clinicVisit")}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Location Selection for In-Person */}
              {appointmentMode === "in-person" &&
                (() => {
                  // Filter locations to only show ones with active in-person slots
                  const locationsWithSlots = availableLocations.filter(
                    (location) =>
                      appointmentSlots.some(
                        (slot) =>
                          slot.is_active &&
                          slot.mode === "in-person" &&
                          slot.location === location.id
                      )
                  );

                  if (locationsWithSlots.length === 0) return null;

                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("booking.step2")}: {t("booking.selectLocation")}
                      </label>
                      <div className="space-y-2">
                        {locationsWithSlots.map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => setSelectedLocation(location)}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                              selectedLocation?.id === location.id
                                ? "border-cyan-600 bg-cyan-50"
                                : "border-gray-300 bg-white hover:border-gray-400"
                            }`}
                          >
                            <div className="font-medium text-gray-900">
                              {location.name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {location.address}
                            </div>
                            {location.phone && (
                              <div className="text-sm text-gray-500 mt-1">
                                📞 {location.phone}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              {/* Step 3 or 2: Date Selection (depends on if location was needed) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t(
                    appointmentMode === "in-person"
                      ? "booking.step3"
                      : "booking.step2"
                  )}
                  : {t("recommendations.selectDate")}
                </label>
                <div className="relative" ref={calendarRef}>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-left flex items-center justify-between bg-white"
                  >
                    <span
                      className={
                        bookingDate ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {bookingDate || t("booking.selectADate")}
                    </span>
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </button>

                  {showCalendar && (
                    <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentMonth(
                              new Date(
                                currentMonth.getFullYear(),
                                currentMonth.getMonth() - 1,
                                1
                              )
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="font-semibold">
                          {currentMonth.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentMonth(
                              new Date(
                                currentMonth.getFullYear(),
                                currentMonth.getMonth() + 1,
                                1
                              )
                            )
                          }
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (day) => (
                            <div
                              key={day}
                              className="text-center text-xs font-medium text-gray-600 py-1"
                            >
                              {day}
                            </div>
                          )
                        )}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {getCalendarDays().map((date, index) => {
                          if (!date) {
                            return (
                              <div
                                key={`empty-${index}`}
                                className="aspect-square"
                              />
                            );
                          }

                          const dateString = formatDateForInput(date);
                          const available = isDateAvailable(dateString);
                          const past = isPastDate(date);
                          const today = isToday(date);
                          const selected = bookingDate === dateString;

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                if (!past && available) {
                                  handleDateChange(dateString);
                                  setShowCalendar(false);
                                }
                              }}
                              disabled={past || !available}
                              className={`
                                aspect-square p-1 text-sm rounded-md transition-colors
                                ${
                                  selected
                                    ? "bg-cyan-600 text-white font-semibold"
                                    : ""
                                }
                                ${
                                  !selected && today
                                    ? "border-2 border-cyan-600 text-cyan-600"
                                    : ""
                                }
                                ${
                                  !selected && !today && available && !past
                                    ? "hover:bg-cyan-50 text-gray-900"
                                    : ""
                                }
                                ${
                                  !available || past
                                    ? "text-gray-300 cursor-not-allowed opacity-50"
                                    : ""
                                }
                              `}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-cyan-600"></div>
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border-2 border-cyan-600"></div>
                          <span>Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gray-200 opacity-50"></div>
                          <span>Unavailable</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {loadingTimes && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading available times...
                  </p>
                )}
                {bookingDate &&
                  !loadingTimes &&
                  availableTimes.length === 0 &&
                  appointmentSlots.length > 0 &&
                  (() => {
                    const dayOfWeek = getDayOfWeek(bookingDate);
                    const hasSlotsForDay = appointmentSlots.some(
                      (slot) => slot.day_of_week === dayOfWeek && slot.is_active
                    );
                    if (!hasSlotsForDay) {
                      return (
                        <p className="text-sm text-red-600 mt-1">
                          Doctor is not available on {dayOfWeek}s.
                        </p>
                      );
                    }
                    const hasSlotsForMode = appointmentSlots.some(
                      (slot) =>
                        slot.day_of_week === dayOfWeek &&
                        slot.is_active &&
                        slot.mode === appointmentMode
                    );
                    if (!hasSlotsForMode) {
                      return (
                        <p className="text-sm text-red-600 mt-1">
                          Doctor is not available on {dayOfWeek}s for{" "}
                          {appointmentMode} appointments.
                        </p>
                      );
                    }
                    return (
                      <p className="text-sm text-amber-600 mt-1">
                        All time slots are currently booked for this date.
                      </p>
                    );
                  })()}
                {bookingDate &&
                  !loadingTimes &&
                  appointmentSlots.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Doctor hasn't configured appointment slots yet. Please
                      contact the doctor directly.
                    </p>
                  )}
              </div>

              {/* Step 4 or 3: Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t(
                    appointmentMode === "in-person"
                      ? "booking.step4"
                      : "booking.step3"
                  )}
                  : {t("recommendations.selectTime")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-100"
                  value={bookingTime}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    setBookingTime(newTime);
                    // Auto-select location for the time slot (only one location per time possible)
                    if (
                      newTime &&
                      appointmentMode === "in-person" &&
                      timeSlotMap[newTime]?.[0]?.location_info
                    ) {
                      setSelectedLocation(
                        timeSlotMap[newTime][0].location_info
                      );
                    }
                  }}
                  disabled={availableTimes.length === 0}
                >
                  <option value="">
                    {availableTimes.length === 0
                      ? t("booking.selectDateFirst")
                      : t("booking.selectTime")}
                  </option>
                  {availableTimes.map((time) => {
                    return (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("recommendations.symptoms")}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  rows={3}
                  placeholder={t("recommendations.symptomsPlaceholder")}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>
            </div>

            {/* Error Message */}
            {bookingError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{bookingError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isBooking}
              >
                {t("recommendations.cancel")}
              </button>
              <button
                onClick={proceedToPayment}
                disabled={
                  !bookingDate ||
                  !bookingTime ||
                  isBooking ||
                  (appointmentMode === "in-person" && !selectedLocation)
                }
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isBooking ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("booking.booking")}
                  </>
                ) : (
                  t("booking.proceedToPayment")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Profile Modal */}
      {showProfileModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {getDoctorFullName(selectedDoctor)}
                </h2>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Doctor Header */}
              <div className="flex items-start space-x-4 rtl:space-x-reverse mb-6">
                <div className="h-24 w-24 flex-shrink-0">
                  {selectedDoctor.avatar ? (
                    <img
                      className="h-24 w-24 rounded-full object-cover"
                      src={selectedDoctor.avatar}
                      alt=""
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-medium text-3xl">
                      {selectedDoctor.first_name.charAt(0)}
                      {selectedDoctor.last_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {getDoctorFullName(selectedDoctor)}
                    </h3>
                  </div>
                  <p className="text-lg text-cyan-600 font-medium">
                    {getSpecialtyTranslation(selectedDoctor.specialty)}
                  </p>
                  <div className="flex items-center mt-2 space-x-4 rtl:space-x-reverse">
                    <span className="text-sm text-gray-600">
                      <Clock className="h-4 w-4 inline mr-1 rtl:ml-1 rtl:mr-0" />
                      {selectedDoctor.years_of_experience || 0}{" "}
                      {t("recommendations.yearsExperience")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {selectedDoctor.bio && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {t("recommendations.bio")}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedDoctor.bio}
                  </p>
                </div>
              )}

              {/* Feedback Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  {t("recommendations.patientReviews")}
                </h4>

                {loadingFeedbacks ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading reviews...</p>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {t("recommendations.noReviewsYet")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        {/* Patient Info and Rating */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {feedback.patient.avatar ? (
                              <img
                                src={feedback.patient.avatar}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-medium">
                                {feedback.patient.first_name?.charAt(0) || "P"}
                                {feedback.patient.last_name?.charAt(0) || "P"}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {getPatientFullName(feedback.patient)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(feedback.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Patient Comment */}
                        <p className="text-gray-700 mb-3">{feedback.comment}</p>

                        {/* Doctor Reply */}
                        {feedback.doctor_reply && (
                          <div className="ml-4 pl-4 border-l-2 border-cyan-500 bg-white rounded-r-lg p-3">
                            <div className="flex items-center mb-2">
                              <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center mr-2">
                                {selectedDoctor.avatar ? (
                                  <img
                                    src={selectedDoctor.avatar}
                                    alt=""
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-cyan-600 font-medium text-sm">
                                    {selectedDoctor.first_name.charAt(0)}
                                    {selectedDoctor.last_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-cyan-600">
                                Doctor's Response
                              </p>
                            </div>
                            <p className="text-gray-700 text-sm">
                              {feedback.doctor_reply}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 rtl:space-x-reverse">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleBookAppointment(selectedDoctor);
                  }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <Calendar className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t("recommendations.bookAppointment")}
                </button>
                <button
                  onClick={() => toggleFavorite(selectedDoctor.id)}
                  disabled={togglingFavorite === selectedDoctor.id}
                  className={`px-6 py-3 rounded-md font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    favorites.includes(selectedDoctor.id)
                      ? "bg-red-50 border-2 border-red-500 text-red-600 hover:bg-red-100"
                      : "bg-gray-50 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                  }`}
                  title={
                    favorites.includes(selectedDoctor.id)
                      ? t("recommendations.removeFromFavorites")
                      : t("recommendations.addToFavorites")
                  }
                >
                  <Heart
                    className={`h-5 w-5 ${
                      favorites.includes(selectedDoctor.id)
                        ? "fill-red-500"
                        : ""
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {favorites.includes(selectedDoctor.id)
                      ? t("recommendations.removeFromFavorites")
                      : t("recommendations.addToFavorites")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {showBookingSuccess && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-96 max-w-full mx-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t("recommendations.bookingSuccess")}
            </h2>
            <p className="text-gray-600 mb-4">
              {t("recommendations.bookingSuccessMessage")}{" "}
              {getDoctorFullName(selectedDoctor)}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-700">
                <p className="font-medium">
                  {getDoctorFullName(selectedDoctor)}
                </p>
                <p>{getSpecialtyTranslation(selectedDoctor.specialty)}</p>
                {confirmedBooking && (
                  <>
                    <p className="mt-2">
                      {t("recommendations.date")}: {confirmedBooking.date}
                    </p>
                    <p>
                      {t("recommendations.time")}: {confirmedBooking.time}
                    </p>
                    <p className="mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          confirmedBooking.mode === "online"
                            ? "bg-blue-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {confirmedBooking.mode === "online"
                          ? `🌐 ${translateMode("online")}`
                          : `🏥 ${translateMode("in-person")}`}
                      </span>
                    </p>
                    {confirmedBooking.location && (
                      <p className="mt-1 text-gray-600">
                        📍 {confirmedBooking.location}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setShowBookingSuccess(false);
                setSelectedDoctor(null);
                setConfirmedBooking(null);
              }}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              {t("recommendations.close")}
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {getDoctorFullName(selectedDoctor)}'s Weekly Schedule
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {loadingSchedule ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading schedule...</p>
                </div>
              ) : appointmentSlots.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-lg">No schedule available</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Doctor hasn't configured appointment time slots yet
                  </p>
                </div>
              ) : (
                <>
                  {/* Available Days */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ]
                      .map((day) => {
                        const daySlots = appointmentSlots.filter(
                          (slot) => slot.day_of_week === day && slot.is_active
                        );
                        return { day, slots: daySlots };
                      })
                      .filter(({ slots }) => slots.length > 0)
                      .map(({ day, slots }) => (
                        <div
                          key={day}
                          className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200"
                        >
                          <div className="flex items-center mb-3">
                            <div className="w-1 h-6 bg-cyan-600 rounded-full mr-3"></div>
                            <h4 className="text-base font-bold text-gray-900">
                              {translateDay(day)}
                            </h4>
                          </div>
                          <div className="space-y-2 ml-4">
                            {slots.map((slot: any) => (
                              <div
                                key={slot.id}
                                className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-200"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-gray-900">
                                      {slot.start_time.substring(0, 5)} -{" "}
                                      {slot.end_time.substring(0, 5)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                        slot.mode === "online"
                                          ? "bg-blue-500 text-white"
                                          : "bg-green-500 text-white"
                                      }`}
                                    >
                                      {slot.mode === "online"
                                        ? `🌐 ${translateMode("online")}`
                                        : `🏥 ${translateMode("in-person")}`}
                                    </span>
                                    {slot.mode === "in-person" &&
                                      slot.location_info && (
                                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                                          📍 {slot.location_info.name}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Show info if no available days */}
                  {appointmentSlots.filter((slot) => slot.is_active).length ===
                    0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">
                        No active appointment slots configured
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={async () => {
          setShowPaymentModal(false);
          await confirmBooking();
        }}
        doctorName={selectedDoctor ? getDoctorFullName(selectedDoctor) : ""}
        appointmentMode={appointmentMode}
        consultationFee={consultationFee}
        appointmentId={pendingAppointmentId || undefined}
      />
    </div>
  );
};

export default Recommendations;
