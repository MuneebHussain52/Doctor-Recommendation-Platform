import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileSidebar from "./MobileSidebar";
import { useAppointmentContext } from "../../../context/AppointmentContext";
import { useProfile } from "../../../context/ProfileContext";
import { useFeedback } from "../../../context/FeedbackContext";
import { useAuth } from "../../../context/AuthContext";
import { useDateTimeFormat } from "../../../context/DateTimeFormatContext";
import { doctorAPI } from "../../../services/api";

const Layout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { setAppointments } = useAppointmentContext();
  const { setFeedbacks } = useFeedback();
  const { doctor } = useAuth();
  const {
    setFirstName,
    setMiddleName,
    setLastName,
    setSpecialization,
    setEmail,
    setPhone,
    setBio,
    setProfilePic,
    setWorkingHours,
  } = useProfile();
  const { setTimeFormat, setDateFormat, setMonthFormat } = useDateTimeFormat();
  const [loading, setLoading] = useState(true);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Fetch doctor profile and appointments when layout loads
  // Function to fetch appointments only (for polling)
  const fetchAppointmentsOnly = async () => {
    if (!doctor?.id) return;

    try {
      const data = await doctorAPI.getAppointments(doctor.id);

      // Transform backend data to match frontend format
      const transformedAppointments = data.map((apt: any) => ({
        id: apt.id,
        patient: {
          id: apt.patient,
          name: apt.patient_info.name,
          age: apt.patient_info.age || 0,
          gender: apt.patient_info.gender || "Unknown",
          avatar: apt.patient_info.avatar || undefined,
        },
        date: apt.appointment_date,
        time: apt.appointment_time,
        duration: "30 minutes",
        type: apt.appointment_type,
        status: apt.status,
        reason: apt.reason || "",
        notes: apt.notes || "",
        location: apt.location_info?.name || "",
        mode: apt.appointment_mode,
        reschedule_reason: apt.reschedule_reason || "",
        rescheduled_by: apt.rescheduled_by || "",
        cancellation_reason: apt.cancellation_reason || "",
        cancelled_by: apt.cancelled_by || "",
        prescription_uploaded: apt.prescription_uploaded || false,
      }));

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error("[DoctorLayout] Failed to fetch appointments:", error);
    }
  };

  useEffect(() => {
    const doctorId = doctor?.id;

    if (!doctorId) {
      setLoading(false);
      return;
    }

    const fetchDoctorData = async () => {
      try {
        // Fetch all data in parallel for faster loading
        const [
          profileResponse,
          workingHoursResponse,
          breakTimesResponse,
          appointmentsData,
          feedbackResponse,
        ] = await Promise.all([
          fetch(`http://localhost:8000/api/doctors/${doctor.id}/`),
          fetch(
            `http://localhost:8000/api/doctors/${doctor.id}/working_hours/`
          ),
          fetch(`http://localhost:8000/api/doctors/${doctor.id}/break_times/`),
          doctorAPI.getAppointments(doctor.id),
          fetch(`http://localhost:8000/api/doctors/${doctor.id}/feedback/`),
        ]);

        // Process profile data
        const profileData = await profileResponse.json();
        setFirstName(profileData.first_name || "");
        setMiddleName(profileData.middle_name || "");
        setLastName(profileData.last_name || "");
        setSpecialization(profileData.specialty || "");
        setEmail(profileData.email || "");
        setPhone(profileData.phone || "");
        setBio(profileData.bio || "");
        setProfilePic(profileData.avatar || "");

        // Load date/time format preferences
        if (profileData.time_format) {
          setTimeFormat(profileData.time_format);
        }
        if (profileData.date_format) {
          setDateFormat(profileData.date_format);
        }
        if (profileData.month_format) {
          setMonthFormat(profileData.month_format);
        }

        // Process working hours and break times
        let workingHoursData = [];
        let breakTimesData = [];

        if (workingHoursResponse.ok) {
          workingHoursData = await workingHoursResponse.json();
        } else {
          console.warn(
            "[DoctorLayout] Working hours endpoint returned:",
            workingHoursResponse.status
          );
        }

        if (breakTimesResponse.ok) {
          breakTimesData = await breakTimesResponse.json();
        }

        // Transform working hours to frontend format
        const daysOfWeek = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        const formattedWorkingHours = daysOfWeek.map((day) => {
          const dayData = workingHoursData.find(
            (wh: any) => wh.day_of_week === day
          );
          const dayBreaks = breakTimesData
            .filter((bt: any) => bt.day_of_week === day)
            .map((bt: any) => ({
              start: bt.start_time.substring(0, 5),
              end: bt.end_time.substring(0, 5),
            }));

          if (dayData) {
            return {
              day: day,
              enabled: dayData.is_available,
              start: dayData.start_time.substring(0, 5), // HH:MM format
              end: dayData.end_time.substring(0, 5),
              breaks: dayBreaks,
            };
          }
          return {
            day: day,
            enabled: false,
            start: "09:00",
            end: "17:00",
            breaks: dayBreaks,
          };
        });
        setWorkingHours(formattedWorkingHours);

        // Transform appointments data to match frontend format
        const transformedAppointments = appointmentsData.map((apt: any) => ({
          id: apt.id,
          patient: {
            id: apt.patient,
            name: apt.patient_info.name,
            age: apt.patient_info.age || 0,
            gender: apt.patient_info.gender || "Unknown",
            avatar: apt.patient_info.avatar || undefined,
          },
          date: apt.appointment_date,
          time: apt.appointment_time,
          duration: "30",
          type: apt.appointment_type,
          status: apt.status,
          reason: apt.reason || "",
          notes: apt.notes || "",
          location: apt.location_info?.name || "",
          mode: apt.appointment_mode,
          reschedule_reason: apt.reschedule_reason || "",
          rescheduled_by: apt.rescheduled_by || "",
          cancellation_reason: apt.cancellation_reason || "",
          cancelled_by: apt.cancelled_by || "",
          prescription_uploaded: apt.prescription_uploaded || false,
        }));

        // Debug log to verify transformation
        const rescheduledApts = transformedAppointments.filter(
          (a: any) => a.rescheduled_by
        );
        if (rescheduledApts.length > 0) {
          console.log(
            "[DoctorLayout] Found rescheduled appointments:",
            rescheduledApts.map((a: any) => ({
              id: a.id,
              rescheduled_by: a.rescheduled_by,
              reschedule_reason: a.reschedule_reason,
            }))
          );
        }

        setAppointments(transformedAppointments);

        // Process feedback data
        if (!feedbackResponse.ok) {
          console.error(
            "[DoctorLayout] Failed to fetch feedbacks, status:",
            feedbackResponse.status
          );
          throw new Error(
            `Failed to fetch feedbacks: ${feedbackResponse.status}`
          );
        }

        const feedbackData = await feedbackResponse.json();

        if (!Array.isArray(feedbackData)) {
          console.error(
            "[DoctorLayout] Feedback data is not an array:",
            feedbackData
          );
          throw new Error("Invalid feedback data format");
        }

        // Transform backend data to match frontend format
        const transformedFeedbacks = feedbackData.map((fb: any) => {
          return {
            id: fb.id,
            patient: {
              name: fb.patient_info.name,
              avatar: fb.patient_info.avatar || undefined,
            },
            rating: fb.rating,
            date: new Date(fb.created_at).toLocaleDateString(),
            comment: fb.comment || "",
            doctor_reply: fb.doctor_reply || undefined,
          };
        });

        setFeedbacks(transformedFeedbacks);
        setLoading(false);
      } catch (error) {
        console.error("[DoctorLayout] Failed to fetch doctor data:", error);
        setLoading(false);
      }
    };

    fetchDoctorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor?.id]);

  // Poll for new appointments every 30 seconds
  useEffect(() => {
    if (!doctor?.id) return;

    // Set up polling interval
    const pollInterval = setInterval(() => {
      fetchAppointmentsOnly();
    }, 30000); // Poll every 30 seconds

    // Clean up interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor?.id]); // Only depend on doctor.id, fetchAppointmentsOnly is stable

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleMobileSidebar={toggleMobileSidebar} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">
                Loading doctor data and feedbacks...
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
