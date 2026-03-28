import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Award,
  Briefcase,
  MapPin,
  Star,
  MessageSquare,
  Ban,
  X,
} from 'lucide-react';
import axios from 'axios';

interface AppointmentSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  mode: string;
  location: {
    id: string;
    name: string;
    address: string;
  } | null;
  is_active: boolean;
}

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

interface Doctor {
  id: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  specialty: string;
  phone: string | null;
  avatar: string | null;
  license_number: string | null;
  years_of_experience: number | null;
  bio: string | null;
  appointment_interval: number;
  time_format: string;
  date_format: string;
  month_format: string;
  
  // Document fields
  national_id: string | null;
  medical_degree: string | null;
  medical_license: string | null;
  specialist_certificates: string | null;
  proof_of_practice: string | null;
  
  // Approval status
  approval_status: string;
  is_verified: boolean;
  approved_at: string | null;
  rejection_reason: string | null;
  
  // Blocking status
  is_blocked: boolean;
  block_reason: string | null;
  blocked_at: string | null;
  blocked_by: string | null;
  
  created_at: string;
  updated_at: string;
  total_appointments: number;
}

const DoctorProfile = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string } | null>(null);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchDoctorProfile();
    fetchAppointmentSlots();
    fetchFeedbacks();
  }, [doctorId]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/admin/doctors/${doctorId}/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Doctor profile:', response.data);
      setDoctor(response.data);
    } catch (err: any) {
      console.error('Error fetching doctor profile:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to fetch doctor profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentSlots = async () => {
    try {
      setLoadingSlots(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/doctors/${doctorId}/appointment_slots/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      setAppointmentSlots(response.data);
    } catch (err: any) {
      console.error('Error fetching appointment slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/doctors/${doctorId}/feedback/?limit=10`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      setFeedbacks(response.data);
    } catch (err: any) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleDownloadDocument = (documentUrl: string, documentName: string) => {
    if (!documentUrl) return;
    
    const fullUrl = documentUrl.startsWith('http') ? documentUrl : `${API_BASE_URL}${documentUrl}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = documentName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDocument = (documentUrl: string, documentName: string) => {
    if (!documentUrl) return;
    
    const fullUrl = documentUrl.startsWith('http') ? documentUrl : `${API_BASE_URL}${documentUrl}`;
    setViewingDocument({ url: fullUrl, name: documentName });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Loading doctor profile...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Doctor Profile</h3>
              <p className="mt-1 text-sm text-red-700">{error || 'Doctor not found'}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={fetchDoctorProfile}
                  className="text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
                <button
                  onClick={() => navigate('/admin/doctors')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  Back to Doctors
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/doctors')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Doctors
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Doctor Profile</h1>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {doctor.avatar ? (
                <img
                  className="h-32 w-32 rounded-full object-cover border-4 border-blue-100"
                  src={doctor.avatar.startsWith('http') ? doctor.avatar : `${API_BASE_URL}${doctor.avatar}`}
                  alt={doctor.full_name}
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                  <span className="text-blue-600 font-medium text-4xl">
                    {doctor.first_name?.charAt(0)}{doctor.last_name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  Dr. {doctor.full_name || `${doctor.first_name} ${doctor.last_name}`}
                </h2>
                {doctor.is_verified && (
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                )}
                {doctor.is_blocked && (
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-bold bg-red-100 text-red-800 border-2 border-red-300">
                    <Ban className="h-4 w-4 mr-1" />
                    BLOCKED
                  </span>
                )}
                {doctor.is_blocked && doctor.block_reason && (
                  <button
                    onClick={() => setShowBlockReasonModal(true)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    View Block Reason
                  </button>
                )}
              </div>
              
              <p className="text-lg text-cyan-600 font-medium mb-4">{doctor.specialty}</p>
              
              <div className="flex items-center gap-4 mb-4">
                {getStatusBadge(doctor.approval_status)}
                {doctor.license_number && (
                  <span className="text-sm text-gray-600">
                    License: <span className="font-medium">{doctor.license_number}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-5 w-5 mr-2" />
                  <span className="text-sm">{doctor.email}</span>
                </div>
                {doctor.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 mr-2" />
                    <span className="text-sm">{doctor.phone}</span>
                  </div>
                )}
                {doctor.date_of_birth && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="text-sm">DOB: {formatDate(doctor.date_of_birth)}</span>
                  </div>
                )}
                {doctor.gender && (
                  <div className="flex items-center text-gray-600">
                    <User className="h-5 w-5 mr-2" />
                    <span className="text-sm capitalize">{doctor.gender}</span>
                  </div>
                )}
              </div>

              {doctor.years_of_experience !== null && (
                <div className="flex items-center text-gray-600 mb-4">
                  <Briefcase className="h-5 w-5 mr-2" />
                  <span className="text-sm">{doctor.years_of_experience} years of experience</span>
                </div>
              )}

              {doctor.bio && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">About</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{doctor.total_appointments || 0}</p>
              <p className="text-sm text-gray-600">Total Appointments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{doctor.appointment_interval} min</p>
              <p className="text-sm text-gray-600">Appointment Duration</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{doctor.time_format === '12h' ? '12-hour' : '24-hour'}</p>
              <p className="text-sm text-gray-600">Time Format</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{doctor.date_format}</p>
              <p className="text-sm text-gray-600">Date Format</p>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Documents Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Award className="h-5 w-5 mr-2 text-blue-600" />
            Professional Documents
          </h3>
          <p className="text-sm text-gray-600 mt-1">View and verify uploaded credentials</p>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentCard
              title="National ID"
              documentUrl={doctor.national_id}
              onView={handleViewDocument}
              onDownload={handleDownloadDocument}
            />
            <DocumentCard
              title="Medical Degree"
              documentUrl={doctor.medical_degree}
              onView={handleViewDocument}
              onDownload={handleDownloadDocument}
            />
            <DocumentCard
              title="Medical License"
              documentUrl={doctor.medical_license}
              onView={handleViewDocument}
              onDownload={handleDownloadDocument}
            />
            <DocumentCard
              title="Specialist Certificates"
              documentUrl={doctor.specialist_certificates}
              onView={handleViewDocument}
              onDownload={handleDownloadDocument}
            />
            <DocumentCard
              title="Proof of Practice"
              documentUrl={doctor.proof_of_practice}
              onView={handleViewDocument}
              onDownload={handleDownloadDocument}
            />
          </div>

          {!doctor.national_id &&
            !doctor.medical_degree &&
            !doctor.medical_license &&
            !doctor.specialist_certificates &&
            !doctor.proof_of_practice && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No documents uploaded yet</p>
              </div>
            )}
        </div>
      </div>

      {/* Appointment Time Slots Section */}
      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Appointment Time Slots
          </h3>
          <p className="text-sm text-gray-600 mt-1">Doctor's available time slots for appointments</p>
        </div>

        <div className="px-6 py-6">
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
              <span className="text-gray-600">Loading time slots...</span>
            </div>
          ) : appointmentSlots.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No time slots configured yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointmentSlots.map((slot) => (
                <div key={slot.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">{slot.day_of_week}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      slot.mode === 'online' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {slot.mode === 'online' ? '🌐 Online' : '🏥 In-Person'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{slot.start_time} - {slot.end_time}</span>
                  </div>
                  {slot.location && (
                    <div className="flex items-start text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{slot.location.name}</p>
                        <p className="text-xs text-gray-500">{slot.location.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedbacks Section */}
      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Patient Feedbacks
          </h3>
          <p className="text-sm text-gray-600 mt-1">Recent reviews and ratings from patients</p>
        </div>

        <div className="px-6 py-6">
          {loadingFeedbacks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
              <span className="text-gray-600">Loading feedbacks...</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No feedbacks received yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium text-sm">
                          {feedback.patient.first_name.charAt(0)}{feedback.patient.last_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {feedback.patient.first_name} {feedback.patient.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(feedback.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < feedback.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-900">{feedback.rating}</span>
                    </div>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-gray-700 leading-relaxed">{feedback.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approval Information */}
      {(doctor.approval_status === 'approved' || doctor.approval_status === 'rejected') && (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Approval Information</h3>
          </div>
          <div className="px-6 py-4">
            {doctor.approval_status === 'approved' && doctor.approved_at && (
              <div className="flex items-center text-green-700 bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">Approved on {formatDate(doctor.approved_at)}</p>
                  <p className="text-sm text-green-600 mt-1">This doctor is verified and can accept appointments</p>
                </div>
              </div>
            )}
            {doctor.approval_status === 'rejected' && doctor.rejection_reason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-700 mt-1">{doctor.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{viewingDocument.name}</h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <iframe
                src={viewingDocument.url}
                className="w-full h-full border-0 rounded"
                title={viewingDocument.name}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => handleDownloadDocument(viewingDocument.url, viewingDocument.name)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              <button
                onClick={() => setViewingDocument(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Reason Modal */}
      {showBlockReasonModal && doctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Block Reason</h3>
              <button
                onClick={() => setShowBlockReasonModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Dr. {doctor.full_name || `${doctor.first_name} ${doctor.last_name}`} has been blocked by the admin.
              </p>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Reason:</h4>
              <p className="text-sm text-gray-600 bg-red-50 p-3 rounded border border-red-200">
                {doctor.block_reason || 'No reason provided'}
              </p>
            </div>
            {doctor.blocked_at && (
              <div className="mb-4">
                <p className="text-xs text-gray-500">
                  Blocked on: {new Date(doctor.blocked_at).toLocaleString()}
                </p>
              </div>
            )}
            <button
              onClick={() => setShowBlockReasonModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Document Card Component
interface DocumentCardProps {
  title: string;
  documentUrl: string | null;
  onView: (url: string, name: string) => void;
  onDownload: (url: string, name: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ title, documentUrl, onView, onDownload }) => {
  const getFileName = (url: string | null) => {
    if (!url) return 'N/A';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'Document';
  };

  const fileName = getFileName(documentUrl);

  return (
    <div className={`border rounded-lg p-4 ${documentUrl ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <FileText className={`h-5 w-5 mr-2 ${documentUrl ? 'text-blue-600' : 'text-gray-400'}`} />
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        {documentUrl ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-300" />
        )}
      </div>
      
      {documentUrl ? (
        <>
          <p className="text-xs text-gray-600 mb-3 truncate" title={fileName}>{fileName}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onView(documentUrl, title)}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View
            </button>
            <button
              onClick={() => onDownload(documentUrl, fileName)}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 italic">Not uploaded</p>
      )}
    </div>
  );
};

export default DoctorProfile;
