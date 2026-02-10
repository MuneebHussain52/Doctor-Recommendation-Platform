export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  location: string;
  avatar?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  languages: string[];
  experience: number;
  rating: number;
  consultationFee: number;
  avatar?: string;
  availability: {
    date: string;
    slots: string[];
  }[];
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctor: Doctor;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  type: string;
  isFollowUp: boolean;
  symptoms?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_by?: string; // 'patient', 'doctor', or 'admin'
  cancelled_at?: string;
  reschedule_reason?: string;
  rescheduled_by?: string; // 'patient', 'doctor', or 'admin'
  rescheduled_at?: string;
}

export interface Document {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  type: string;
  url: string;
}

export interface Feedback {
  id: string;
  appointmentId: string;
  doctorId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Symptom {
  id: string;
  name: string;
  category: string;
}