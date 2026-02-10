import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, FileText, Download, Eye, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Doctor {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  specialty: string;
  phone?: string;
  license_number?: string;
  years_of_experience?: number;
  bio?: string;
  avatar?: string;
  national_id?: string;
  medical_degree?: string;
  medical_license?: string;
  specialist_certificates?: string;
  proof_of_practice?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  created_at: string;
  rejection_reason?: string;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface PendingSpecialty {
  id: string;
  name: string;
  requested_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
}

const Approvals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  // Specialty approval states
  const [pendingSpecialties, setPendingSpecialties] = useState<PendingSpecialty[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<PendingSpecialty | null>(null);
  const [showSpecialtyApproveModal, setShowSpecialtyApproveModal] = useState(false);
  const [showSpecialtyRejectModal, setShowSpecialtyRejectModal] = useState(false);
  const [specialtyRejectionReason, setSpecialtyRejectionReason] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    fetchStats();
    fetchDoctors();
    fetchPendingSpecialties();
  }, [activeTab, searchQuery]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/approvals/stats/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/approvals/`, {
        params: { status: activeTab, search: searchQuery },
        headers: { Authorization: `Token ${token}` }
      });
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingSpecialties = async () => {
    setLoadingSpecialties(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/specialties/pending/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setPendingSpecialties(response.data.specialties || []);
    } catch (error) {
      console.error('Error fetching pending specialties:', error);
      setPendingSpecialties([]);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_BASE_URL}/admin/approvals/${selectedDoctor.id}/approve/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setShowApproveModal(false);
      setShowDetailModal(false);
      fetchStats();
      fetchDoctors();
      showToast('Doctor approved successfully!', 'success');
    } catch (error) {
      console.error('Error approving doctor:', error);
      showToast('Failed to approve doctor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoctor || !rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_BASE_URL}/admin/approvals/${selectedDoctor.id}/reject/`,
        { reason: rejectionReason },
        { headers: { Authorization: `Token ${token}` } }
      );
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason('');
      fetchStats();
      fetchDoctors();
      showToast('Doctor rejected successfully', 'success');
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      showToast('Failed to reject doctor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSpecialty = async () => {
    if (!selectedSpecialty) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_BASE_URL}/admin/specialties/${selectedSpecialty.id}/approve/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setShowSpecialtyApproveModal(false);
      setSelectedSpecialty(null);
      fetchPendingSpecialties();
      fetchDoctors(); // Refresh doctors list as their specialties may have updated
      showToast('Specialty approved successfully!', 'success');
    } catch (error) {
      console.error('Error approving specialty:', error);
      showToast('Failed to approve specialty', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSpecialty = async () => {
    if (!selectedSpecialty || !specialtyRejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_BASE_URL}/admin/specialties/${selectedSpecialty.id}/reject/`,
        { reason: specialtyRejectionReason },
        { headers: { Authorization: `Token ${token}` } }
      );
      setShowSpecialtyRejectModal(false);
      setSelectedSpecialty(null);
      setSpecialtyRejectionReason('');
      fetchPendingSpecialties();
      showToast('Specialty rejected successfully', 'success');
    } catch (error) {
      console.error('Error rejecting specialty:', error);
      showToast('Failed to reject specialty', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Approvals</h1>
        <p className="text-gray-600">Review and manage doctor registration applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="h-10 w-10 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {(['pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab} ({tab === 'pending' ? stats.pending : tab === 'approved' ? stats.approved : stats.rejected})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Pending Specialty Requests Section */}
      {pendingSpecialties.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Specialty Requests</h2>
            <p className="text-sm text-gray-600 mt-1">Review and approve new specialty requests from doctors</p>
          </div>
          <div className="overflow-x-auto">
            {loadingSpecialties ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading specialty requests...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingSpecialties.map((specialty) => (
                    <tr key={specialty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{specialty.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">
                          {specialty.requested_by.first_name} {specialty.requested_by.last_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">{specialty.requested_by.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">
                          {new Date(specialty.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSpecialty(specialty);
                              setShowSpecialtyApproveModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSpecialty(specialty);
                              setShowSpecialtyRejectModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Doctors List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No doctors found in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {doctor.avatar ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={doctor.avatar} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-semibold">
                              {doctor.first_name.charAt(0)}{doctor.last_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {doctor.first_name} {doctor.last_name}
                            {doctor.is_verified && (
                              <CheckCircle className="inline-block ml-1 h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{doctor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.specialty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.years_of_experience || 'N/A'} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(doctor.approval_status)}`}>
                        {doctor.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doctor.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openDetailModal(doctor)}
                        className="text-cyan-600 hover:text-cyan-900 mr-4"
                      >
                        <Eye className="inline h-5 w-5" />
                      </button>
                      {doctor.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowApproveModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            <CheckCircle className="inline h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowRejectModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="inline h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Doctor Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      Dr. {selectedDoctor.first_name} {selectedDoctor.middle_name} {selectedDoctor.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDoctor.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDoctor.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDoctor.license_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Specialty</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDoctor.specialty}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDoctor.years_of_experience || 'N/A'} years</p>
                  </div>
                </div>
                {selectedDoctor.bio && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDoctor.bio}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'National ID', file: selectedDoctor.national_id },
                    { label: 'Medical Degree', file: selectedDoctor.medical_degree },
                    { label: 'Medical License', file: selectedDoctor.medical_license },
                    { label: 'Specialist Certificates', file: selectedDoctor.specialist_certificates },
                    { label: 'Proof of Practice', file: selectedDoctor.proof_of_practice }
                  ].map((doc) => (
                    doc.file && (
                      <div key={doc.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-800"
                          >
                            <Eye className="h-5 w-5" />
                          </a>
                          <a
                            href={doc.file}
                            download
                            className="text-green-600 hover:text-green-800"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Rejection Reason if rejected */}
              {selectedDoctor.approval_status === 'rejected' && selectedDoctor.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-700">{selectedDoctor.rejection_reason}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedDoctor.approval_status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowApproveModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <XCircle className="h-5 w-5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Approve Doctor</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to approve Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}?
                They will be verified and visible to patients.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reject Doctor</h3>
              <p className="text-sm text-gray-500 mb-4">
                Please provide a reason for rejecting Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specialty Approve Confirmation Modal */}
      {showSpecialtyApproveModal && selectedSpecialty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Approve Specialty</h3>
              <p className="text-sm text-gray-500 mb-2">
                Are you sure you want to approve the specialty <strong>"{selectedSpecialty.name}"</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This will add it to the specialty list and update all doctors waiting for this specialty approval.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSpecialtyApproveModal(false);
                    setSelectedSpecialty(null);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveSpecialty}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specialty Reject Confirmation Modal */}
      {showSpecialtyRejectModal && selectedSpecialty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reject Specialty</h3>
              <p className="text-sm text-gray-500 mb-4">
                Please provide a reason for rejecting the specialty <strong>"{selectedSpecialty.name}"</strong> requested by {selectedSpecialty.requested_by.first_name} {selectedSpecialty.requested_by.last_name}:
              </p>
              <textarea
                value={specialtyRejectionReason}
                onChange={(e) => setSpecialtyRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSpecialtyRejectModal(false);
                    setSelectedSpecialty(null);
                    setSpecialtyRejectionReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSpecialty}
                  disabled={actionLoading || !specialtyRejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
