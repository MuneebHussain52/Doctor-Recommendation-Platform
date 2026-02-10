import React, { useState, useEffect } from "react";
import { useAppointmentContext } from "../../context/AppointmentContext";
import StatCard from "../../components/Doctor/Dashboard/StatCard";
import AppointmentTable from "../../components/Doctor/Dashboard/AppointmentTable";
import PatientFeedback from "../../components/Doctor/Dashboard/PatientFeedback";
import { Users, Calendar, StarIcon, Stethoscope, Loader2 } from "lucide-react";
import WeeklySchedule from "../../components/Doctor/Dashboard/WeeklySchedule";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { workingHours, firstName, middleName, lastName } = useProfile();
  const { doctor } = useAuth();
  const { appointments } = useAppointmentContext();
  const [appointmentSlots, setAppointmentSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    todaysAppointments: 0,
    totalPatients: 0,
    averageRating: 0,
    thisWeekConsultations: 0,
  });

  // Fetch dashboard stats from backend
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!doctor?.id) return;

      setStatsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/doctors/${doctor.id}/dashboard_stats/`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("[Dashboard] Stats from backend:", data);
          setDashboardStats({
            todaysAppointments: data.todaysAppointments || 0,
            totalPatients: data.totalPatients || 0,
            averageRating: data.averageRating || 0,
            thisWeekConsultations: data.thisWeekConsultations || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [doctor]);

  // Fetch appointment slots
  useEffect(() => {
    const fetchSlots = async () => {
      if (!doctor?.id) return;

      setSlotsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/doctors/${doctor.id}/appointment_slots/`
        );
        if (response.ok) {
          const data = await response.json();
          setAppointmentSlots(data);
        }
      } catch (error) {
        console.error("Failed to fetch appointment slots:", error);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [doctor]);

  // Update overall loading state
  useEffect(() => {
    setLoading(statsLoading || slotsLoading);
  }, [statsLoading, slotsLoading]);

  console.log(
    "[Dashboard] Rendering with",
    appointments.length,
    "appointments"
  );

  const stats = [
    {
      id: "1",
      title: "Today's Appointments",
      value: dashboardStats.todaysAppointments,
      icon: Calendar,
      color: "cyan",
    },
    {
      id: "2",
      title: "Total Patients",
      value: dashboardStats.totalPatients,
      icon: Users,
      color: "blue",
    },
    {
      id: "3",
      title: "Average Rating",
      value: dashboardStats.averageRating.toFixed(1),
      icon: StarIcon,
      color: "amber",
    },
    {
      id: "4",
      title: "Consultations This Week",
      value: dashboardStats.thisWeekConsultations,
      icon: Stethoscope,
      color: "purple",
    },
  ];

  // Only show upcoming appointments in dashboard table
  const upcomingAppointments = appointments.filter(
    (a) => a.status === "upcoming"
  );

  // Loading skeleton for stats
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading skeleton for appointment table
  const AppointmentTableSkeleton = () => (
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Loading skeleton for weekly schedule
  const ScheduleSkeleton = () => (
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, Dr. {firstName}
          {middleName ? ` ${middleName}` : ""} {lastName}. Here's what's
          happening today.
        </p>
      </div>

      {/* Stats Section */}
      {statsLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <StatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>
      )}

      {/* Appointments and Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {loading ? (
            <AppointmentTableSkeleton />
          ) : (
            <AppointmentTable appointments={upcomingAppointments} />
          )}
        </div>
        <div>
          <PatientFeedback />
        </div>
      </div>

      {/* Weekly Schedule Section */}
      <div className="mb-6">
        {slotsLoading ? (
          <ScheduleSkeleton />
        ) : (
          <>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-900 m-0">
                Weekly Schedule
              </h3>
              <Link
                to="/doctor/schedule"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
              >
                Change Schedule
              </Link>
            </div>
            <WeeklySchedule
              schedule={workingHours}
              appointmentSlots={appointmentSlots}
              hideTitle
            />
          </>
        )}
      </div>

      {/* Global loading overlay (optional, for initial page load) */}
      {loading && statsLoading && slotsLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-cyan-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
