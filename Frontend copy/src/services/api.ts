const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }
  return response.json();
}

// Doctor API
export const doctorAPI = {
  // Get dashboard stats
  getDashboardStats: async (doctorId: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/dashboard/stats`);
    return handleResponse(response);
  },

  // Get appointments
  getAppointments: async (doctorId: string, status?: string) => {
    const url = status
      ? `${API_BASE_URL}/doctors/${doctorId}/appointments?status=${status}`
      : `${API_BASE_URL}/doctors/${doctorId}/appointments`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get feedback
  getFeedback: async (doctorId: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/feedback`);
    return handleResponse(response);
  },

  // Get profile
  getProfile: async (doctorId: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/profile`);
    return handleResponse(response);
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId: string, status: string, notes?: string) => {
    const response = await fetch(`${API_BASE_URL}/doctors/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    return handleResponse(response);
  }
};

// Patient API
export const patientAPI = {
  // Get dashboard stats
  getDashboardStats: async (patientId: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/dashboard/stats`);
    return handleResponse(response);
  },

  // Get appointments
  getAppointments: async (patientId: string, status?: string) => {
    const url = status
      ? `${API_BASE_URL}/patients/${patientId}/appointments?status=${status}`
      : `${API_BASE_URL}/patients/${patientId}/appointments`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get profile
  getProfile: async (patientId: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/profile`);
    return handleResponse(response);
  },

  // Update profile
  updateProfile: async (patientId: string, profileData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return handleResponse(response);
  },

  // Get documents
  getDocuments: async (patientId: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/documents`);
    return handleResponse(response);
  },

  // Upload document
  uploadDocument: async (patientId: string, documentData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(documentData)
    });
    return handleResponse(response);
  },

  // Submit symptoms
  submitSymptoms: async (patientId: string, symptomsData: any) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(symptomsData)
    });
    return handleResponse(response);
  },

  // Get symptoms history
  getSymptomsHistory: async (patientId: string) => {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/symptoms`);
    return handleResponse(response);
  }
};

// Appointment API
export const appointmentAPI = {
  // Get all appointments
  getAllAppointments: async () => {
    const response = await fetch(`${API_BASE_URL}/appointments/`);
    return handleResponse(response);
  },

  // Create appointment
  createAppointment: async (appointmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    return handleResponse(response);
  },

  // Get appointment
  getAppointment: async (appointmentId: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`);
    return handleResponse(response);
  },

  // Update appointment
  updateAppointment: async (appointmentId: string, appointmentData: any) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    return handleResponse(response);
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // Get available slots
  getAvailableSlots: async (doctorId: string, date: string) => {
    const response = await fetch(`${API_BASE_URL}/appointments/available-slots/${doctorId}/${date}`);
    return handleResponse(response);
  }
};

// Feedback API
export const feedbackAPI = {
  // Submit feedback
  submitFeedback: async (feedbackData: any) => {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    return handleResponse(response);
  },

  // Get feedback
  getFeedback: async (feedbackId: string) => {
    const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`);
    return handleResponse(response);
  },

  // Update feedback
  updateFeedback: async (feedbackId: string, feedbackData: any) => {
    const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    return handleResponse(response);
  },

  // Delete feedback
  deleteFeedback: async (feedbackId: string) => {
    const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // Get doctor feedback
  getDoctorFeedback: async (doctorId: string, limit?: number) => {
    const url = limit
      ? `${API_BASE_URL}/feedback/doctor/${doctorId}?limit=${limit}`
      : `${API_BASE_URL}/feedback/doctor/${doctorId}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get patient feedback
  getPatientFeedback: async (patientId: string) => {
    const response = await fetch(`${API_BASE_URL}/feedback/patient/${patientId}`);
    return handleResponse(response);
  }
};