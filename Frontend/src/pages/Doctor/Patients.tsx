import { useState, useEffect, useRef } from 'react';
import RescheduleModal from '../../components/Doctor/Dashboard/RescheduleModal';
import { useAppointmentContext } from '../../context/AppointmentContext';
import { useDateTimeFormat } from '../../context/DateTimeFormatContext';
import { useAuth } from '../../context/AuthContext';
import { getLastVisitForNewAppointment } from '../../utils/appointmentUtils';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const Patients = () => {
  const { doctor } = useAuth();
  const doctorId = doctor?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAppointment, setScheduleAppointment] = useState<import('../../context/AppointmentContext').Appointment | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpAppointment, setFollowUpAppointment] = useState<import('../../context/AppointmentContext').Appointment | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<{ reason: string; cancelled_by: string } | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<import('../../context/AppointmentContext').Appointment | null>(null);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Pagination state
  const [displayCount, setDisplayCount] = useState(30);

  // Schedule (Follow Up) logic, similar to Appointments section
  const { setAppointments, appointments } = useAppointmentContext();
  const handleSchedule = (appointment: import('../../context/AppointmentContext').Appointment) => {
    setScheduleAppointment(appointment);
    setScheduleOpen(true);
  };
  const handleScheduleSubmit = (date: string, time: string, mode: string, reason?: string) => {
    if (scheduleAppointment) {
      // Format date as dd-mm-yyyy
      const d = new Date(date);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const formattedDate = `${dd}-${mm}-${yyyy}`;
      setAppointments(prev => {
        const maxId = Math.max(...prev.map(a => parseInt(a.id, 10) || 0), 0);
        const lastVisit = getLastVisitForNewAppointment(scheduleAppointment.patient.name, prev);
        const finalReason = reason || scheduleAppointment.reason;
        const newAppointment = {
          ...scheduleAppointment,
          id: String(maxId + 1),
          date: formattedDate,
          time,
          mode,
          status: 'upcoming' as const,
          notes: '',
          reason: finalReason,
          lastVisitAtTimeOfBooking: lastVisit || undefined,
        };
        return [...prev, newAppointment];
      });
      setScheduleOpen(false);
      setScheduleAppointment(null);
    }
  };

  // Handle reschedule for cancelled appointments
  const handleReschedule = (appointment: import('../../context/AppointmentContext').Appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (date: string, time: string, mode: string, reason?: string, locationId?: string, rescheduleReason?: string) => {
    if (!rescheduleAppointment) return;

    try {
      const finalReason = reason || rescheduleAppointment.reason;

      // If rescheduling from cancelled appointments, CREATE a new appointment (not update)
      if (rescheduleAppointment.status === 'cancelled') {
        // Generate unique appointment ID
        const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const requestData: any = {
          id: appointmentId,
          patient: rescheduleAppointment.patient.id,
          doctor: doctorId,
          appointment_date: date,
          appointment_time: time,
          appointment_mode: mode,
          appointment_type: rescheduleAppointment.type,
          reason: finalReason,
          status: 'upcoming'
        };

        // Add location for in-person appointments
        if (mode === 'in-person' && locationId) {
          requestData.location = locationId;
        }

        console.log('[Reschedule - Patients] Creating new appointment from cancelled:', requestData);

        // Create new appointment
        const response = await fetch('http://localhost:8000/api/appointments/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error('Failed to create rescheduled appointment');
        }

        const newAppointmentData = await response.json();

        // Transform and add to appointments list
        const transformedAppointment = {
          id: newAppointmentData.id,
          patient: {
            id: newAppointmentData.patient,
            name: rescheduleAppointment.patient.name,
            age: rescheduleAppointment.patient.age,
            gender: rescheduleAppointment.patient.gender,
            avatar: rescheduleAppointment.patient.avatar,
          },
          date: newAppointmentData.appointment_date,
          time: newAppointmentData.appointment_time,
          duration: '30 minutes',
          type: newAppointmentData.appointment_type,
          status: newAppointmentData.status as 'upcoming',
          reason: newAppointmentData.reason || '',
          notes: '',
          location: newAppointmentData.location_info?.name || '',
          mode: newAppointmentData.appointment_mode,
          reschedule_reason: '',
          cancellation_reason: '',
          cancelled_by: '',
          prescription_uploaded: false,
        };

        setAppointments(prev => [...prev, transformedAppointment]);
        setRescheduleOpen(false);
        setRescheduleAppointment(null);
      }
    } catch (error) {
      console.error('[Reschedule - Patients] Failed:', error);
      alert('Failed to reschedule appointment. Please try again.');
    }
  };

  // Handle follow up button click
  const handleFollowUp = (appointment: import('../../context/AppointmentContext').Appointment) => {
    setFollowUpAppointment(appointment);
    setFollowUpOpen(true);
  };

  // Handle follow up submit
  const handleFollowUpSubmit = async (date: string, time: string, mode: string, reason?: string, locationId?: string) => {
    if (!followUpAppointment) return;

    try {
      const finalReason = reason || followUpAppointment.reason;

      // Generate unique appointment ID
      const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const requestData: any = {
        id: appointmentId,
        patient: followUpAppointment.patient.id,
        doctor: doctorId,
        appointment_date: date,
        appointment_time: time,
        appointment_mode: mode,
        appointment_type: 'Follow-up',
        reason: finalReason,
        status: 'upcoming'
      };

      // Add location for in-person appointments
      if (mode === 'in-person' && locationId) {
        requestData.location = locationId;
      }

      console.log('[Follow-up - Patients] Creating appointment with data:', requestData);

      // Create new appointment
      const response = await fetch('http://localhost:8000/api/appointments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Failed to create follow-up appointment');
      }

      const newAppointmentData = await response.json();

      // Transform and add to appointments list
      const transformedAppointment = {
        id: newAppointmentData.id,
        patient: {
          id: newAppointmentData.patient,
          name: followUpAppointment.patient.name,
          age: followUpAppointment.patient.age,
          gender: followUpAppointment.patient.gender,
          avatar: followUpAppointment.patient.avatar,
        },
        date: newAppointmentData.appointment_date,
        time: newAppointmentData.appointment_time,
        duration: '30 minutes',
        type: newAppointmentData.appointment_type,
        status: newAppointmentData.status as 'upcoming',
        reason: newAppointmentData.reason || '',
        notes: '',
        location: newAppointmentData.location_info?.name || '',
        mode: newAppointmentData.appointment_mode,
        reschedule_reason: '',
        cancellation_reason: '',
        cancelled_by: '',
        prescription_uploaded: false,
      };

      setAppointments(prev => [...prev, transformedAppointment]);
      setFollowUpOpen(false);
      setFollowUpAppointment(null);
    } catch (error) {
      console.error('[Follow-up - Patients] Failed:', error);
      alert('Failed to create follow-up appointment. Please try again.');
    }
  };

  // Handle view prescriptions
  const handleViewPrescriptions = async (appointment: import('../../context/AppointmentContext').Appointment) => {
    setLoadingPrescriptions(true);
    setPrescriptionModalOpen(true);
    setPrescriptions([]);

    try {
      // First fetch the full appointment data to get the actual patient ID
      const appointmentResponse = await fetch(`http://localhost:8000/api/appointments/${appointment.id}/`);
      const appointmentData = await appointmentResponse.json();
      const patientId = appointmentData.patient;

      // Fetch all documents for this patient
      const response = await fetch(`http://localhost:8000/api/patients/${patientId}/documents/`);

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const documents = await response.json();

      // Filter for prescriptions linked to this specific appointment
      const appointmentPrescriptions = documents.filter((doc: any) => {
        // Handle both string and number comparison for appointment ID
        return doc.category === 'Prescription' && (
          doc.appointment === appointment.id ||
          String(doc.appointment) === String(appointment.id)
        );
      });

      setPrescriptions(appointmentPrescriptions);
      setLoadingPrescriptions(false);
    } catch (error) {
      console.error('[Doctor Patients] Failed to fetch prescriptions:', error);
      setPrescriptions([]);
      setLoadingPrescriptions(false);
    }
  };

  // No patient data (dummy data removed)
  // Get appointments from context (already destructured at the top)
  const { formatDate, formatTime } = useDateTimeFormat();

  // Helper function to parse date in both YYYY-MM-DD and DD-MM-YYYY formats
  const parseDateTime = (dateStr: string, timeStr: string) => {
    let year: number, month: number, day: number;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // YYYY-MM-DD format
      [year, month, day] = dateStr.split('-').map(Number);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      // DD-MM-YYYY format
      [day, month, year] = dateStr.split('-').map(Number);
    } else {
      // Fallback to Date.parse
      const fallbackDate = new Date(dateStr);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate;
      }
      return new Date(0); // Invalid date fallback
    }

    const [hour, minute] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hour || 0, minute || 0);
  };

  // Get ALL completed and cancelled appointments (not just unique patients)
  // This creates a complete appointment history
  const appointmentHistory = appointments
    .filter(a => a.status === 'completed' || a.status === 'cancelled')
    .map(a => ({
      id: a.id,
      name: a.patient.name,
      age: a.patient.age,
      gender: a.patient.gender,
      contactNumber: '',
      email: '',
      appointmentDate: a.date, // The actual appointment date
      condition: a.reason || '',
      avatar: a.patient.avatar,
      status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
      type: a.type,
      mode: a.mode,
      notes: a.notes,
      _appointment: a,
    }))
    .sort((a, b) => {
      // Sort by most recent appointment date and time first
      const dateA = parseDateTime(a.appointmentDate, a._appointment.time);
      const dateB = parseDateTime(b.appointmentDate, b._appointment.time);
      return dateB.getTime() - dateA.getTime();
    });

  const filteredHistory = appointmentHistory.filter(
    (record) => {
      const matchesSearch =
        record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'completed' && record.status === 'Completed') ||
        (filterStatus === 'cancelled' && record.status === 'Cancelled');
      return matchesSearch && matchesStatus;
    }
  );

  // Apply pagination
  const totalCount = filteredHistory.length;
  const displayedHistory = filteredHistory.slice(0, displayCount);
  const hasMore = totalCount > displayCount;

  // Reason cell component: clamps to 3 lines and shows a Read more toggle
  const ReasonCell: React.FC<{ typeText: string; conditionText: string }> = ({ typeText, conditionText }) => {
    const [expanded, setExpanded] = useState(false);
    const [needsReadMore, setNeedsReadMore] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (ref.current) {
        const el = ref.current;
        // If scrollHeight is greater than clientHeight then we have overflow
        setNeedsReadMore(el.scrollHeight > el.clientHeight + 1);
      }
    }, [conditionText]);

    const clampStyle: React.CSSProperties = expanded ? { whiteSpace: 'normal', wordBreak: 'break-word' } : {
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical' as any,
      overflow: 'hidden',
      wordBreak: 'break-word',
      whiteSpace: 'normal'
    };

    return (
      <div className="max-w-full">
        <div className="text-sm font-medium text-gray-900">{typeText}</div>
        <div ref={ref} className="text-xs text-gray-500 mt-1" style={clampStyle}>
          {conditionText}
        </div>
        {needsReadMore && (
          <button
            className="text-cyan-600 hover:text-cyan-800 text-xs font-medium mt-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointment History</h1>
        <p className="text-gray-600">Complete history of all completed and cancelled appointments</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search appointments by patient name, condition, or type"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setFilterOpen((open) => !open)}
              >
                <Filter className="h-4 w-4" />
              </button>
              {filterOpen && (
                <div className="absolute left-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow z-10">
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'all' ? 'font-bold text-cyan-700' : ''}`}
                    onClick={() => { setFilterStatus('all'); setFilterOpen(false); }}
                  >
                    All
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'completed' ? 'font-bold text-green-700' : ''}`}
                    onClick={() => { setFilterStatus('completed'); setFilterOpen(false); }}
                  >
                    Completed
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${filterStatus === 'cancelled' ? 'font-bold text-red-700' : ''}`}
                    onClick={() => { setFilterStatus('cancelled'); setFilterOpen(false); }}
                  >
                    Cancelled
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredHistory.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" style={{width: '220px'}} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" style={{width: '180px'}} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment Date
                  </th>
                  <th scope="col" style={{width: '360px'}} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Reason
                  </th>
                  <th scope="col" style={{width: '100px'}} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th scope="col" style={{width: '120px'}} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" style={{width: '140px'}} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {record.avatar ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={record.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                            {record.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        <div className="text-xs text-gray-500">
                          {record.age} yrs, {record.gender}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(record.appointmentDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(record._appointment.time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top" style={{width: '360px'}}>
                    <ReasonCell typeText={record.type} conditionText={record.condition} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {record.mode || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.status === 'Cancelled' && record._appointment.cancelled_by === 'doctor' ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Cancelled by You
                        </span>
                        {record._appointment.cancellation_reason && (
                          <button
                            className="text-xs text-red-600 hover:text-red-900 underline text-left"
                            onClick={() => {
                              setSelectedReason({
                                reason: record._appointment.cancellation_reason || '',
                                cancelled_by: record._appointment.cancelled_by || ''
                              });
                              setReasonModalOpen(true);
                            }}
                          >
                            View Reason
                          </button>
                        )}
                      </div>
                    ) : record.status === 'Cancelled' && record._appointment.cancelled_by === 'patient' ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          Cancelled by Patient
                        </span>
                        {record._appointment.cancellation_reason && (
                          <button
                            className="text-xs text-orange-600 hover:text-orange-900 underline text-left"
                            onClick={() => {
                              setSelectedReason({
                                reason: record._appointment.cancellation_reason || '',
                                cancelled_by: record._appointment.cancelled_by || ''
                              });
                              setReasonModalOpen(true);
                            }}
                          >
                            View Reason
                          </button>
                        )}
                      </div>
                    ) : (
                      <span
                        className={
                          record.status === 'Completed'
                            ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                            : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
                        }
                      >
                        {record.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {record.status === 'Cancelled' ? (
                      <div className="flex flex-row flex-wrap gap-2 items-center justify-center">
                        <button
                          className="text-cyan-600 hover:text-cyan-900"
                          onClick={() => handleReschedule(record._appointment)}
                        >
                          Reschedule
                        </button>
                        {record._appointment.prescription_uploaded && (
                          <button
                            className="text-cyan-600 hover:text-cyan-900"
                            onClick={() => handleViewPrescriptions(record._appointment)}
                          >
                            View Prescription
                          </button>
                        )}
                      </div>
                    ) : record.status === 'Completed' ? (
                      <div className="flex flex-row flex-wrap gap-2 items-center justify-center">
                        <button
                          className="text-cyan-600 hover:text-cyan-900"
                          onClick={() => handleViewPrescriptions(record._appointment)}
                        >
                          View Prescription
                        </button>
                        <button
                          className="text-cyan-600 hover:text-cyan-900"
                          onClick={() => handleFollowUp(record._appointment)}
                        >
                          Follow Up
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : (
            <div className="py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointment records found</h3>
              <p className="text-gray-500">
                {filterStatus === 'all'
                  ? "No completed or cancelled appointments to display."
                  : `No ${filterStatus.toLowerCase()} appointments found.`
                }
              </p>
            </div>
          )}
        </div>

        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
            <button
              onClick={() => setDisplayCount(prev => prev + 20)}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>

  {/* Removed Patient Statistics, Treatment Plans, and Export Records sections as requested */}

      {/* Follow Up Modal */}
      <RescheduleModal
        open={followUpOpen}
        onClose={() => { setFollowUpOpen(false); setFollowUpAppointment(null); }}
        appointment={followUpAppointment as any}
        onSubmit={handleFollowUpSubmit}
        isFollowUp={true}
        doctorId={doctorId}
      />

      {/* Reschedule Modal for Cancelled Appointments */}
      <RescheduleModal
        open={rescheduleOpen}
        onClose={() => { setRescheduleOpen(false); setRescheduleAppointment(null); }}
        appointment={rescheduleAppointment as any}
        onSubmit={handleRescheduleSubmit}
        isFollowUp={false}
        doctorId={doctorId}
      />

      {/* Prescription View Modal */}
      {prescriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setPrescriptionModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Prescriptions</h2>
            {loadingPrescriptions ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading prescriptions...</p>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No prescriptions were uploaded during this consultation.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription: any) => (
                  <div key={prescription.id} className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-cyan-700 mb-1">{prescription.document_name}</h3>
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(prescription.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={prescription.document_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-sm"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {reasonModalOpen && selectedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => {
                setReasonModalOpen(false);
                setSelectedReason(null);
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Cancellation Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancelled By</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedReason.cancelled_by === 'patient' ? 'Patient' : 'Doctor'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                  {selectedReason.reason}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700"
                onClick={() => {
                  setReasonModalOpen(false);
                  setSelectedReason(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;