export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  rating: number;
  is_blocked?: boolean;
  block_reason?: string;
  blocked_at?: string;
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  doctor_info?: Doctor; // API sometimes returns doctor_info instead of doctor
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  type: string;
  location: string;
  mode?: string;
  isFollowUp: boolean;
  symptoms: string;
  canCancel: boolean;
  feedbackGiven?: boolean;
  doctorsNote?: string;
  cancellation_reason?: string;
  cancelled_by?: string; // 'patient', 'doctor', or 'admin'
  cancelled_at?: string;
  appointment_started?: boolean;
  reschedule_reason?: string;
  rescheduled_by?: string; // 'patient', 'doctor', or 'admin'
  rescheduled_at?: string;
  completion_request_status?: string; // 'requested', 'accepted', 'rejected'
  document_request_status?: string; // 'requested', 'accepted', 'rejected'
}
