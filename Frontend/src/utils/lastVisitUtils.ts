// Utility functions for calculating last visit dates

export interface AppointmentData {
  id: string;
  patient: {
    name: string;
    [key: string]: any;
  };
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
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

// Get the actual last visit date for a specific patient
export const getLastVisitDate = (patientName: string, appointments: AppointmentData[]): string | null => {
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

// Get all unique patients with their last visit dates
export const getUniquePatients = (appointments: AppointmentData[]) => {
  const completedOrCancelled = appointments
    .filter(a => a.status === 'completed' || a.status === 'cancelled');

  const uniquePatients = new Map();

  completedOrCancelled.forEach(a => {
    if (!uniquePatients.has(a.patient.name)) {
      const lastVisitDate = getLastVisitDate(a.patient.name, appointments);
      uniquePatients.set(a.patient.name, {
        id: a.id,
        name: a.patient.name,
        age: a.patient.age,
        gender: a.patient.gender,
        contactNumber: '',
        email: '',
        lastVisit: lastVisitDate || a.date, // Use actual last visit or fallback to appointment date
        condition: a.reason || '',
        avatar: a.patient.avatar,
        status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
        _appointment: a,
      });
    }
  });

  return Array.from(uniquePatients.values())
    .sort((a, b) => {
      // Sort by most recent last visit
      if (!a.lastVisit && !b.lastVisit) return 0;
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;

      const dateA = parseDateTime(a.lastVisit, '00:00');
      const dateB = parseDateTime(b.lastVisit, '00:00');
      return dateB.getTime() - dateA.getTime();
    });
};

// Format last visit date consistently across components
export const formatLastVisitDate = (dateStr: string): string => {
  if (!dateStr) return '';

  let dateObj: Date;

  // Check if date is in YYYY-MM-DD format (from dummy data)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Parse YYYY-MM-DD format
    const [year, month, day] = dateStr.split('-').map(Number);
    dateObj = new Date(year, month - 1, day);
  }
  // Check if date is in DD-MM-YYYY format
  else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    // Parse DD-MM-YYYY format
    const [day, month, year] = dateStr.split('-').map(Number);
    dateObj = new Date(year, month - 1, day);
  }
  // Fallback: try to parse as is
  else {
    dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return dateStr; // Return original if unparseable
    }
  }

  // Format as DD-MM-YYYY
  return `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth()+1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
};