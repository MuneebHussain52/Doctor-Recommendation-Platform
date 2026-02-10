// Utility functions for appointment management

export interface AppointmentData {
  id: string;
  patient: {
    name: string;
    [key: string]: any;
  };
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  lastVisitAtTimeOfBooking?: string;
  [key: string]: any;
}

// Helper function to parse date in both YYYY-MM-DD and DD-MM-YYYY formats
export const parseDateTime = (dateStr: string, timeStr: string = '00:00'): Date => {
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

// Calculate what the last visit was for a patient at the time a specific appointment was created
export const calculateLastVisitAtTimeOfBooking = (
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  allAppointments: AppointmentData[]
): string | null => {
  const appointmentDateTime = parseDateTime(appointmentDate, appointmentTime);

  // Find all completed appointments for this patient that occurred BEFORE this appointment was created
  const previousCompletedAppointments = allAppointments
    .filter(a =>
      a.patient.name === patientName &&
      a.status === 'completed' &&
      parseDateTime(a.date, a.time).getTime() < appointmentDateTime.getTime()
    )
    .sort((a, b) => {
      // Sort by most recent first
      const dateA = parseDateTime(a.date, a.time);
      const dateB = parseDateTime(b.date, b.time);
      return dateB.getTime() - dateA.getTime();
    });

  // Return the most recent completed appointment before this one
  return previousCompletedAppointments.length > 0
    ? previousCompletedAppointments[0].date
    : null;
};

// Calculate the actual last visit for a patient when creating a new appointment
export const getLastVisitForNewAppointment = (
  patientName: string,
  appointments: AppointmentData[]
): string | null => {
  const patientCompletedAppointments = appointments
    .filter(a => a.patient.name === patientName && a.status === 'completed')
    .sort((a, b) => {
      const dateA = parseDateTime(a.date, a.time);
      const dateB = parseDateTime(b.date, b.time);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });

  return patientCompletedAppointments.length > 0
    ? patientCompletedAppointments[0].date
    : null;
};

// Update existing appointments with historical last visit data
export const addHistoricalLastVisits = (appointments: AppointmentData[]): AppointmentData[] => {
  // Sort appointments by date/time to process chronologically
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = parseDateTime(a.date, a.time);
    const dateB = parseDateTime(b.date, b.time);
    return dateA.getTime() - dateB.getTime();
  });

  return sortedAppointments.map(appointment => {
    if (appointment.lastVisitAtTimeOfBooking !== undefined) {
      // Already has lastVisitAtTimeOfBooking, keep it
      return appointment;
    }

    // Calculate what the last visit was when this appointment was created
    const lastVisit = calculateLastVisitAtTimeOfBooking(
      appointment.patient.name,
      appointment.date,
      appointment.time,
      sortedAppointments
    );

    return {
      ...appointment,
      lastVisitAtTimeOfBooking: lastVisit
    };
  });
};