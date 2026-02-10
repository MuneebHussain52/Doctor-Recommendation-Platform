import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Patient {
  id?: number;
  name: string;
  age: number;
  gender: string;
  avatar?: string;
}

export interface Appointment {
  id: string;
  patient: Patient;
  date: string;
  time: string;
  duration: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  reason: string;
  notes: string;
  location: string;
  mode?: string;
  lastVisitAtTimeOfBooking?: string; // The last visit date when this appointment was created
  cancellation_reason?: string;
  cancelled_by?: string; // 'patient', 'doctor', or 'admin'
  cancelled_at?: string;
  reschedule_reason?: string;
  rescheduled_by?: string; // 'patient', 'doctor', or 'admin'
  rescheduled_at?: string;
  prescription_uploaded?: boolean;
}

interface AppointmentContextType {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointmentContext = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointmentContext must be used within AppointmentProvider');
  }
  return context;
};

export const AppointmentProvider = ({ children, initial }: { children: ReactNode; initial: Appointment[] }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(initial);
  return (
    <AppointmentContext.Provider value={{ appointments, setAppointments }}>
      {children}
    </AppointmentContext.Provider>
  );
};