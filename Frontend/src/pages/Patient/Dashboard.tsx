import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Calendar, CheckCircle, MessageSquare, Clock } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../context/AuthContext";

interface OutletContextType {
  profileName: string;
  setProfileName: (name: string) => void;
  profileAvatar: string;
  setProfileAvatar: (avatar: string) => void;
  appointments: any[];
  setAppointments: (appointments: any[]) => void;
}

interface DashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  thisMonthAppointments: number;
  completedFeedback: number;
  pendingFeedback: number;
}

const PatientDashboard = () => {
  const { profileName, appointments: allAppointments } = useOutletContext<OutletContextType>();
  const { patient } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Helper function to translate specialty names
  const getSpecialtyTranslation = (specialty: string): string => {
    const translationKey = `specialty.${specialty}`;
    const translation = t(translationKey);
    if (translation !== translationKey) {
      return translation;
    }
    return specialty;
  };

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    thisMonthAppointments: 0,
    completedFeedback: 0,
    pendingFeedback: 0,
  });

  // Fetch dashboard statistics from backend
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!patient?.id) return;

      try {
        const response = await fetch(`http://localhost:8000/api/patients/${patient.id}/dashboard_stats/`);
        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data);
        }
      } catch (error) {
        console.error('[PatientDashboard] Failed to fetch dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, [patient, allAppointments]); // Re-fetch when appointments change

  // Sort upcoming appointments by ascending date and time
  const {
    upcomingAppointments,
    stats
  } = useMemo(() => {
    const upcomingAppointments = allAppointments
      .filter(a => a.status === 'upcoming')
      .sort((a, b) => {
        // First sort by date
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateComparison !== 0) return dateComparison;

        // If dates are equal, sort by time
        const timeA = a.time.substring(0, 5); // Get HH:MM format
        const timeB = b.time.substring(0, 5);
        return timeA.localeCompare(timeB);
      })
      .slice(0, 10) // Show top 10 appointments
      .map(a => ({
        ...a,
        formattedTime: a.time.length > 5 ? a.time.substring(0, 5) : a.time
      }));

    const stats = [
      {
        title: t('dashboard.totalAppointments'),
        value: dashboardStats.totalAppointments,
        icon: Calendar,
        color: "bg-blue-50 text-blue-600",
        change: `+${dashboardStats.thisMonthAppointments} ${t('dashboard.thisMonth')}`,
      },
      {
        title: t('dashboard.upcomingAppointmentsTitle'),
        value: dashboardStats.upcomingAppointments,
        icon: Clock,
        color: "bg-amber-50 text-amber-600",
        change: upcomingAppointments[0] ? `${t('dashboard.next')}: ${upcomingAppointments[0].date}` : t('dashboard.noUpcoming'),
      },
      {
        title: t('dashboard.completedFeedback'),
        value: dashboardStats.completedFeedback,
        icon: MessageSquare,
        color: "bg-green-50 text-green-600",
        change: `${dashboardStats.pendingFeedback} ${t('dashboard.pending')}`,
      },
    ];
    return {
      upcomingAppointments,
      stats
    };
  }, [allAppointments, dashboardStats, t]);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{t('dashboard.welcomeBack')}, {profileName.split(' ')[0]}!</h1>
            <p className="text-cyan-100">
              {t('dashboard.youHave')} {upcomingAppointments.length} {upcomingAppointments.length === 1 ? t('dashboard.upcomingAppointments') : t('dashboard.upcomingAppointmentsPlural')}. {t('dashboard.stayHealthy')}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </h3>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments Preview */}
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {t('dashboard.upcomingAppointmentsTitle')}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingAppointments.length === 0 ? (
              <div className="p-6 text-center text-gray-400">{t('dashboard.noUpcomingAppointments')}</div>
            ) : (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1 gap-4">
                        <div className="h-12 w-12 flex-shrink-0">
                          {appointment.doctor.avatar ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={appointment.doctor.avatar}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                              {appointment.doctor.name.charAt(3)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {appointment.doctor.name}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">
                            {getSpecialtyTranslation(appointment.doctor.specialty)}
                          </p>
                          <ReasonCell text={appointment.symptoms && appointment.symptoms.trim() !== '' ? appointment.symptoms : appointment.type} />
                        </div>
                      </div>
                      <div className="w-44 text-right flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.date}
                        </p>
                        <p className="text-sm text-gray-500">{appointment.formattedTime}</p>
                        <div className="flex flex-col items-end gap-1 mt-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}
                          >
                            {t(`dashboard.status.${appointment.status}`)}
                          </span>
                          {appointment.mode && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              appointment.mode === 'online'
                                ? 'bg-blue-500 text-white'
                                : 'bg-green-500 text-white'
                            }`}>
                              {appointment.mode === 'online' ? `🌐 ${t('dashboard.mode.online')}` : `🏥 ${t('dashboard.mode.inPerson')}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
          <div className="p-4 border-t border-gray-200 text-center">
            <button
              className="text-sm text-cyan-600 hover:text-cyan-900 font-medium"
              onClick={() => navigate('/patient/appointments')}
            >
              {t('dashboard.viewAllAppointments')} →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('dashboard.quickActions')}
            </h3>
            <div className="space-y-3">
              <button
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                onClick={() => navigate('/patient/symptoms')}
              >
                {t('dashboard.submitSymptoms')}
              </button>
              <button
                className="w-full border border-cyan-600 text-cyan-600 hover:bg-cyan-50 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                onClick={() => navigate('/patient/recommendations')}
              >
                {t('dashboard.bookAppointment')}
              </button>
              <button
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                onClick={() => navigate('/patient/documents')}
              >
                {t('dashboard.uploadDocuments')}
              </button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

// Small component to clamp long reason text to 3 lines with Read more toggle
const ReasonCell: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const [needsReadMore, setNeedsReadMore] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      setNeedsReadMore(ref.current.scrollHeight > ref.current.clientHeight + 1);
    }
  }, [text]);

  const clampStyle: React.CSSProperties = expanded ? { whiteSpace: 'normal', wordBreak: 'break-word' } : {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as any,
    overflow: 'hidden',
    wordBreak: 'break-word',
    whiteSpace: 'normal'
  };

  return (
    <div className="mt-1">
      <div ref={ref} className="text-xs text-gray-400" style={clampStyle}>
        {text}
      </div>
      {needsReadMore && (
        <button className="text-cyan-600 hover:text-cyan-800 text-xs font-medium mt-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

export default PatientDashboard;
