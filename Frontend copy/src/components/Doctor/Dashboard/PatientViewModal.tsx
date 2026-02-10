// Format date as '08 Aug 2025'
function formatDate(dateStr: string) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  let dateObj: Date;
  if (dateStr && dateStr.toLowerCase() === 'today') {
    dateObj = today;
  } else if (dateStr && dateStr.toLowerCase() === 'tomorrow') {
    dateObj = tomorrow;
  } else {
    dateObj = new Date(dateStr);
  }
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = dateObj.toLocaleString('default', { month: 'short' });
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

// Get time ago string (e.g., '2 months ago')
function getTimeAgo(dateStr: string) {
  const now = new Date();
  let dateObj: Date;
  if (dateStr && dateStr.toLowerCase() === 'today') {
    dateObj = now;
  } else if (dateStr && dateStr.toLowerCase() === 'tomorrow') {
    dateObj = new Date();
    dateObj.setDate(now.getDate() + 1);
  } else {
    dateObj = new Date(dateStr);
  }
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

import React from 'react';
import { useAppointmentContext } from '../../../context/AppointmentContext';
import { useDateTimeFormat } from '../../../context/DateTimeFormatContext';

interface Patient {
  name: string;
  avatar?: string;
  [key: string]: any;
}

interface Appointment {
  id: string;
  patient: Patient;
  date: string;
  time: string;
  type: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  lastVisitAtTimeOfBooking?: string;
}

interface PatientViewModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const PatientViewModal: React.FC<PatientViewModalProps> = ({ open, onClose, appointment }) => {
  const { formatDate } = useDateTimeFormat();
  if (!open || !appointment) return null;

  const { patient } = appointment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col items-center mb-4">
          {patient.avatar ? (
            <img src={patient.avatar} alt={patient.name} className="w-20 h-20 rounded-full object-cover mb-2" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-500 mb-2">
              {patient.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
          <div className="text-gray-600 text-sm mt-1">
            {patient.gender && <span className="mr-2">{patient.gender}</span>}
            {patient.age !== undefined && <span>Age: {patient.age}</span>}
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">History</h3>
          <div className="text-gray-700 text-sm">
            {appointment.lastVisitAtTimeOfBooking ? (
              <>
                Last visit: <span className="font-medium">{formatDate(appointment.lastVisitAtTimeOfBooking)}</span>
              </>
            ) : (
              <span className="text-gray-500">No previous visits at time of booking</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientViewModal;